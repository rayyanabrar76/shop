'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#09090b' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a1a1aa' }}>
              Error
            </p>
            <h1 style={{ marginTop: 8, fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: 12, fontSize: 14, color: '#71717a', lineHeight: 1.6 }}>
              An unexpected error occurred. Our team has been notified and is looking into it.
              {error.digest && (
                <span style={{ display: 'block', marginTop: 6, fontSize: 11, fontFamily: 'monospace', color: '#a1a1aa' }}>
                  Error ID: {error.digest}
                </span>
              )}
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                padding: '10px 20px',
                borderRadius: 12,
                background: '#09090b',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
