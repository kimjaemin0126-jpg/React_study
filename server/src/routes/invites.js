import { Router } from 'express'
import { prisma } from '../db.js'
import { setMemberCookie } from '../utils/cookie.js'
import { generateToken, hashToken } from '../utils/token.js'

export const invitesRouter = Router()

// POST /api/invites/:code/accept : 초대 링크로 스터디 참여
invitesRouter.post('/:code/accept', async (req, res) => {
  const code = req.params.code
  const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : ''

  if (!nickname || nickname.length > 20) {
    return res.status(400).json({ error: '닉네임은 1~20자로 입력해주세요.' })
  }

  // 조회, 검사, 사용 횟수 증가, 멤버 생성을 하나의 트랜잭션으로 묶음
  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.invite.findUnique({ where: { codeHash: hashToken(code) } })
    if (!invite) return { status: 404, body: { error: '존재하지 않는 초대 링크입니다.' } }

    const workspace = await tx.workspace.findUnique({ where: { id: invite.workspaceId } })
    if (workspace.closedAt) return { status: 410, body: { error: '닫힌 스터디입니다.' } }

    if (invite.revokedAt) return { status: 410, body: { error: '취소된 초대 링크입니다.' } }
    if (invite.expiresAt <= new Date()) return { status: 410, body: { error: '만료된 초대 링크입니다.' } }
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      return { status: 410, body: { error: '사용 가능 횟수를 모두 채운 초대 링크입니다.' } }
    }

    // 읽은 useCount와 같을 때만 증가 → 동시에 두 명이 들어와도 한도를 넘지 않음
    const claimed = await tx.invite.updateMany({
      where: { id: invite.id, useCount: invite.useCount },
      data: { useCount: { increment: 1 } },
    })
    if (claimed.count === 0) {
      return { status: 409, body: { error: '요청이 겹쳤어요. 다시 시도해주세요.' } }
    }

    const token = generateToken()
    const member = await tx.member.create({
      data: {
        workspaceId: invite.workspaceId,
        nickname,
        role: invite.role,
        tokenHash: hashToken(token),
      },
    })

    return {
      status: 201,
      token,
      body: {
        workspace: { id: workspace.id, name: workspace.name },
        member: { id: member.id, nickname: member.nickname, role: member.role },
      },
    }
  })

  if (result.token) setMemberCookie(res, result.body.workspace.id, result.token)
  res.status(result.status).json(result.body)
})
