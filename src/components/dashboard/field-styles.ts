/**
 * The admin's form field styling, in one place.
 *
 * Every form used to carry its own copy of these strings, which is how the
 * same input ended up with a different border on the product form than on the
 * category form. Tuning happens here now.
 */

/**
 * Text inputs, textareas and selects.
 *
 * The border is deliberately a full step darker than the hairlines used for
 * card edges: a card edge only has to suggest where a surface ends, but a
 * field edge has to say "you can type here". On a white card zinc-300 still
 * was not saying it, so the light theme runs a step darker again; the dark
 * theme is left alone, because a pale line on a dark ground already reads.
 * Focus adds a ring rather than only darkening the border, so the active
 * field is obvious without the border thickening and shifting layout.
 *
 * The fill sits a shade below the card it lives on, so a field reads as a
 * well cut into the surface rather than a rectangle drawn on top of it.
 */
export const inputCls =
  'w-full rounded-xl border border-(--admin-field-border) ' +
  'bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-[13px] ' +
  'text-zinc-900 dark:text-zinc-50 outline-none ' +
  'placeholder:text-zinc-500 ' +
  'transition-[border-color,box-shadow] ' +
  'hover:border-(--admin-field-border-hover) ' +
  'focus:border-(--admin-field-border-focus) ' +
  'focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/10'

/** The same field in an invalid state. */
export const inputErrorCls =
  'border-red-300 dark:border-red-800 focus:border-red-500 dark:focus:border-red-500 ' +
  'focus:ring-red-500/10'

/**
 * Field labels.
 *
 * Small caps at a restrained weight. These were bold with the widest tracking
 * Tailwind offers, which made the labels louder than the values underneath
 * them; the tracking here matches the section headers elsewhere in the admin.
 *
 * At zinc-400 on a white card these were below the contrast floor for text
 * and read as disabled. A label names the field you are about to fill in, so
 * it sits a step above the hint underneath it rather than level with it.
 */
export const labelCls =
  'mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.08em] ' +
  'text-zinc-600 dark:text-zinc-400'

/** The quiet line of explanation under a field. */
export const hintCls = 'mt-1.5 text-[11px] text-zinc-500'
