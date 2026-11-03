import { useRef, useState } from 'react'
import { useIdeas } from '../hooks/useIdeas'
import './IdeaBoard.css'

export default function IdeaBoard() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [editingId, setEditingId] = useState(null)
    const { ideas, error, readable, addIdea, updateIdea, deleteIdea } = useIdeas()
    const sliderRef = useRef(null)
    const titleRef = useRef(null)

    function resetForm() {
        setTitle('')
        setContent('')
        setEditingId(null)
    }

  function submitIdea(event) {
    event.preventDefault()
    if (!title.trim()) return
    const saved = editingId
      ? updateIdea(editingId, title, content)
      : addIdea(title, content)
    if (!saved) return
    const added = !editingId
    resetForm()
    if (added) requestAnimationFrame(() => {
      const slider = sliderRef.current
      slider?.scrollTo({ left: slider.scrollWidth, behavior: scrollBehavior() })
    })
  }

  function scrollBehavior() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  }

  function editIdea(idea) {
    setEditingId(idea.id)
    setTitle(idea.title)
    setContent(idea.content)
    titleRef.current?.focus()
  }

  function scrollCards(direction) {
    const slider = sliderRef.current
    if (!slider) return
    const card = slider.querySelector('.idea-board-card')
    const step = (card?.getBoundingClientRect().width ?? 260) + 16
    slider.scrollBy({ left: direction * step, behavior: scrollBehavior() })
  }

  // 새 아이디어 입력창 열기 (빈 폼으로 초기화 후 제목에 포커스)
  function openCreateForm() {
    resetForm()
    titleRef.current?.focus()
  }

return (
    <section className="idea-board" aria-labelledby="idea-board-title">
        <div className="idea-board-heading">
            <h2 id="idea-board-title">아이디어 보드</h2>
            <span aria-live="polite">{ideas.length}개의 아이디어</span>
        </div>

    <form className="idea-board-form" onSubmit={submitIdea}>
        <button
            type="button"
            className = "button"
            onClick={openCreateForm}
            disabled={!readable}
        />

        {editingId && <strong className="idea-board-edit-label">아이디어 수정 중</strong>}
        <input
            ref={titleRef}
            aria-label="아이디어 제목"
            placeholder="어떤 아이디어가 떠올랐나요?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            disabled={!readable}
        />

        <textarea
            aria-label="아이디어 내용"
            placeholder="생각을 간단하게 적어 보세요."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            disabled={!readable}
        />

        <div className="idea-board-form-actions">
            {editingId && <button type="button" onClick={resetForm}>수정 취소</button>}
            <button type="submit" disabled={!title.trim() || !readable}>
                {editingId ? '수정 저장' : '+ 아이디어 추가'}
            </button>
        </div>
        <small className="idea-board-note">아이디어는 이 보드에만 저장되며 문서로 생성되지 않습니다.</small>
    </form>
    {error && <p className="idea-board-error" role="alert">{error}</p>}

    {ideas.length === 0 ? (
        <p className="idea-board-empty">
            {readable ? '첫 번째 아이디어를 추가해 보세요.' : '저장된 아이디어를 읽을 수 없습니다.'}
        </p>
    ) : (
        <>
        <div className="idea-board-slide-controls">
            <span>옆으로 넘겨 아이디어를 확인하세요.</span>
            <button type="button" aria-label="이전 아이디어" aria-controls="idea-board-slider" onClick={() => scrollCards(-1)}>‹</button>
            <button type="button" aria-label="다음 아이디어" aria-controls="idea-board-slider" onClick={() => scrollCards(1)}>›</button>
        </div>
        <div className="idea-board-grid" id="idea-board-slider" ref={sliderRef} role="region" aria-label="아이디어 카드 목록, 가로 스크롤 가능" tabIndex={0}>
            {ideas.map((idea) => (
                <article
                key={idea.id}
                className={`idea-board-card${editingId === idea.id ? ' is-editing' : ''}`}
            >
                <span className="idea-board-tag">아이디어</span>

                <h3>{idea.title || '제목 없음'}</h3>

                <p tabIndex={0} aria-label={`${idea.title || '제목 없음'} 내용`}>
                    {idea.content || '아직 내용이 없습니다.'}
                </p>

                <span className="idea-board-date">
                    {new Date(idea.createdAt).toLocaleDateString('ko-KR')}
                </span>
                <div className="idea-board-card-actions">
                    <button type="button" aria-label={`${idea.title} 수정`} onClick={() => editIdea(idea)}>수정</button>
                    <button type="button" className="idea-board-delete" aria-label={`${idea.title} 삭제`} onClick={() => {
                        if (window.confirm(`"${idea.title}" 아이디어를 삭제할까요? 삭제하면 되돌릴 수 없습니다.`) && deleteIdea(idea.id)) {
                            if (editingId === idea.id) resetForm()
                        }
                    }}>삭제</button>
                </div>
            </article>
            ))}
        </div>
        </>
    )}
    </section>
)
}
