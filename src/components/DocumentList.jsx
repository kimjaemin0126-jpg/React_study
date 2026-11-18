import { useState } from 'react'
import { Clock3, FilePlus2, FileText, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { useDialog } from '../context/dialogContext'
import {
  getDocumentTitle,
  formatRelativeDate,
} from '../utils/documentUtils'

export default function DocumentList({
  documents,
  title,
  description,
  onNewPage,
  selectable = false,
  emptyTitle = '아직 문서가 없습니다',
  emptyDescription = '첫 페이지를 만들어 생각과 아이디어를 기록해 보세요.',
}) {
  const {
    duplicateDocument,
    updateDocument,
    moveToTrash,
  } = useDocumentStore()

  const dialog = useDialog()

  const [selectedIds, setSelectedIds] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const sorted = [...documents].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  )

  // 현재 목록에 남아 있는 문서만 선택 대상으로 사용
  const selectedDocuments = sorted.filter((item) =>
    selectedIds.includes(item.id),
  )

  const allFavorites =
    selectedDocuments.length > 0 &&
    selectedDocuments.every((item) => item.isFavorite)

  function toggleDocument(id) {
    if (busy) return

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    )

    setMessage('')
  }

  function clearSelection() {
    if (busy) return

    setSelectedIds([])
    setMessage('')
  }

  function copySelected() {
    if (busy || selectedDocuments.length === 0) return

    let copied = 0

    for (const item of selectedDocuments) {
      const copyId = duplicateDocument(item.id)

      if (copyId) copied += 1
    }

    setSelectedIds([])
    setMessage(`${copied}개의 문서 사본을 만들었습니다.`)
  }

  function setFavoriteSelected(isFavorite) {
    if (busy || selectedDocuments.length === 0) return

    for (const item of selectedDocuments) {
      updateDocument(item.id, { isFavorite })
    }

    setSelectedIds([])
    setMessage(
      `${selectedDocuments.length}개 문서의 즐겨찾기를 ${
        isFavorite ? '추가' : '해제'
      }했습니다.`,
    )
  }

  async function trashSelected() {
    if (busy || selectedDocuments.length === 0) return

    // 확인창을 열 당시 선택한 문서 목록
    const targets = [...selectedDocuments]

    setBusy(true)

    try {
      const confirmed = await dialog.confirm(
        `선택한 문서 ${targets.length}개와 하위 문서를 휴지통으로 이동할까요?`,
        {
          title: '선택한 문서 삭제',
          confirmLabel: '휴지통으로 이동',
          danger: true,
        },
      )

      if (!confirmed) return

      for (const item of targets) {
        moveToTrash(item.id)
      }

      setSelectedIds([])
      setMessage('선택한 문서와 하위 문서를 휴지통으로 이동했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page-view">
      <div className="page-title-row">
        <div>
          <p className="page-kicker">WORKSPACE</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>

        {onNewPage && (
          <button
            type="button"
            className="button button-primary"
            onClick={onNewPage}
          >
            <FilePlus2 size={17} />
            새 페이지
          </button>
        )}
      </div>

      {selectable && selectedDocuments.length > 0 && (
        <div
          className="document-selection-toolbar"
          role="region"
          aria-label="선택한 문서 작업"
          aria-busy={busy}
        >
          <strong>{selectedDocuments.length}개 선택됨</strong>

          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={copySelected}
          >
            사본 만들기
          </button>

          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={() => setFavoriteSelected(!allFavorites)}
          >
            {allFavorites ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          </button>

          <button
            type="button"
            className="button document-bulk-delete"
            disabled={busy}
            onClick={trashSelected}
          >
            휴지통으로 이동
          </button>

          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={clearSelection}
          >
            선택 해제
          </button>
        </div>
      )}

      <p className="document-selection-message" role="status">
        {message}
      </p>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={25} />
          </div>

          <h2>{emptyTitle}</h2>
          <p>{emptyDescription}</p>

          {onNewPage && (
            <button
              type="button"
              className="button button-primary"
              onClick={onNewPage}
            >
              <FilePlus2 size={16} />
              새 페이지 만들기
            </button>
          )}
        </div>
      ) : (
        <div
          className={`document-list${
            selectable ? ' document-list-selectable' : ''
          }`}
        >
          <div className="list-header">
            <span>이름</span>
            <span>마지막 수정</span>
          </div>

          {sorted.map((item) => (
            <div
              key={item.id}
              className={`document-bulk-row${
                selectable && selectedIds.includes(item.id)
                  ? ' is-selected'
                  : ''
              }`}
            >
              {selectable && (
                <input
                  className="document-selection-checkbox"
                  type="checkbox"
                  aria-label={`${getDocumentTitle(item)} 선택`}
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleDocument(item.id)}
                  disabled={busy}
                />
              )}

              <Link
                className="document-row"
                to={`/documents/${item.id}`}
              >
                <span className="document-row-title">
                  <FileText size={17} />

                  <strong>{getDocumentTitle(item)}</strong>

                  {item.isFavorite && (
                    <Star
                      size={14}
                      className="favorite-mark"
                      fill="currentColor"
                    />
                  )}
                </span>

                <span className="document-row-date">
                  <Clock3 size={14} />
                  {formatRelativeDate(item.updatedAt)}
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
