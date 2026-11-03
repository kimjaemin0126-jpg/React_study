import test from 'node:test'
import assert from 'node:assert/strict'
import { loadIdeas, saveIdeas, migrateLegacyIdeas } from '../src/services/ideaStorageService.js'

const DOCS = 'folio-documents-v1'
const IDEAS = 'folio-ideas-v1'
const BACKUP = 'folio-documents-before-idea-migration-v1'
const legacy = {
  id: 'idea-1', title: '기존 생각', isIdea: true, parentId: 'parent',
  createdAt: '2026-10-26', updatedAt: '2026-10-27',
  blocks: [{ type: 'heading1', content: '첫 줄' }, { type: 'todo', content: '둘째 줄', checked: true }],
}

function storage(initial = {}, failKey) {
  const data = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]))
  const localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (key === failKey) throw new Error('Quota exceeded')
      data.set(key, value)
    },
  }
  globalThis.window = { localStorage }
  return { data, read: (key) => JSON.parse(localStorage.getItem(key)) }
}

test('새 아이디어 저장·수정·삭제는 문서 저장소를 변경하지 않는다', () => {
  const docs = [{ id: 'doc-1', title: '일반 문서' }]
  const saved = storage({ [DOCS]: docs })
  saveIdeas([{ id: 'new-idea', title: '독립 아이디어', content: '본문' }])
  assert.equal(loadIdeas()[0].title, '독립 아이디어')
  saveIdeas([{ ...loadIdeas()[0], title: '수정' }])
  assert.equal(loadIdeas()[0].title, '수정')
  saveIdeas([])
  assert.deepEqual(loadIdeas(), [])
  assert.deepEqual(saved.read(DOCS), docs)
})

test('기존 아이디어는 원본 백업 후 분리하고 일반 자식 문서는 가장 가까운 문서 부모에 연결한다', () => {
  const docs = [
    { id: 'parent', parentId: null }, legacy,
    { id: 'child', title: '보존할 자식 문서', parentId: legacy.id },
  ]
  const saved = storage({ [DOCS]: docs })
  const ideas = loadIdeas()
  assert.equal(ideas[0].content, '첫 줄\n둘째 줄')
  assert.deepEqual(ideas[0].legacyDocument, legacy)
  assert.deepEqual(saved.read(BACKUP), docs)
  assert.deepEqual(saved.read(DOCS), [docs[0], { ...docs[2], parentId: 'parent' }])
  migrateLegacyIdeas()
  assert.equal(loadIdeas().length, 1)
})

test('전용 저장소 쓰기가 실패하면 원본 문서를 제거하지 않는다', () => {
  const docs = [legacy]
  const saved = storage({ [DOCS]: docs }, IDEAS)
  assert.throws(() => loadIdeas(), /Quota/)
  assert.deepEqual(saved.read(DOCS), docs)
  assert.deepEqual(saved.read(BACKUP), docs)
})

test('문서 정리 쓰기가 실패한 뒤 재시도해도 아이디어가 중복되지 않는다', () => {
  const saved = storage({ [DOCS]: [legacy] }, DOCS)
  assert.throws(() => loadIdeas(), /Quota/)
  const copied = saved.read(IDEAS)
  const retried = storage({ [DOCS]: [legacy], [IDEAS]: copied, [BACKUP]: [legacy] })
  assert.equal(loadIdeas().length, 1)
  assert.deepEqual(retried.read(DOCS), [])
})

test('잘못된 아이디어 데이터는 빈 데이터로 덮어쓰지 않는다', () => {
  const saved = storage({ [DOCS]: [legacy], [IDEAS]: [{ id: 'broken' }] })
  const before = saved.data.get(IDEAS)
  assert.throws(() => loadIdeas(), /형식/)
  assert.equal(saved.data.get(IDEAS), before)
  assert.deepEqual(saved.read(DOCS), [legacy])
})

test('휴지통 아이디어는 삭제 상태와 원본을 보존한다', () => {
  const removed = { ...legacy, isDeleted: true }
  storage({ [DOCS]: [removed] })
  assert.equal(loadIdeas()[0].isDeleted, true)
  assert.deepEqual(loadIdeas()[0].legacyDocument, removed)
})
