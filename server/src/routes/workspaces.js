import { Router } from 'express'
import { prisma } from '../db.js'
import { requireEditor, requireMember, requireOwner } from '../middleware/auth.js'
import { sanitizeBlocks } from '../utils/document.js'
import { setMemberCookie } from '../utils/cookie.js'
import { generateToken, hashToken } from '../utils/token.js'

export const workspacesRouter = Router()

const GRANTABLE_ROLES = ['EDITOR', 'VIEWER']

// POST /api/workspaces : 스터디(문서) 생성 + 방장 멤버 발급
workspacesRouter.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : ''

  if (!name || name.length > 50) {
    return res.status(400).json({ error: '스터디 이름은 1~50자로 입력해주세요.' })
  }
  if (!nickname || nickname.length > 20) {
    return res.status(400).json({ error: '닉네임은 1~20자로 입력해주세요.' })
  }

  const token = generateToken()

  // 중첩 create: 스터디와 방장 멤버가 하나의 작업으로 함께 저장됨
  const workspace = await prisma.workspace.create({
    data: {
      name,
      content: [],
      members: {
        create: { nickname, role: 'OWNER', tokenHash: hashToken(token) },
      },
    },
    include: { members: true },
  })

  const [owner] = workspace.members
  setMemberCookie(res, workspace.id, token)

  // 토큰은 쿠키로만 전달 (JSON에 넣으면 JavaScript가 읽을 수 있게 됨)
  res.status(201).json({
    workspace: { id: workspace.id, name: workspace.name, createdAt: workspace.createdAt },
    member: { id: owner.id, nickname: owner.nickname, role: owner.role },
  })
})

// GET /api/workspaces/:workspaceId : 스터디 정보 + 내 정보
workspacesRouter.get('/:workspaceId', requireMember, async (req, res) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: req.params.workspaceId } })
  const me = req.member

  res.json({
    workspace: { id: workspace.id, name: workspace.name, createdAt: workspace.createdAt },
    me: { id: me.id, nickname: me.nickname, role: me.role },
  })
})

// GET /api/workspaces/:workspaceId/document : 문서 내용 (멤버 누구나 조회)
workspacesRouter.get('/:workspaceId/document', requireMember, async (req, res) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: req.params.workspaceId } })
  res.json({
    title: workspace.name,
    blocks: workspace.content,
    updatedAt: workspace.updatedAt,
    myRole: req.member.role,
  })
})

// PUT /api/workspaces/:workspaceId/document : 문서 저장 (방장과 편집자)
// 마지막에 저장한 내용이 반영됨 (실시간 편집은 나중 단계)
workspacesRouter.put(
  '/:workspaceId/document',
  requireMember,
  requireEditor,
  async (req, res) => {
    const blocks = sanitizeBlocks(req.body?.blocks)
    if (!blocks) {
      return res.status(400).json({ error: '문서 내용이 올바르지 않습니다.' })
    }

    const data = { content: blocks }
    if (req.body?.title !== undefined) {
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
      if (title.length > 100) {
        return res.status(400).json({ error: '제목은 100자 이하로 입력해주세요.' })
      }
      data.name = title || '제목 없음'
    }

    const workspace = await prisma.workspace.update({ where: { id: req.params.workspaceId }, data })
    res.json({ title: workspace.name, blocks: workspace.content, updatedAt: workspace.updatedAt })
  },
)

// GET /api/workspaces/:workspaceId/members : 활동 중인 멤버 목록 (팀원 목록 화면)
workspacesRouter.get('/:workspaceId/members', requireMember, async (req, res) => {
  const members = await prisma.member.findMany({
    where: { workspaceId: req.params.workspaceId, removedAt: null },
    select: { id: true, nickname: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ members })
})

// PATCH /api/workspaces/:workspaceId/members/:memberId : 멤버 권한 변경 (방장만)
workspacesRouter.patch(
  '/:workspaceId/members/:memberId',
  requireMember,
  requireOwner,
  async (req, res) => {
    const { workspaceId, memberId } = req.params
    const role = req.body?.role

    if (!GRANTABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: '권한은 EDITOR 또는 VIEWER만 줄 수 있습니다.' })
    }

    const target = await prisma.member.findUnique({ where: { id: memberId } })
    if (!target || target.workspaceId !== workspaceId || target.removedAt) {
      return res.status(404).json({ error: '멤버를 찾을 수 없습니다.' })
    }
    if (target.role === 'OWNER') {
      return res.status(400).json({ error: '방장의 권한은 바꿀 수 없습니다.' })
    }

    const updated = await prisma.member.update({ where: { id: memberId }, data: { role } })
    res.json({ member: { id: updated.id, nickname: updated.nickname, role: updated.role } })
  },
)

