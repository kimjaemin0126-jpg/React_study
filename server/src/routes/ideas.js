import { Router } from 'express'
import { prisma } from '../db.js'
import { requireEditor, requireMember } from '../middleware/auth.js'

export const ideasRouter = Router({ mergeParams: true })

function serialize(idea) {
  return {
    id: idea.id,
    sectionId: idea.sectionId,
    title: idea.title,
    content: idea.ideaContent,
    authorId: idea.authorId,
    author: idea.authorNickname,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  }
}

function validate(body) {
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  const sectionId = typeof body?.sectionId === 'string' ? body.sectionId : 'default-ideas'
  if (!title || title.length > 150 || content.length > 5000 || sectionId.length > 100) return null
  return { title, content, sectionId }
}

// PATCH는 요청에 포함된 필드만 변경합니다. 이동 요청이 본문을 덮어쓰지 않게 합니다.
function validatePatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const changes = {}
  const limits = { title: 150, content: 5000, sectionId: 100 }

  for (const key of Object.keys(limits)) {
    if (!Object.hasOwn(body, key)) continue
    if (typeof body[key] !== 'string') return null
    const value = body[key].trim()
    if (value.length > limits[key] || (key !== 'content' && !value)) return null
    changes[key === 'content' ? 'ideaContent' : key] = value
  }

  return Object.keys(changes).length > 0 ? changes : null
}

ideasRouter.get('/', requireMember, async (req, res) => {
  const ideas = await prisma.idea.findMany({ where: { workspaceId: req.params.workspaceId } })
  res.json({ ideas: ideas.filter((idea) => !idea.removedAt).map(serialize) })
})

ideasRouter.post('/', requireMember, requireEditor, async (req, res) => {
  const values = validate(req.body)
  if (!values) return res.status(400).json({ error: '아이디어 입력값이 올바르지 않습니다.' })
  const idea = await prisma.idea.create({ data: {
    workspaceId: req.params.workspaceId,
    ...values,
    ideaContent: values.content,
    authorId: req.member.id,
    authorNickname: req.member.nickname,
  } })
  res.status(201).json({ idea: serialize(idea) })
})

ideasRouter.patch('/:ideaId', requireMember, requireEditor, async (req, res) => {
  const idea = await prisma.idea.findUnique({ where: { id: req.params.ideaId } })
  if (!idea || idea.workspaceId !== req.params.workspaceId || idea.removedAt) return res.status(404).json({ error: '아이디어를 찾을 수 없습니다.' })
  if (idea.authorId !== req.member.id && req.member.role !== 'OWNER') return res.status(403).json({ error: '작성자 또는 방장만 수정할 수 있습니다.' })
  const changes = validatePatch(req.body)
  if (!changes) return res.status(400).json({ error: '아이디어 입력값이 올바르지 않습니다.' })
  const updated = await prisma.idea.update({ where: { id: idea.id }, data: changes })
  res.json({ idea: serialize(updated) })
})

ideasRouter.delete('/:ideaId', requireMember, requireEditor, async (req, res) => {
  const idea = await prisma.idea.findUnique({ where: { id: req.params.ideaId } })
  if (!idea || idea.workspaceId !== req.params.workspaceId || idea.removedAt) return res.status(404).json({ error: '아이디어를 찾을 수 없습니다.' })
  if (idea.authorId !== req.member.id && req.member.role !== 'OWNER') return res.status(403).json({ error: '작성자 또는 방장만 삭제할 수 있습니다.' })
  await prisma.idea.update({ where: { id: idea.id }, data: { removedAt: new Date() } })
  res.status(204).end()
})
