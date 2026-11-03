// 스터디마다 토큰 쿠키를 따로 둠 (한 브라우저로 여러 스터디에 들어갈 수 있으므로)
export function memberCookieName(workspaceId) {
  return `member_${workspaceId}`
}

// httpOnly: JavaScript에서 읽을 수 없어서 XSS로 토큰이 빠져나가는 것을 막음
export function setMemberCookie(res, workspaceId, token) {
  res.cookie(memberCookieName(workspaceId), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}
