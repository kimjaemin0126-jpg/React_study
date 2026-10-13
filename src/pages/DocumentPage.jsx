import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Copy, FilePlus2, FileText, MoreHorizontal, Star, Trash2 } from 'lucide-react'
import DocumentEditor from '../editor/DocumentEditor'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { formatRelativeDate, getDocumentTitle, hasParentCycle } from '../utils/documentUtils'

export default function DocumentPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { documents, activeDocuments, updateDocument, moveToTrash, duplicateDocument, moveDocument, createDocument } = useDocumentStore()
  const current = documents.find((document) => document.id === documentId && !document.isDeleted)
  const ancestry = useMemo(() => {
    if (!current) return []
    const path = []
    let parentId = current.parentId
    while (parentId) {
      const parent = activeDocuments.find((document) => document.id === parentId)
      if (!parent || path.some((item) => item.id === parent.id)) break
      path.unshift(parent)
      parentId = parent.parentId
    }
    return path
  }, [activeDocuments, current])

  if (!current) return <div className="document-missing"><FileText size={24} /><h2>문서를 찾을 수 없습니다</h2><p>문서가 삭제되었거나 더 이상 존재하지 않습니다.</p><Link to="/">모든 문서 보기</Link></div>

  const children = activeDocuments.filter((document) => document.parentId === current.id)
  const possibleParents = activeDocuments.filter((document) => document.id !== current.id && !hasParentCycle(activeDocuments, current.id, document.id))

  function changeTitle(value) {
    updateDocument(current.id, { title: value })
  }

  return (
    <article className="document-page">
      <div className="document-breadcrumb">
        <Link to="/">모든 문서</Link>
        {ancestry.map((parent) => <span key={parent.id} className="breadcrumb-parent"><ChevronRight size={14} /><Link to={`/documents/${parent.id}`}>{getDocumentTitle(parent)}</Link></span>)}
        <span><ChevronRight size={14} />{getDocumentTitle(current)}</span>
        <div className="document-actions">
          <button type="button" className={`icon-button ${current.isFavorite ? 'active-favorite' : ''}`} title={current.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} aria-label={current.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} onClick={() => updateDocument(current.id, { isFavorite: !current.isFavorite })}><Star size={17} fill={current.isFavorite ? 'currentColor' : 'none'} /></button>
          <button type="button" className="icon-button" title="문서 복제" aria-label="문서 복제" onClick={() => {
            const copyId = duplicateDocument(current.id)
            if (copyId) navigate(`/documents/${copyId}`)
          }}><Copy size={16} /></button>
          <button type="button" className="icon-button" title="휴지통으로 이동" aria-label="휴지통으로 이동" onClick={() => {
            if (window.confirm(`"${getDocumentTitle(current)}" 페이지와 하위 페이지를 휴지통으로 이동할까요?`)) {
              moveToTrash(current.id)
              navigate('/')
            }
          }}><Trash2 size={16} /></button>
          <button type="button" className="icon-button" title="페이지 옵션" aria-label="페이지 옵션" onClick={(event) => event.currentTarget.nextElementSibling?.classList.toggle('menu-open')}><MoreHorizontal size={18} /></button>
          <div className="document-menu">
            <label htmlFor="parent-select">상위 페이지</label>
            <select id="parent-select" value={current.parentId ?? ''} onChange={(event) => {
              if (!moveDocument(current.id, event.target.value || null)) window.alert('순환 구조가 되는 위치로 이동할 수 없습니다.')
            }}>
              <option value="">최상위 페이지</option>
              {possibleParents.map((parent) => <option key={parent.id} value={parent.id}>{getDocumentTitle(parent)}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="document-meta"><FileText size={15} /><span>마지막 수정 {formatRelativeDate(current.updatedAt)}</span></div>
      <input className="document-title-input" value={current.title} placeholder="제목 없음" onChange={(event) => changeTitle(event.target.value)} aria-label="문서 제목" />
      <div className="document-subtitle">{current.title.trim() ? '나만의 생각과 지식을 정리해 보세요.' : '제목 없음'}</div>
      <DocumentEditor blocks={current.blocks} onChange={(blocks) => updateDocument(current.id, { blocks })} />
      <section className="child-pages">
        <div className="child-pages-heading"><h2>하위 페이지</h2><button type="button" className="text-action" onClick={() => {
          const childId = createDocument('blank', current.id)
          navigate(`/documents/${childId}`)
        }}><FilePlus2 size={15} />페이지 추가</button></div>
        {children.length ? children.map((child) => <Link to={`/documents/${child.id}`} key={child.id} className="child-page-link"><FileText size={16} /><span>{getDocumentTitle(child)}</span><ChevronRight size={16} /></Link>) : <p className="child-empty">이 페이지에 연결된 하위 페이지가 없습니다.</p>}
      </section>
    </article>
  )
}
