import { Sk } from '@/components/ui/Skeleton'

/**
 * The whole editor, greyed out.
 *
 * Deliberately says nothing about the shop. The old placeholder drew the real
 * store name, the real hero image and the real banner text, which meant the
 * loading state was a half-built page rather than a loading state: content
 * appearing in stages reads as the app deciding what to show you, and the eye
 * starts reading it before it is finished.
 *
 * It also covers all three regions at once — toolbar, panel and preview.
 * Revealing them as each becomes ready is honest about the machinery and
 * horrible to sit through, because the screen keeps moving under you.
 *
 * Used twice: as the route's loading.tsx, so opening the editor does not fall
 * back to the theme page's skeleton on the way in, and inside the editor
 * itself until the preview has actually rendered.
 */
export default function EditorSkeleton() {
  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-white dark:bg-zinc-900">
      {/* Toolbar */}
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 px-2 sm:px-4 shrink-0">
        <Sk className="h-5 w-12" />
        <Sk className="h-4 w-28 ml-1" />
        <div className="flex-1" />
        <Sk className="hidden sm:block h-9 w-28 rounded-xl" />
        <div className="flex-1" />
        <Sk className="h-8 w-8 rounded-lg" />
        <Sk className="hidden sm:block h-8 w-8 rounded-lg" />
        <Sk className="hidden sm:block h-8 w-8 rounded-lg" />
        <Sk className="h-9 w-20 rounded-lg" />
      </div>

      <div className="flex flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        {/* Panel. Hidden below lg, where it is a sheet that starts closed and
            so has nothing to stand in for. */}
        <div className="hidden lg:flex w-72 mt-1 mb-1 ml-1 flex-col rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-3 pt-3 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 space-y-1.5">
            <Sk className="h-2.5 w-20" />
            <Sk className="h-9 w-full rounded-xl" />
          </div>
          <div className="flex border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex-1 flex flex-col items-center gap-1.5 py-3">
              <Sk className="h-4 w-4" />
              <Sk className="h-2 w-12" />
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 py-3">
              <Sk className="h-4 w-4" />
              <Sk className="h-2 w-10" />
            </div>
          </div>
          <div className="p-3 space-y-3">
            <Sk className="h-2.5 w-16" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Sk className="h-4 w-4 shrink-0" />
                <Sk className="h-3 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Preview. One block, because a page is one thing and guessing at its
            sections here would be inventing a layout the store may not have.

            The same white card as the panel, with the border and radius the
            real preview wears, so the loading screen has the editor's actual
            shape in it rather than a grey slab where the store goes. It does
            not pulse: the panel card does not either, and the bars inside it
            are already carrying the signal that something is loading.

            Not the Sk helper, which paints zinc-100 — the exact colour of the
            ground here, so the block was rendering and invisible. Dark mode
            had contrast by luck, which is what made it look light-only. */}
        <div className="flex-1 p-1">
          <div className="h-full w-full rounded-[0.625rem] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800" />
        </div>
      </div>
    </div>
  )
}
