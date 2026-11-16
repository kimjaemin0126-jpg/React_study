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
