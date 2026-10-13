import { Clock3, FilePlus2, FileText, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDocumentTitle, formatRelativeDate } from '../utils/documentUtils'

export default function DocumentList({ documents, title, description, onNewPage, emptyTitle = '아직 문서가 없습니다', emptyDescription = '첫 페이지를 만들어 생각과 아이디어를 기록해 보세요.' }) {
  const sorted = [...documents].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  return (
    <section className="page-view">
      <div className="page-title-row">
        <div><p className="page-kicker">WORKSPACE</p><h1>{title}</h1><p className="page-description">{description}</p></div>
        {onNewPage && <button type="button" className="button button-primary" onClick={onNewPage}><FilePlus2 size={17} />새 페이지</button>}
      </div>
      {sorted.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><FileText size={25} /></div><h2>{emptyTitle}</h2><p>{emptyDescription}</p>{onNewPage && <button className="button button-primary" type="button" onClick={onNewPage}><FilePlus2 size={16} />새 페이지 만들기</button>}</div>
      ) : (
        <div className="document-list">
          <div className="list-header"><span>이름</span><span>마지막 수정</span></div>
          {sorted.map((document) => (
            <Link className="document-row" to={`/documents/${document.id}`} key={document.id}>
              <span className="document-row-title"><FileText size={17} /><strong>{getDocumentTitle(document)}</strong>{document.isFavorite && <Star size={14} className="favorite-mark" fill="currentColor" />}</span>
              <span className="document-row-date"><Clock3 size={14} />{formatRelativeDate(document.updatedAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
