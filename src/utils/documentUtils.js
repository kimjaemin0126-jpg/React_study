export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getDocumentTitle(document) {
  return document.title.trim() || '제목 없음'
}

export function formatRelativeDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '방금 전'
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  if (hours < 48) return '어제'
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(date)
}

export function hasParentCycle(documents, documentId, parentId) {
  let currentId = parentId
  while (currentId) {
    if (currentId === documentId) return true
    currentId = documents.find((item) => item.id === currentId)?.parentId ?? null
  }
  return false
}
