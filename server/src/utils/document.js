// 프론트의 블록 타입과 맞춘 목록 (src/editor/blockTypes.js 기준)
const BLOCK_TYPES = new Set([
  'paragraph', 'heading1', 'heading2', 'heading3', 'bullet',
  'numbered', 'todo', 'quote', 'divider', 'code',
])

// 블록 배열을 검사하고, 허용된 필드만 남겨서 반환 (잘못되면 null)
export function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0 || blocks.length > 1000) return null

  const cleaned = []
  for (const block of blocks) {
    if (
      !block ||
      typeof block.id !== 'string' ||
      !BLOCK_TYPES.has(block.type) ||
      typeof block.content !== 'string' ||
      block.content.length > 10000
    ) {
      return null
    }
    cleaned.push({ id: block.id, type: block.type, content: block.content, checked: block.checked === true })
  }
  return cleaned
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// 일정은 잘못된 항목만 빼고 나머지를 저장 (한 개 때문에 전체 저장이 막히지 않도록)
function sanitizeEvents(events) {
  if (!Array.isArray(events)) return []
  return events
    .filter((event) =>
      event &&
      typeof event.id === 'string' && event.id.length > 0 && event.id.length <= 100 &&
      typeof event.title === 'string' && event.title.length <= 100 &&
      typeof event.date === 'string' && DATE_PATTERN.test(event.date) &&
      (event.time === undefined || (typeof event.time === 'string' && event.time.length <= 10))
    )
    .slice(0, 500)
    .map((event) => ({ id: event.id, title: event.title, date: event.date, time: event.time ?? '' }))
}

// 스터디의 문서 목록 (하위 페이지, 일정, 할 일 날짜 포함) 검사
export function sanitizeDocs(docs) {
  if (!Array.isArray(docs) || docs.length === 0 || docs.length > 200) return null

  const cleaned = []
  for (const doc of docs) {
    const parentId = doc?.parentId ?? null
    const title = doc?.title ?? ''
    const blocks = sanitizeBlocks(doc?.blocks)
    if (
      !doc ||
      typeof doc.id !== 'string' || doc.id.length === 0 || doc.id.length > 100 ||
      (parentId !== null && (typeof parentId !== 'string' || parentId.length > 100)) ||
      typeof title !== 'string' || title.length > 100 ||
      !blocks
    ) {
      return null
    }

    const startDate = doc.startDate ?? null
    const endDate = doc.endDate ?? null
    if (
      (startDate !== null && !(typeof startDate === 'string' && DATE_PATTERN.test(startDate))) ||
      (endDate !== null && !(typeof endDate === 'string' && DATE_PATTERN.test(endDate)))
    ) {
      return null
    }

    cleaned.push({
      id: doc.id,
      parentId,
      title,
      blocks,
      events: sanitizeEvents(doc.events),
      isTask: doc.isTask === true,
      startDate,
      endDate,
      status: typeof doc.status === 'string' && doc.status.length <= 20 ? doc.status : null,
    })
  }
  return cleaned
}
