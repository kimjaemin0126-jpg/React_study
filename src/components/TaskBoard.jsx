import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentStore } from '../hooks/useDocumentStore'
import './TaskBoard.css'
import { useDialog } from '../context/dialogContext'
import { X } from 'lucide-react'
import Modal from '../common/Modal'
import { getDocumentTitle } from '../utils/documentUtils'

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
    moveToTrash,
} = useDocumentStore()

const dialog = useDialog()
const [addingStatus, setAddingStatus] = useState(null)

  // 새 카드에 입력한 제목
const [draftTitle, setDraftTitle] = useState('')
const [draftStartDate, setDraftStartDate] = useState('')
const [draftEndDate, setDraftEndDate] = useState('')

// 드래그 중인 카드와, 지금 카드가 올라가 있는 열의 상태
const [draggingId, setDraggingId] = useState(null)
const [dropStatus, setDropStatus] = useState(null)

const [importOpen, setImportOpen] = useState(false)
const [selectedDocumentIds, setSelectedDocumentIds] = useState([])

// 이미 보드에 있는 문서는 가져오기 목록에서 제외
const importableDocuments = activeDocuments.filter(
    (document) => !document.isTask,
)

  // 보드용 문서만 가져오기
const tasks = activeDocuments.filter((document) => document.isTask)

function openForm(status) {
    setAddingStatus(status)
    setDraftTitle('')
    setDraftStartDate('')
    setDraftEndDate('')
}

function closeForm() {
    setAddingStatus(null)
    setDraftTitle('')
    setDraftStartDate('')
    setDraftEndDate('')
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
        startDate: draftStartDate || null,
        endDate: draftStartDate ? (draftEndDate || draftStartDate) : null,
    })

    closeForm()
    }

// 카드 삭제: 문서(하위 문서 포함)를 휴지통으로 옮겨서 문서 목록과 일정에서도 함께 사라지게 함
async function deleteTask(task) {
    const confirmed = await dialog.confirm(
        `"${getDocumentTitle(task)}" 문서와 하위 문서를 휴지통으로 이동할까요?`,
        {
        title: '작업 삭제',
        confirmLabel: '휴지통으로 이동',
        danger: true,
        },
    )

    if (!confirmed) return

    moveToTrash(task.id)
}
// 드래그로 카드를 다른 열에 놓으면 그 열의 상태로 바뀜
function handleDragStart(event, task) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
    setDraggingId(task.id)
}

function handleDragEnd() {
    setDraggingId(null)
    setDropStatus(null)
}

function handleDrop(event, status) {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain')
    const task = tasks.find((item) => item.id === id)
    setDropStatus(null)
    setDraggingId(null)
    if (!task || (task.taskStatus ?? 'todo') === status) return
    updateDocument(task.id, { taskStatus: status })
}

function openImport() {
    closeForm()
    setSelectedDocumentIds([])
    setImportOpen(true)
}

function closeImport() {
    setImportOpen(false)
    setSelectedDocumentIds([])
}

function toggleImportDocument(documentId) {
    setSelectedDocumentIds((current) =>
        current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    )
}

function importDocuments(event) {
    event.preventDefault()

    const targets = importableDocuments.filter((document) =>
        selectedDocumentIds.includes(document.id),
    )

    if (targets.length === 0) return

    for (const document of targets) {
        updateDocument(document.id, {
        isTask: true,
        taskStatus: 'todo',
        })
    }

    closeImport()
}
return (
    <section className="task-board" aria-labelledby="task-board-title">
        <div className="task-board-header">
            <h2 id="task-board-title">작업 보드</h2>

            <button
            type="button"
            className="task-board-create"
            onClick={openImport}
            >
            문서 가져오기
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
                    className={`task-board-column task-board-${column.color}${dropStatus === column.id ? ' is-drop-target' : ''}`}
                    aria-label={column.label}
                    onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                        if (dropStatus !== column.id) setDropStatus(column.id)
                    }}
                    onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) setDropStatus(null)
                    }}
                    onDrop={(event) => handleDrop(event, column.id)}
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
                    <article
                        className={`task-board-card${draggingId === task.id ? ' is-dragging' : ''}`}
                        key={task.id}
                        draggable
                        onDragStart={(event) => handleDragStart(event, task)}
                        onDragEnd={handleDragEnd}
                        title="드래그해서 다른 열로 옮기면 상태가 바뀝니다"
                    >
                        <Link
                        className="task-board-card-title"
                        to={`/documents/${task.id}`}
                        >
                        {task.title.trim() || '제목 없음'}
                        </Link>

                        <button
                            type="button"
                            className="task-board-delete"
                            title="작업 삭제"
                            aria-label={`${task.title || '제목 없음'} 삭제`}
                            onClick={() => deleteTask(task)}
                            >
                            <X size={15} />
                        </button>
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

                    <div className="task-board-date-fields">
                        <label>
                            시작일
                            <input type="date" value={draftStartDate} onChange={(event) => {
                                const next = event.target.value
                                setDraftStartDate(next)
                                if (draftEndDate && next && draftEndDate < next) setDraftEndDate(next)
                            }} />
                        </label>
                        <label>
                            종료일
                            <input type="date" value={draftEndDate} min={draftStartDate || undefined} disabled={!draftStartDate} onChange={(event) => setDraftEndDate(event.target.value)} />
                        </label>
                    </div>

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
        {importOpen && (
            <Modal
                title="작업 보드에 문서 가져오기"
                onClose={closeImport}
                className="task-import-modal"
            >
                <form onSubmit={importDocuments}>
                <p className="task-import-description">
                    작업 보드에 추가할 문서를 선택하세요.
                    선택한 문서는 ‘시작 전’에 표시됩니다.
                </p>

                <div className="task-import-list">
                    {importableDocuments.length === 0 ? (
                    <p className="task-import-empty">
                        가져올 문서가 없습니다.
                        이미 보드에 있는 문서는 목록에서 제외됩니다.
                    </p>
                    ) : (
                    importableDocuments.map((document) => (
                        <label
                        key={document.id}
                        className="task-import-item"
                        >
                        <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(document.id)}
                            onChange={() => toggleImportDocument(document.id)}
                        />

                        <span>{getDocumentTitle(document)}</span>
                        </label>
                    ))
                    )}
                </div>

                <div className="task-import-actions">
                    <button
                    type="button"
                    className="button"
                    onClick={closeImport}
                    >
                    취소
                    </button>

                    <button
                    type="submit"
                    className="button button-primary"
                    disabled={
                        !importableDocuments.some((document) =>
                        selectedDocumentIds.includes(document.id),
                        )
                    }
                    >
                    선택한 문서 가져오기
                    </button>
                </div>
                </form>
            </Modal>
            )}
    </section>
)
}
