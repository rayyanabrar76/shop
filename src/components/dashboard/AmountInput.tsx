'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cleanAmountInput, currencyDecimals, groupAmountInput } from '@/lib/currency'

/**
 * A money field that reads like money: 12000 shows as 12,000 while you type.
 *
 * It has to be a text input. `<input type="number">` only accepts a valid
 * floating point number, and a comma is not one, so a number input can never
 * show a grouped amount however it is styled. Going to text costs the
 * spinner arrows, which is no loss on a price nobody steps by a penny, and
 * buys a filtered field: letters, a second decimal point and a pasted
 * currency symbol are all dropped rather than silently accepted.
 *
 * What leaves here through `onChange` is always plain digits. The grouping
 * exists only in the box, because inputToAmount runs parseFloat and
 * parseFloat stops dead at a comma: hand it "12,000" and a twelve thousand
 * rupee donut quietly becomes a twelve rupee one.
 */
export default function AmountInput({
  value,
  onChange,
  currency,
  className,
  placeholder,
  id,
  'aria-label': ariaLabel,
}: {
  /** Plain digits, e.g. "12000". Never grouped. */
  value: string
  /** Called with plain digits. */
  onChange: (next: string) => void
  currency?: string
  className?: string
  placeholder?: string
  id?: string
  'aria-label'?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  /** Where to put the caret after a grouped re-render, counted in digits. */
  const [caretDigits, setCaretDigits] = useState<number | null>(null)
  const wholeNumbersOnly = currencyDecimals(currency) === 0
  const shown = groupAmountInput(value)

  /*
   * Typing a digit in the middle of "1,234,567" moves every separator after
   * it, so the caret cannot simply stay at the same index. It is restored by
   * counting instead: how many digits were in front of it before, then walk
   * the new string until that many digits have gone by. Done in a layout
   * effect so the caret never paints in the wrong place first.
   */
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || caretDigits === null) return
    let i = 0
    let seen = 0
    while (i < shown.length && seen < caretDigits) {
      if (shown[i] >= '0' && shown[i] <= '9') seen++
      i++
    }
    el.setSelectionRange(i, i)
    setCaretDigits(null)
  }, [caretDigits, shown])

  return (
    <input
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      type="text"
      inputMode={wholeNumbersOnly ? 'numeric' : 'decimal'}
      autoComplete="off"
      value={shown}
      placeholder={placeholder}
      className={className}
      onChange={e => {
        const raw = e.currentTarget.value
        const caret = e.currentTarget.selectionStart ?? raw.length
        const digitsBefore = raw.slice(0, caret).replace(/[^0-9]/g, '').length
        onChange(cleanAmountInput(raw, wholeNumbersOnly))
        setCaretDigits(digitsBefore)
      }}
    />
  )
}
