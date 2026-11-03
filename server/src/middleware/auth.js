import { prisma } from '../db.js'
import { memberCookieName } from '../utils/cookie.js'
import { hashToken } from '../utils/token.js'

// 요청자가 이 스터디의 활동 중인 멤버인지 확인해서 req.member에 담는 미들웨어
// 토큰은 쿠키를 우선으로 읽고, 없으면 Authorization: Bearer 헤더를 확인
export async function requireMember(req, res, next) {
  const { workspaceId } = req.params
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : req.cookies?.[memberCookieName(workspaceId)]

  if (!token) return res.status(401).json({ error: '로그인(토큰)이 필요합니다.' })

  const member = await prisma.member.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!member || member.removedAt) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
  }
  if (member.workspaceId !== workspaceId) {
    return res.status(403).json({ error: '이 스터디의 멤버가 아닙니다.' })
  }

  req.member = member
  next()
}

// 방장만 통과 (requireMember 다음에 사용)
export function requireOwner(req, res, next) {
  if (req.member.role !== 'OWNER') {
    return res.status(403).json({ error: '방장만 할 수 있는 작업입니다.' })
  }
  next()
}

// 방장과 편집자만 통과 (requireMember 다음에 사용)
export function requireEditor(req, res, next) {
  if (!['OWNER', 'EDITOR'].includes(req.member.role)) {
    return res.status(403).json({ error: '편집 권한이 없습니다.' })
  }
  next()
}
