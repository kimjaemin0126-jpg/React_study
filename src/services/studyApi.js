// 백엔드(server/) API 호출 모음
// Vite 프록시가 /api 요청을 localhost:4000으로 넘겨줌
// credentials: 'include' → 스터디별 토큰 쿠키를 함께 보냄

async function request(method, path, body) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error ?? '요청에 실패했습니다.')
  return data
}

export const studyApi = {
  createStudy: (name, nickname) => request('POST', '/workspaces', { name, nickname }),
  getStudy: (workspaceId) => request('GET', `/workspaces/${workspaceId}`),
  getDocument: (workspaceId) => request('GET', `/workspaces/${workspaceId}/document`),
  saveDocument: (workspaceId, { title, blocks }) => request('PUT', `/workspaces/${workspaceId}/document`, { title, blocks }),

  getMembers: (workspaceId) => request('GET', `/workspaces/${workspaceId}/members`),
  changeRole: (workspaceId, memberId, role) => request('PATCH', `/workspaces/${workspaceId}/members/${memberId}`, { role }),
  removeMember: (workspaceId, memberId) => request('DELETE', `/workspaces/${workspaceId}/members/${memberId}`),

  getInvites: (workspaceId) => request('GET', `/workspaces/${workspaceId}/invites`),
  createInvite: (workspaceId, options) => request('POST', `/workspaces/${workspaceId}/invites`, options),
  revokeInvite: (workspaceId, inviteId) => request('DELETE', `/workspaces/${workspaceId}/invites/${inviteId}`),

  acceptInvite: (code, nickname) => request('POST', `/invites/${code}/accept`, { nickname })
}
