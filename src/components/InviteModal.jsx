import { useState } from 'react'
import { Copy, X } from 'lucide-react'
import { studyApi } from '../services/studyApi'

const EXPIRE_OPTIONS = [
  { value: 1, label: '1시간' },
  { value: 24, label: '1일' },
  { value: 72, label: '3일' },
  { value: 168, label: '7일' }
]

export default function InviteModal({ workspaceId, onCreated, onClose }) {
  const [role, setRole] = useState('VIEWER')
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [limited, setLimited] = useState(false)
  const [maxUses, setMaxUses] = useState(5)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    setError('')
    try {
      const invite = await studyApi.createInvite(workspaceId, {
        role,
        expiresInHours,
        maxUses: limited ? Number(maxUses) : null
      })
      setResult(`${window.location.origin}${invite.inviteUrl}`)
      onCreated?.()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
  }

  return (
    <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-label="초대 링크 만들기">
      <div className="study-modal">
        <div className="study-modal-header">
          <h3>초대 링크 만들기</h3>
          <button type="button" className="icon-button" aria-label="닫기" onClick={onClose}><X size={16} /></button>
        </div>

        {!result ? (
          <>
            <label className="study-field">
              <span>권한</span>
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="VIEWER">보기만 가능</option>
                <option value="EDITOR">편집 가능</option>
              </select>
            </label>

            <label className="study-field">
              <span>유효 기간</span>
              <select value={expiresInHours} onChange={(event) => setExpiresInHours(Number(event.target.value))}>
                {EXPIRE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="study-field study-field-row">
              <input type="checkbox" checked={limited} onChange={(event) => setLimited(event.target.checked)} />
              <span>사용 인원 제한</span>
            </label>
            {limited && (
              <label className="study-field">
                <span>최대 인원 (1~100)</span>
                <input type="number" min="1" max="100" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} />
              </label>
            )}

            {error && <p className="study-error" role="alert">{error}</p>}
            <button type="button" className="study-primary" onClick={handleCreate}>링크 만들기</button>
          </>
        ) : (
          <>
            <p className="study-warning">이 링크는 지금만 볼 수 있어요. 창을 닫은 뒤에는 다시 확인할 수 없으니 지금 복사해 두세요.</p>
            <div className="study-link-box">
              <code>{result}</code>
              <button type="button" className="study-secondary" onClick={handleCopy}>
                <Copy size={14} />{copied ? '복사됨' : '복사'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
