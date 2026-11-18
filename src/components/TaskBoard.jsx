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
} = useDocumentStore()

const dialog = useDialog()
const [addingStatus, setAddingStatus] = useState(null)

  // 새 카드에 입력한 제목
const [draftTitle, setDraftTitle] = useState('')
const [draftStartDate, setDraftStartDate] = useState('')
const [draftEndDate, setDraftEndDate] = useState('')

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

async function removeFromBoard(task) {
    const confirmed = await dialog.confirm(
        `"${getDocumentTitle(task)}" 문서를 작업 보드에서 제거할까요? 원본 문서와 내용, 날짜는 유지됩니다.`,
        {
        title: '보드에서 제거',
        confirmLabel: '제거',
        },
    )

    if (!confirmed) return

    updateDocument(task.id, { isTask: false })
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
                        <button
                            type="button"
                            className="task-board-delete"
                            title="보드에서 제거"
                            aria-label={`${task.title || '제목 없음'} 보드에서 제거`}
                            onClick={() => removeFromBoard(task)}
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
