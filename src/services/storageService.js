const STORAGE_KEY = 'folio-documents-v1'

export function loadDocuments() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('저장된 문서 데이터 형식이 올바르지 않습니다.')
  return parsed
}

export function saveDocuments(documents) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
}
