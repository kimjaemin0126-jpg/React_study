import test from 'node:test'
import assert from 'node:assert/strict'
import { ideasRouter } from '../server/src/routes/ideas.js'
import { store } from '../server/src/store.js'

// 테스트 프로세스의 별도 메모리만 사용하며 실행 중인 API 서버에는 접속하지 않습니다.
const patchRoute = ideasRouter.stack.find((layer) => layer.route?.methods.patch).route
const patch = patchRoute.stack.at(-1).handle

function createIdea() {
  return store.idea.create({ data: {
    workspaceId: 'test-workspace', authorId: 'test-author',
    title: '처음 제목', ideaContent: '처음 본문', sectionId: 'default-ideas',
  } })
}

async function update(idea, body, member = { id: 'test-author', role: 'EDITOR' }) {
  let status = 200
  let data
  await patch({
    params: { workspaceId: idea.workspaceId, ideaId: idea.id }, body, member,
  }, {
    status(code) { status = code; return this },
    json(value) { data = value; return this },
  })
  return { status, data }
}

test('섹션 이동은 다른 사용자가 수정한 최신 제목과 본문을 보존한다', async () => {
  const idea = createIdea()
  store.idea.update({ where: { id: idea.id }, data: {
    title: '최신 제목', ideaContent: '다른 사용자가 수정한 본문',
  } })
  const result = await update(idea, { sectionId: 'destination' })
  assert.equal(result.status, 200)
  assert.equal(result.data.idea.sectionId, 'destination')
  assert.equal(result.data.idea.title, '최신 제목')
  assert.equal(result.data.idea.content, '다른 사용자가 수정한 본문')
})

test('제목과 본문 편집은 다른 사용자가 옮긴 최신 섹션을 보존한다', async () => {
  const idea = createIdea()
  store.idea.update({ where: { id: idea.id }, data: { sectionId: 'moved-section' } })
  const result = await update(idea, { title: '수정 제목', content: '수정 본문' })
  assert.equal(result.status, 200)
  assert.equal(result.data.idea.sectionId, 'moved-section')
  assert.equal(result.data.idea.content, '수정 본문')
})

test('본문만 비우는 요청은 제목과 섹션을 보존한다', async () => {
  const idea = createIdea()
  const result = await update(idea, { content: '' })
  assert.equal(result.status, 200)
  assert.equal(result.data.idea.content, '')
  assert.equal(result.data.idea.title, idea.title)
  assert.equal(result.data.idea.sectionId, idea.sectionId)
})

test('잘못된 부분 수정 요청은 400으로 거절하고 원본을 보존한다', async () => {
  const idea = createIdea()
  for (const body of [
    {}, null, [], { unknown: true }, { sectionId: '' }, { sectionId: 1 },
    { title: ' ' }, { title: 'a'.repeat(151) }, { content: null },
    { content: 'a'.repeat(5001) }, { sectionId: 'a'.repeat(101) },
  ]) {
    assert.equal((await update(idea, body)).status, 400)
    assert.deepEqual(store.idea.findUnique({ where: { id: idea.id } }), idea)
  }
})

test('다른 작성자의 카드를 이동하려는 편집자는 기존처럼 403으로 거절한다', async () => {
  const idea = createIdea()
  const result = await update(idea, { sectionId: 'destination' }, { id: 'another-editor', role: 'EDITOR' })
  assert.equal(result.status, 403)
  assert.equal(store.idea.findUnique({ where: { id: idea.id } }).sectionId, idea.sectionId)
})

test('방장은 다른 작성자의 카드를 이동할 수 있다', async () => {
  const idea = createIdea()
  const result = await update(idea, { sectionId: 'destination' }, { id: 'owner', role: 'OWNER' })
  assert.equal(result.status, 200)
  assert.equal(result.data.idea.sectionId, 'destination')
})
