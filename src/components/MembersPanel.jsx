import { useDialog } from '../context/dialogContext'
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

export default function MembersPanel({ workspaceId, onClose, onClosed, onLeft }) {
  const dialog = useDialog()
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

  // 패널이 열려 있는 동안 주기적으로 다시 불러와서, 새로 들어온 팀원이 바로 보이게 함
  // (실시간 연결은 나중 단계. 지금은 5초마다 확인하는 방식)
  useEffect(() => {
    let ignore = false

    function loadPanel() {
      // 탭이 보이지 않을 때는 요청하지 않음
      if (document.visibilityState !== 'visible') return
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
    }

    loadPanel()
    const timer = window.setInterval(loadPanel, 5000)
    return () => {
      ignore = true
      window.clearInterval(timer)
    }
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

  // 취소되었거나 만료, 인원 마감된 링크는 목록에서 뺌 (사용 가능한 링크만 표시)
  const activeInvites = invites.filter((invite) => inviteStatus(invite) === '사용 가능')

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
                className="study-role-select"
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
                className="icon-button study-remove"
                aria-label={`${member.nickname} 내보내기`}
                title="내보내기"
                onClick={async () => {
                  if (await dialog.confirm(`${member.nickname}님을 내보낼까요?`, { title: '팀원 내보내기', confirmLabel: '내보내기', danger: true })) {
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

          {activeInvites.length === 0 && <p className="study-empty">사용 중인 초대 링크가 없어요.</p>}
          <ul className="study-invite-list">
            {activeInvites.map((invite) => {
              const status = inviteStatus(invite)
              return (
                <li key={invite.id} className="study-invite-row">
                  <span>{ROLE_LABELS[invite.role]} · {status}{invite.maxUses !== null && ` (${invite.useCount}/${invite.maxUses})`}</span>
                  {status === '사용 가능' && (
                    <button
                      type="button"
                      className="study-secondary small"
                      onClick={async () => {
                        if (await dialog.confirm('이 초대 링크를 취소할까요?', { title: '초대 취소', confirmLabel: '취소하기', danger: true })) {
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

      {isOwner && (
        <section className="study-danger-section">
          <button
            type="button"
            className="study-danger-outline"
            onClick={async () => {
              if (await dialog.confirm('팀원 모두 들어갈 수 없게 되고, 초대 링크도 모두 취소돼요. 데이터는 보관돼요.', { title: '스터디 닫기', confirmLabel: '닫기', danger: true })) {
                studyApi.closeStudy(workspaceId)
                  .then(() => onClosed?.())
                  .catch((err) => setError(err.message))
              }
            }}
          >스터디 닫기</button>
        </section>
      )}

      {myRole && myRole !== 'OWNER' && (
        <section className="study-danger-section">
          <button
            type="button"
            className="study-danger-outline"
            onClick={async () => {
              if (await dialog.confirm('나간 뒤에는 새 초대 링크가 있어야 다시 들어올 수 있어요.', { title: '스터디 나가기', confirmLabel: '나가기', danger: true })) {
                studyApi.leaveStudy(workspaceId)
                  .then(() => onLeft?.())
                  .catch((err) => setError(err.message))
              }
            }}
          >스터디 나가기</button>
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
