import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createBlock } from '../editor/blockTypes'
import { useDocumentStore } from '../hooks/useDocumentStore'
import HomePage from './HomePage'
import { studyApi } from '../services/studyApi'
import '../components/study.css'

// 초대 링크로 들어왔을 때: 홈 화면을 먼저 보여주고, 그 위에 닉네임 입력창을 띄움
export default function InvitePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { documents, createDocument, updateDocument } = useDocumentStore()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [invalidMessage, setInvalidMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleJoin(event) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const { workspace } = await studyApi.acceptInvite(code, nickname.trim())

      // 이미 이 브라우저에 같은 스터디 문서가 있으면 그대로 연다
      const existing = documents.find((item) => item.workspaceId === workspace.id && !item.isDeleted && !item.studyLeft)
      if (existing) {
        navigate(`/documents/${existing.id}`)
        return
      }

      const remote = await studyApi.getDocument(workspace.id)
      const documentId = createDocument('blank')
      updateDocument(documentId, {
        title: remote.title,
        blocks: remote.blocks.length ? remote.blocks : [createBlock()],
        workspaceId: workspace.id
      })
      navigate(`/documents/${documentId}`)
    } catch (err) {
      if (err.status === 404 || err.status === 410) {
        setInvalidMessage(err.message)
        return
      }
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <HomePage />
      <div className="study-modal-backdrop">
        {invalidMessage ? (
          <div className="study-modal" role="dialog" aria-label="참여할 수 없는 링크">
            <h2>참여할 수 없는 링크예요</h2>
            <p>{invalidMessage}</p>
            <p>방장에게 새 초대 링크를 받아 주세요.</p>
            <Link to="/">홈으로 돌아가기</Link>
          </div>
        ) : (
          <form className="study-modal" role="dialog" aria-label="스터디 참여" onSubmit={handleJoin}>
            <h2>스터디 참여</h2>
            <p>이 스터디에서 사용할 닉네임을 입력해주세요.</p>
            <label className="study-field">
              <span>닉네임 (1~20자)</span>
              <input
                value={nickname}
                maxLength={20}
                onChange={(event) => setNickname(event.target.value)}
                required
              />
            </label>
            {error && <p className="study-error" role="alert">{error}</p>}
            <button type="submit" className="study-primary" disabled={busy || !nickname.trim()}>
              {busy ? '참여 중...' : '참여하기'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
