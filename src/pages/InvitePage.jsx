import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBlock } from '../editor/blockTypes'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { studyApi } from '../services/studyApi'
import '../components/study.css'

// 초대 링크로 들어왔을 때: 닉네임 입력 → 스터디 참여 → 문서를 이 브라우저에 불러오기
export default function InvitePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { documents, createDocument, updateDocument } = useDocumentStore()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleJoin(event) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const { workspace } = await studyApi.acceptInvite(code, nickname.trim())

      // 이미 이 브라우저에 같은 스터디 문서가 있으면 그대로 연다
      const existing = documents.find((item) => item.workspaceId === workspace.id && !item.isDeleted)
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
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="study-invite-page">
      <form className="study-modal" onSubmit={handleJoin}>
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
    </main>
  )
}
