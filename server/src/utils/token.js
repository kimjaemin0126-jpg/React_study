import { createHash, randomBytes } from 'node:crypto'

// 사용자에게 전달할 원문 토큰 (32바이트 = 256비트 랜덤)
export function generateToken() {
  return randomBytes(32).toString('base64url')
}

// DB에 저장할 해시 (원문은 저장하지 않음)
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}
