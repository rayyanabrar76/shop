import { prisma } from '@/lib/prisma'

/**
 * The shape the editor sends back. Everything is optional except the id,
 * because a section only carries the fields its layout uses.
 */
export interface IncomingSection {
  id: string
  name?: string
  layout?: string
  heading?: string | null
  text?: string | null
  imageUrl?: string | null
  buttonLabel?: string | null
  buttonUrl?: string | null
  buttonVariant?: string | null
  buttonRadius?: string | null
  buttonColor?: string | null
  buttonFont?: string | null
  showButton?: boolean
  categoryIds?: string
  showCount?: boolean
  bgColor?: string | null
  visible?: boolean
}

/** An id the editor invented for a section that has never been saved. */
export const TEMP_ID_PREFIX = 'new-'

/** The columns a section owns, so a write can be built from one object. */
function columns(s: IncomingSection, position: number) {
  return {
    name:          s.name ?? 'Custom Section',
    layout:        s.layout ?? 'heading-text',
    heading:       s.heading ?? '',
    text:          s.text ?? '',
    imageUrl:      s.imageUrl ?? null,
    buttonLabel:   s.buttonLabel ?? null,
    buttonUrl:     s.buttonUrl ?? null,
    buttonVariant: s.buttonVariant ?? null,
    buttonRadius:  s.buttonRadius ?? null,
    buttonColor:   s.buttonColor ?? null,
    buttonFont:    s.buttonFont ?? null,
    showButton:    s.showButton ?? false,
    categoryIds:   s.categoryIds ?? '',
    showCount:     s.showCount ?? false,
    bgColor:       s.bgColor ?? null,
    visible:       s.visible ?? true,
    position,
  }
}

/**
 * Make the stored sections for one page match the list the editor is holding.
 *
 * The editor used to write a row per keystroke, which meant its changes could
 * not be undone: the database had already moved on. It holds them now and
 * sends the whole list here, so this has to work out which rows are new, which
 * changed and which are gone.
 *
 * Order comes from the array, not from a position the client sends. The
 * editor's list IS the order on the page, so deriving it here removes a way
 * for the two to disagree.
 *
 * One transaction: a half-applied save would leave the shop showing sections
 * the merchant deleted next to sections they never finished writing.
 */
export async function reconcileSections(
  storeId: string,
  pageId: string | null,
  incoming: IncomingSection[],
) {
  const existing = await prisma.customSection.findMany({
    where: { storeId, pageId },
    select: { id: true },
  })
  const existingIds = new Set(existing.map(r => r.id))

  // An id the editor invented, or one the database has never heard of. The
  // second case matters: deleting a section in one tab and saving a stale
  // list from another would otherwise update a row that is gone.
  const isNew = (id: string) => id.startsWith(TEMP_ID_PREFIX) || !existingIds.has(id)

  const keptIds = new Set(incoming.filter(s => !isNew(s.id)).map(s => s.id))
  const removed = existing.filter(r => !keptIds.has(r.id)).map(r => r.id)

  await prisma.$transaction([
    ...(removed.length
      ? [prisma.customSection.deleteMany({ where: { id: { in: removed } } })]
      : []),
    ...incoming.map((s, i) =>
      isNew(s.id)
        ? prisma.customSection.create({ data: { storeId, pageId, ...columns(s, i) } })
        : prisma.customSection.update({ where: { id: s.id }, data: columns(s, i) })
    ),
  ])

  // Read back rather than assembling a reply: the client needs the real ids
  // for anything it created, and this is the one answer that cannot drift
  // from what was actually written.
  return prisma.customSection.findMany({
    where: { storeId, pageId },
    orderBy: { position: 'asc' },
  })
}
