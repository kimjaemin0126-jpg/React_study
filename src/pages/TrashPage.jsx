import { useDialog } from '../context/dialogContext'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { getDocumentTitle, formatRelativeDate } from '../utils/documentUtils'

export default function TrashPage() {
  const { documents, restoreDocument, permanentlyDelete } = useDocumentStore()
  const dialog = useDialog()
  const deleted = documents.filter((document) => document.isDeleted).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  return (
    <section className="page-view">
      <div className="page-title-row"><div><p className="page-kicker">LIBRARY</p><h1>휴지통</h1><p className="page-description">삭제한 페이지는 여기에서 복구하거나 영구 삭제할 수 있습니다.</p></div></div>
      {deleted.length === 0 ? <div className="empty-state"><div className="empty-icon"><Trash2 size={25} /></div><h2>휴지통이 비어 있어요</h2><p>삭제한 문서가 여기에 표시됩니다.</p></div> : (
        <div className="document-list">
          <div className="list-header"><span>이름</span><span>마지막 수정</span><span>작업</span></div>
          {deleted.map((document) => <div className="document-row trash-row" key={document.id}>
            <span className="document-row-title"><Trash2 size={16} /><strong>{getDocumentTitle(document)}</strong></span>
            <span className="document-row-date">{formatRelativeDate(document.updatedAt)}</span>
            <span className="trash-actions"><button type="button" className="text-action" onClick={() => restoreDocument(document.id)}><RotateCcw size={14} />복구</button><button type="button" className="text-action danger" onClick={async () => {
              if (await dialog.confirm('이 작업은 되돌릴 수 없습니다.', { title: '영구 삭제', confirmLabel: '영구 삭제', danger: true })) permanentlyDelete(document.id)
            }}>영구 삭제</button></span>
          </div>)}
        </div>
      )}
    </section>
  )
}
