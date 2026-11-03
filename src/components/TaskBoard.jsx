import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentStore } from '../hooks/useDocumentStore'
import './TaskBoard.css'

// 각 열의 저장값, 표시 이름, 색상 구분
const columns = [
    { id: 'todo', label: '시작 전', color: 'gray' },
    { id: 'doing', label: '진행 중', color: 'blue' },
    { id: 'done', label: '완료', color: 'green' },
]

export default function TaskBoard() {
const {
    activeDocuments,
    createDocument,
    updateDocument,
} = useDocumentStore()

  // 어느 열에서 입력창을 열었는지
const [addingStatus, setAddingStatus] = useState(null)

  // 새 카드에 입력한 제목
const [draftTitle, setDraftTitle] = useState('')

  // 보드용 문서만 가져오기
const tasks = activeDocuments.filter((document) => document.isTask)

function openForm(status) {
    setAddingStatus(status)
    setDraftTitle('')
}

function closeForm() {
    setAddingStatus(null)
    setDraftTitle('')
}

function addTask(event) {
    event.preventDefault()

    const title = draftTitle.trim()
    if (!title || !addingStatus) return

    // 기존 문서 생성 기능 사용
    const id = createDocument('blank')

    // 보드용 문서임을 표시하고 상태 저장
    updateDocument(id, {
        title,
        isTask: true,
        taskStatus: addingStatus,
    })

    closeForm()
    }

return (
    <section className="task-board" aria-labelledby="task-board-title">
        <div className="task-board-header">
            <h2 id="task-board-title">작업 보드</h2>

            <button
            type="button"
            className="task-board-create"
            onClick={() => openForm('todo')}
            >
            새로 만들기
            </button>
        </div>

        <div className="task-board-columns">
        {columns.map((column) => {
          // 이 열의 상태와 일치하는 카드만 분류
            const columnTasks = tasks.filter(
            (task) => (task.taskStatus ?? 'todo') === column.id
            )

            return (
                <section
                    key={column.id}
                    className={`task-board-column task-board-${column.color}`}
                    aria-label={column.label}
            >
                <div className="task-board-column-header">
                    <h3 className="task-board-status">
                        <span className="task-board-dot" />
                        {column.label}
                    </h3>

                    <span className="task-board-count">
                        {columnTasks.length}
                    </span>
                </div>

                <div className="task-board-cards">
                    {columnTasks.map((task) => (
                    <article className="task-board-card" key={task.id}>
                        <Link
                        className="task-board-card-title"
                        to={`/documents/${task.id}`}
                        >
                        {task.title.trim() || '제목 없음'}
                        </Link>

                        <label className="task-board-status-field">
                        <span>상태</span>

                        <select
                            aria-label={`${task.title || '제목 없음'} 상태 변경`}
                            value={task.taskStatus ?? 'todo'}
                            onChange={(event) =>
                            updateDocument(task.id, {
                                taskStatus: event.target.value,
                            })
                            }
                        >
                            {columns.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                            ))}
                        </select>
                        </label>
                    </article>
                    ))}
                </div>

                {addingStatus === column.id ? (
                    <form className="task-board-form" onSubmit={addTask}>
                    <input
                        autoFocus
                        aria-label={`${column.label} 새 카드 제목`}
                        placeholder="카드 제목 입력"
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        onKeyDown={(event) => {
                        if (event.key === 'Escape') closeForm()
                        }}
                        required
                    />

                    <div className="task-board-form-actions">
                        <button type="button" onClick={closeForm}>
                        취소
                        </button>

                        <button type="submit" disabled={!draftTitle.trim()}>
                        추가
                        </button>
                    </div>
                    </form>
                ) : (
                    <button
                    type="button"
                    className="task-board-add"
                    onClick={() => openForm(column.id)}
                    >
                    <span aria-hidden="true">＋</span>
                    새 페이지
                    </button>
                )}
                </section>
            )
            })}
        </div>
    </section>
)
}