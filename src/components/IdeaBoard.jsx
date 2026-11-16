import { useId, useRef, useState } from 'react'
import './IdeaBoard.css'
import Modal from '../common/Modal'

export default function IdeaBoard({
    section, ideas, error, readable, addIdea, updateIdea, deleteIdea, onRenameSection,
}) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [formOpen, setFormOpen] = useState(false)
    const sliderRef = useRef(null)
    const sliderId = useId()

function resetForm() {
    setTitle('')
    setContent('')
    setEditingId(null)
    setFormOpen(false)
}

function openCreateForm() {
    setTitle('')
    setContent('')
    setEditingId(null)
    resetForm()
    setFormOpen(true)
}

function submitIdea(event) {
    event.preventDefault()
    if (!title.trim()) return
    const saved = editingId
        ? updateIdea(editingId, title, content)
        : addIdea(title, content, section.id)
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
    setFormOpen(true)
}

function scrollCards(direction) {
    const slider = sliderRef.current
    if (!slider) return
    const card = slider.querySelector('.idea-board-card')
    const step = (card?.getBoundingClientRect().width ?? 260) + 16
    slider.scrollBy({ left: direction * step, behavior: scrollBehavior() })
}

return (
    <section className="idea-board" aria-label={section.title || '아이디어 섹션'}>
        <div className="idea-board-heading">
            <input
                className="idea-section-title"
                aria-label="섹션 제목"
                placeholder="섹션 제목을 입력하세요"
                value={section.title}
                onChange={(event) => onRenameSection(section.id, event.target.value)}
                disabled={!readable}
            />
            <span aria-live="polite">{ideas.length}개의 아이디어</span>
        </div>

        <button
            type="button"
            className="button"
            onClick={openCreateForm}
                disabled={!readable}
            >
                + 아이디어 작성
        </button>

        {formOpen && (
        <Modal
            title={editingId ? '아이디어 수정' : '아이디어 작성'}
            onClose={resetForm}
            className="idea-write-modal"
        >
        <form className="idea-board-form" onSubmit={submitIdea}>
            <input
                autoFocus
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
                rows={6}
                disabled={!readable}
            />

            {error && (
                <p className="idea-board-error" role="alert">
                    {error}
                </p>
            )}

            <div className="idea-board-form-actions">
                <button type="button" onClick={resetForm}>
                    취소
                </button>

                <button
                    type="submit"
                    disabled={!title.trim() || !readable}
                >
                    {editingId ? '수정 저장' : '아이디어 추가'}
                </button>
            </div>
    </form>
</Modal>
)}

    {ideas.length === 0 ? (
        <p className="idea-board-empty">
            {readable ? '첫 번째 아이디어를 추가해 보세요.' : '저장된 아이디어를 읽을 수 없습니다.'}
        </p>
    ) : (
        <>
        <div className="idea-board-slide-controls">
            <span>옆으로 넘겨 아이디어를 확인하세요.</span>
            <button type="button" aria-label="이전 아이디어" aria-controls={sliderId} onClick={() => scrollCards(-1)}>‹</button>
            <button type="button" aria-label="다음 아이디어" aria-controls={sliderId} onClick={() => scrollCards(1)}>›</button>
        </div>
        <div className="idea-board-grid" id={sliderId} ref={sliderRef} role="region" aria-label="아이디어 카드 목록, 가로 스크롤 가능" tabIndex={0}>
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
