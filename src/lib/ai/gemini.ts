import 'server-only'

/**
 * Gemini client with automatic key rotation.
 *
 * Several keys are configured; when one is exhausted or rate-limited we move to
 * the next rather than failing the request. A key that returns a quota error is
 * parked for a cooldown so we stop paying the latency of retrying a dead key on
 * every subsequent call.
 */

const MODEL = 'gemini-3.5-flash'
/** Used only if the primary model is unavailable for a given key. */
const FALLBACK_MODEL = 'gemini-flash-latest'
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

/** How long a key stays parked after a quota error. */
const COOLDOWN_MS = 10 * 60 * 1000

/**
 * Ceiling for one call, across every key and model it tries.
 *
 * Without this, four keys times two models times the per-attempt timeout is a
 * six-minute worst case — and the caller is a modal with a spinner in it.
 * Giving up and saying so beats an spinner that never resolves.
 */
const TOTAL_BUDGET_MS = 70_000

/** One attempt. Long because the structured-output model is genuinely slow. */
const ATTEMPT_TIMEOUT_MS = 40_000

function keys(): string[] {
  return (process.env.GOOGLE_API_KEY ?? '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
}

/** key -> timestamp it becomes usable again. Module scope: per server instance. */
const parked = new Map<string, number>()

function availableKeys(): string[] {
  const all = keys()
  const now = Date.now()
  const live = all.filter(k => (parked.get(k) ?? 0) <= now)
  // If everything is parked, try them all anyway — a cooldown is a guess, and
  // failing outright is worse than one wasted attempt.
  return live.length > 0 ? live : all
}

/** 429 is quota/rate limit; 403 can also mean the key is disabled or over quota. */
function isQuotaError(status: number): boolean {
  return status === 429 || status === 403
}

export interface GeminiResult {
  text: string
  /** 1-based index of the key that answered — useful in logs, never shown to users. */
  keyIndex: number
}

export class GeminiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'GeminiError'
  }
}

/**
 * Send a prompt to Gemini, walking the key list until one answers.
 * `schema` asks the model for JSON matching that shape.
 */
export async function generateText(
  prompt: string,
  opts: { schema?: Record<string, unknown>; temperature?: number; system?: string } = {},
): Promise<GeminiResult> {
  const all = keys()
  if (all.length === 0) {
    throw new GeminiError('No GOOGLE_API_KEY configured')
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    ...(opts.system
      ? { systemInstruction: { parts: [{ text: opts.system }] } }
      : {}),
    generationConfig: {
      temperature: opts.temperature ?? 0.8,
      ...(opts.schema
        ? { responseMimeType: 'application/json', responseSchema: opts.schema }
        : {}),
    },
  }

  let lastError: GeminiError | null = null
  const deadline = Date.now() + TOTAL_BUDGET_MS

  for (const key of availableKeys()) {
    for (const model of [MODEL, FALLBACK_MODEL]) {
      if (Date.now() >= deadline) {
        throw lastError ?? new GeminiError('Gemini took too long to answer')
      }
      try {
        const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          // Bounded by whichever runs out first: this attempt, or the call.
          signal: AbortSignal.timeout(Math.max(1_000, Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now()))),
        })

        if (res.ok) {
          const data = await res.json()
          const text = data?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text ?? '')
            .join('')
            .trim()
          if (!text) {
            lastError = new GeminiError('Gemini returned an empty response')
            continue
          }
          parked.delete(key)
          return { text, keyIndex: all.indexOf(key) + 1 }
        }

        if (isQuotaError(res.status)) {
          // Park this key and move to the next one.
          parked.set(key, Date.now() + COOLDOWN_MS)
          lastError = new GeminiError('Gemini quota reached', res.status)
          break // no point trying the other model on the same exhausted key
        }

        if (res.status === 404) {
          // Model not available for this key — try the fallback model.
          lastError = new GeminiError(`Model ${model} unavailable`, 404)
          continue
        }

        if (res.status === 503) {
          // Google reports the model itself as overloaded. That is not about
          // this key, so the other model is worth a go before moving on.
          lastError = new GeminiError('Gemini is overloaded right now', 503)
          continue
        }

        lastError = new GeminiError(
          `Gemini request failed (${res.status})`,
          res.status,
        )
      } catch (err) {
        lastError = new GeminiError(
          err instanceof Error ? err.message : 'Gemini request failed',
        )
      }
    }
  }

  throw lastError ?? new GeminiError('Gemini request failed')
}
