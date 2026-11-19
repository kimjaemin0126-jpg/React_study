import { migrateLegacyIdeas } from './ideaStorageService'

const STORAGE_KEY = 'folio-documents-v1'

export function loadDocuments() {
  try {
    migrateLegacyIdeas()
  } catch (error) {
    // 이전 실패 때문에 정상 문서까지 초기 데이터로 바뀌지 않도록 원본을 읽습니다.
    console.error('기존 아이디어를 분리하지 못했습니다. 원본 문서를 유지합니다.', error)
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('저장된 문서 데이터 형식이 올바르지 않습니다.')
  return renameWelcomeHeading(parsed)
}

// 서비스 이름이 Folio에서 MODO(모도)로 바뀌어, 이미 저장된 환영 문서의 문구만 새 이름으로 바꾼다.
const OLD_WELCOME = 'Folio에 오신 것을 환영해요'
const NEW_WELCOME = 'MODO(모도)에 오신 것을 환영해요'

function renameWelcomeHeading(documents) {
  return documents.map((document) => {
    if (!Array.isArray(document.blocks) || !document.blocks.some((block) => block.content === OLD_WELCOME)) return document
    return {
      ...document,
      blocks: document.blocks.map((block) => block.content === OLD_WELCOME ? { ...block, content: NEW_WELCOME } : block),
    }
  })
}

export function saveDocuments(documents) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
}
