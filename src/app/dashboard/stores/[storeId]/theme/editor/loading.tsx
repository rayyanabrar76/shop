import EditorSkeleton from './EditorSkeleton'

/**
 * Without this the editor route falls back to the nearest ancestor's loading
 * file, which is the theme page's. That is why opening the editor flashed the
 * theme page first and then swapped itself in: it was not a redirect, it was
 * the wrong skeleton standing in for a route that had none of its own.
 */
export default function VisualEditorLoading() {
  return <EditorSkeleton />
}
