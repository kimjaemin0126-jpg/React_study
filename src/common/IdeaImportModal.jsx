import { useEffect, useState } from 'react'
import Modal from './Modal'
import { readLocalIdeas } from '../hooks/useLocalIdeas'
import { studyApi } from '../services/studyApi'

// 문서 안에서 내 아이디어를 골라 본문 끝에 붙임
// 스터디 문서에 붙이면 작성자 이름이 함께 적혀서 팀원이 누가 쓴 아이디어인지 알 수 있음
export default function IdeaImportModal({ workspaceId, onImport, onClose }) {
  const [ideas] = useState(readLocalIdeas)
  const [selectedIds, setSelectedIds] = useState([])
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!workspaceId) return
    let ignore = false
    studyApi.getStudy(workspaceId)
      .then(({ me }) => {
        if (!ignore) setNickname(me.nickname)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
    return () => { ignore = true }
  }, [workspaceId])

  function toggle(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function handleImport() {
    const picked = ideas.filter((idea) => selectedIds.includes(idea.id))
    if (picked.length === 0) return
    onImport(picked, workspaceId ? nickname : '')
  }

  return (
    <Modal title="아이디어 가져오기" onClose={onClose} className="task-import-modal">
      <p className="task-import-description">
        내 아이디어에서 문서에 넣을 항목을 고르세요. 선택한 아이디어는 문서 끝에 추가됩니다.
        {workspaceId && ' 스터디 문서에서는 작성자 이름도 함께 적힙니다.'}
      </p>

      {error && <p className="study-error" role="alert">{error}</p>}

      <div className="task-import-list">
        {ideas.length === 0 ? (
          <p className="task-import-empty">가져올 아이디어가 없습니다. 아이디어 메뉴에서 먼저 추가해 보세요.</p>
        ) : (
          ideas.map((idea) => (
            <label key={idea.id} className="task-import-item">
              <input type="checkbox" checked={selectedIds.includes(idea.id)} onChange={() => toggle(idea.id)} />
              <span>{idea.title || '제목 없음'}</span>
            </label>
          ))
        )}
      </div>

      <div className="task-import-actions">
        <button type="button" className="button" onClick={onClose}>취소</button>
        <button type="button" className="button button-primary" disabled={selectedIds.length === 0} onClick={handleImport}>
          선택한 아이디어 가져오기
        </button>
      </div>
    </Modal>
  )
}
