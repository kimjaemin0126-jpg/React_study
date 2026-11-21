import { prisma } from '../db.js'
import { hashToken } from './token.js'

// 이 요청(브라우저)이 가진 스터디 토큰 쿠키로 활동 중인 멤버 신분을 모두 찾음
// 계정이 없어서 '사람'은 브라우저 쿠키로 판단함 (다른 브라우저에서는 확인할 수 없음)
export async function findMyMemberships(req) {
  const tokens = Object.entries(req.cookies ?? {})
    .filter(([name, value]) => name.startsWith('member_') && typeof value === 'string' && value.length > 0)
    .map(([, value]) => value)

  const found = []
  for (const token of tokens) {
    const member = await prisma.member.findUnique({ where: { tokenHash: hashToken(token) } })
    if (!member || member.removedAt) continue

    const workspace = await prisma.workspace.findUnique({ where: { id: member.workspaceId } })
    if (!workspace) continue

    found.push({ member, workspace })
  }
  return found
}
