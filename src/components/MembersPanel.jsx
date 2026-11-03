import { useEffect, useState } from 'react'
import { Link2, Trash2, X } from 'lucide-react'
import { studyApi } from '../services/studyApi'
import InviteModal from './InviteModal'
import './study.css'

const ROLE_LABELS = { OWNER: '방장', EDITOR: '편집', VIEWER: '보기' }

// 패널에 필요한 데이터를 한 번에 가져옴 (방장이 아니면 초대 목록은 생략)
async function fetchPanel(workspaceId) {
  const study = await studyApi.getStudy(workspaceId)
  const memberList = await studyApi.getMembers(workspaceId)
  const inviteList = study.me.role === 'OWNER' ? await studyApi.getInvites(workspaceId) : { invites: [] }
  return { myRole: study.me.role, members: memberList.members, invites: inviteList.invites }
}

export default function MembersPanel({ workspaceId, onClose }) {
  const [myRole, setMyRole] = useState(null)
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [error, setError] = useState('')

  const isOwner = myRole === 'OWNER'

  function applyPanel(data) {
    setMyRole(data.myRole)
    setMembers(data.members)
    setInvites(data.invites)
    setError('')
  }

  function refresh() {
    return fetchPanel(workspaceId).then(applyPanel).catch((err) => setError(err.message))
  }

  useEffect(() => {
    let ignore = false
    fetchPanel(workspaceId)
      .then((data) => {
        if (ignore) return
        setMyRole(data.myRole)
        setMembers(data.members)
        setInvites(data.invites)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
    return () => { ignore = true }
  }, [workspaceId])

  async function run(action) {
    setError('')
    try {
      await action()
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  function inviteStatus(invite) {
    if (invite.revokedAt) return '취소됨'
    if (new Date(invite.expiresAt) <= new Date()) return '만료됨'
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) return '인원 마감'
    return '사용 가능'
  }

  return (
    <aside className="study-panel" aria-label="팀원 목록">
      <div className="study-panel-header">
        <h2>팀원</h2>
        <button type="button" className="icon-button" aria-label="팀원 패널 닫기" onClick={onClose}><X size={16} /></button>
      </div>

      {error && <p className="study-error" role="alert">{error}</p>}

      <ul className="study-member-list">
        {members.map((member) => (
          <li key={member.id} className="study-member-row">
            <span className="study-member-name">{member.nickname}</span>
            {isOwner && member.role !== 'OWNER' ? (
              <select
                aria-label={`${member.nickname} 권한`}
                value={member.role}
                onChange={(event) => run(() => studyApi.changeRole(workspaceId, member.id, event.target.value))}
              >
                <option value="EDITOR">편집</option>
                <option value="VIEWER">보기</option>
              </select>
            ) : (
              <span className={`study-role-badge role-${member.role.toLowerCase()}`}>{ROLE_LABELS[member.role]}</span>
            )}
            {isOwner && member.role !== 'OWNER' && (
              <button
                type="button"
                className="icon-button"
                aria-label={`${member.nickname} 내보내기`}
                title="내보내기"
                onClick={() => {
                  if (window.confirm(`${member.nickname}님을 내보낼까요?`)) {
                    run(() => studyApi.removeMember(workspaceId, member.id))
                  }
                }}
              ><Trash2 size={14} /></button>
            )}
          </li>
        ))}
      </ul>

      {isOwner && (
        <section className="study-invite-section">
          <div className="study-invite-header">
            <h3>초대</h3>
            <button type="button" className="study-primary small" onClick={() => setShowInviteModal(true)}>
              <Link2 size={14} />초대 링크 만들기
            </button>
          </div>

          {invites.length === 0 && <p className="study-empty">아직 만든 초대 링크가 없어요.</p>}
          <ul className="study-invite-list">
            {invites.map((invite) => {
              const status = inviteStatus(invite)
              return (
                <li key={invite.id} className="study-invite-row">
                  <span>{ROLE_LABELS[invite.role]} · {status}{invite.maxUses !== null && ` (${invite.useCount}/${invite.maxUses})`}</span>
                  {status === '사용 가능' && (
                    <button
                      type="button"
                      className="study-secondary small"
                      onClick={() => {
                        if (window.confirm('이 초대 링크를 취소할까요?')) {
                          run(() => studyApi.revokeInvite(workspaceId, invite.id))
                        }
                      }}
                    >취소</button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {showInviteModal && (
        <InviteModal
          workspaceId={workspaceId}
          onCreated={refresh}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </aside>
  )
}