// DELETE /api/workspaces/:workspaceId/members/:memberId : 멤버 내보내기 (방장만, 소프트 삭제)
workspacesRouter.delete(
  '/:workspaceId/members/:memberId',
  requireMember,
  requireOwner,
  async (req, res) => {
    const { workspaceId, memberId } = req.params
    const target = await prisma.member.findUnique({ where: { id: memberId } })

    if (!target || target.workspaceId !== workspaceId || target.removedAt) {
      return res.status(404).json({ error: '멤버를 찾을 수 없습니다.' })
    }
    if (target.role === 'OWNER') {
      return res.status(400).json({ error: '방장은 내보낼 수 없습니다.' })
    }

    // 행을 지우지 않고 removedAt만 기록 → 작성자 정보는 그대로 남음
    await prisma.member.update({ where: { id: memberId }, data: { removedAt: new Date() } })
    res.json({ removed: { id: target.id, nickname: target.nickname } })
  },
)

// GET /api/workspaces/:workspaceId/invites : 초대 링크 목록 (방장만, 원문 코드는 제외)
workspacesRouter.get('/:workspaceId/invites', requireMember, requireOwner, async (req, res) => {
  const invites = await prisma.invite.findMany({
    where: { workspaceId: req.params.workspaceId },
    select: { id: true, role: true, expiresAt: true, maxUses: true, useCount: true, revokedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ invites })
})

// POST /api/workspaces/:workspaceId/invites : 초대 링크 생성 (방장만, 권한 지정)
workspacesRouter.post('/:workspaceId/invites', requireMember, requireOwner, async (req, res) => {
  const { workspaceId } = req.params
  const me = req.member

  const role = req.body?.role ?? 'VIEWER'
  const expiresInHours = req.body?.expiresInHours ?? 24
  const maxUses = req.body?.maxUses ?? null

  if (!GRANTABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: '권한은 EDITOR 또는 VIEWER만 선택할 수 있습니다.' })
  }
  if (!Number.isInteger(expiresInHours) || expiresInHours < 1 || expiresInHours > 168) {
    return res.status(400).json({ error: '만료 시간은 1~168시간 사이로 입력해주세요.' })
  }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100)) {
    return res.status(400).json({ error: '최대 사용 횟수는 1~100 사이로 입력해주세요.' })
  }

  const code = generateToken()
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

  const invite = await prisma.invite.create({
    data: {
      workspaceId,
      createdById: me.id,
      codeHash: hashToken(code),
      role,
      expiresAt,
      maxUses,
    },
  })

  // 초대 코드 원문은 이 응답에서만 전달됨 (DB에는 해시만 있음)
  res.status(201).json({
    id: invite.id,
    code,
    role: invite.role,
    inviteUrl: `/invite/${code}`,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses,
  })
})

// DELETE /api/workspaces/:workspaceId/invites/:inviteId : 초대 링크 취소 (방장만)
workspacesRouter.delete(
  '/:workspaceId/invites/:inviteId',
  requireMember,
  requireOwner,
  async (req, res) => {
    const { workspaceId, inviteId } = req.params
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } })

    if (!invite || invite.workspaceId !== workspaceId) {
      return res.status(404).json({ error: '초대 링크를 찾을 수 없습니다.' })
    }
    if (invite.revokedAt) {
      return res.status(409).json({ error: '이미 취소된 초대 링크입니다.' })
    }

    await prisma.invite.update({ where: { id: inviteId }, data: { revokedAt: new Date() } })
    res.json({ revoked: { id: invite.id } })
  },
)
