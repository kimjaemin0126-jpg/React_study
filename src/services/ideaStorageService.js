const IDEAS_KEY = 'folio-ideas-v1'
const DOCUMENTS_KEY = 'folio-documents-v1'
const LEGACY_BACKUP_KEY = 'folio-documents-before-idea-migration-v1'

function readArray(key) {
  const raw = window.localStorage.getItem(key)
  if (raw === null) return null
  const data = JSON.parse(raw)
  if (!Array.isArray(data)) throw new Error('저장된 데이터가 배열이 아닙니다.')
  return data
}

function validateIdeas(ideas) {
  if (!ideas.every((idea) => idea && typeof idea.id === 'string' &&
    typeof idea.title === 'string' && typeof idea.content === 'string')) {
    throw new Error('저장된 아이디어 형식이 올바르지 않습니다.')
  }
  return ideas
}

export function saveIdeas(ideas) {
  window.localStorage.setItem(IDEAS_KEY, JSON.stringify(validateIdeas(ideas)))
}

// 아이디어와 원본 백업 저장이 성공한 뒤에만 문서 목록에서 분리합니다.
export function migrateLegacyIdeas() {
  const documents = readArray(DOCUMENTS_KEY)
  if (!documents?.some((document) => document.isIdea)) return

  const ideas = validateIdeas(readArray(IDEAS_KEY) ?? [])
  const existingIds = new Set(ideas.map((idea) => idea.id))
  const legacy = documents.filter((document) => document.isIdea)
  const movedIds = new Set(legacy.map((document) => document.id))
  const migrated = legacy.filter((document) => !existingIds.has(document.id)).map((document) => ({
    id: document.id,
    title: document.title,
    content: document.blocks.map((block) => block.content).filter(Boolean).join('\n'),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    isDeleted: Boolean(document.isDeleted),
    // 블록 종류와 기존 문서 속성도 복구할 수 있도록 원본을 보관합니다.
    legacyDocument: document,
  }))

  const remaining = documents.filter((document) => !document.isIdea).map((document) => {
    if (!movedIds.has(document.parentId)) return document
    let parentId = document.parentId
    const visited = new Set()
    while (parentId && movedIds.has(parentId)) {
      if (visited.has(parentId)) { parentId = null; break }
      visited.add(parentId)
      parentId = documents.find((parent) => parent.id === parentId)?.parentId ?? null
    }
    return { ...document, parentId }
  })

  if (window.localStorage.getItem(LEGACY_BACKUP_KEY) === null) {
    window.localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify(documents))
  }
  saveIdeas([...ideas, ...migrated])
  window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(remaining))
}

export function loadIdeas() {
  migrateLegacyIdeas()
  return validateIdeas(readArray(IDEAS_KEY) ?? [])
}
