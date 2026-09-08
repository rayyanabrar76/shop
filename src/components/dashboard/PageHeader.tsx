import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * The title block at the top of a dashboard page.
 *
 * Deliberately not a bar. Every one of these pages used to open with a sticky
 * white strip, a hairline beneath it, and a divider inside it: three lines of
 * chrome drawn around content that already sits in its own rounded card. The
 * page announces itself the way a document does instead, with its own title,
 * and the icon carries the way back.
 *
 * Shared so the pages cannot drift apart. Four hand-written copies of the same
 * header is how a title ends up 14px on one page and 16px on the next. The
 * product and category forms still draw their own, because they need a
 * router.back() and an embedded mode this has no notion of, so any size
 * changed here has to be changed in those three too.
 */
export default function PageHeader({
  storeId,
  icon,
  title,
  count,
  meta,
  action,
  backHref,
  maxWidth = 'max-w-6xl',
}: {
  storeId: string
  /** Shown only on sub-pages, as the breadcrumb back to the parent. Passed
      as an element, not a component: these pages draw from two icon sets
      whose sizing props do not agree. */
  icon?: ReactNode
  title: string
  /** A tally shown as a pill, e.g. the number of orders. */
  count?: number
  /** A quiet aside, e.g. "Last 30 days". */
  meta?: string
  /** Buttons for the right-hand side, e.g. Export CSV. */
  action?: ReactNode
  /** Where the icon leads, e.g. an order detail pointing at the order list.
      Without it there is no crumb at all, which is right for a top-level
      section. */
  backHref?: string
  maxWidth?: string
}) {
  return (
    <div className={`${maxWidth} px-6 pt-6 pb-4 flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-1 min-w-0">
        {/* The icon marks the section either way. What changes is whether it
            is a link: on a sub-page it is the way back to the parent and
            earns a chevron, while on a top-level section there is nowhere to
            go but the store itself, so it sits quietly beside the title
            rather than pretending to be a breadcrumb. */}
        {icon && (
          backHref ? (
            <>
              <Link
                href={backHref}
                aria-label="Back"
                className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                {icon}
              </Link>
              <ChevronRight size={14} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
            </>
          ) : (
            // No sizing box around it: a 32px box centring a 20px glyph adds
            // six invisible pixels on each side, which reads as a gap the
            // title never asked for.
            <span className="shrink-0 flex items-center text-zinc-500">
              {icon}
            </span>
          )
        )}
        <h1 className="truncate text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        {count !== undefined && (
          <span className="ml-2 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            {count}
          </span>
        )}
        {meta && (
          <span className="ml-2 shrink-0 text-[11px] text-zinc-500">{meta}</span>
        )}
      </div>
      {action}
    </div>
  )
}
