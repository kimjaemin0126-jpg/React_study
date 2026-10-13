import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, ChevronsLeft, FileText, Home, Plus, Search, Star, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { getDocumentTitle } from '../utils/documentUtils'

function TreeItem({ document, documents, onNewChild }) {
  const [expanded, setExpanded] = useState(true)
  const children = documents.filter((item) => item.parentId === document.id)
  const navigate = useNavigate()
  return (
    <div className="tree-item">
      <div className="tree-row">
        <button type="button" className="tree-expand" aria-label={expanded ? '하위 페이지 접기' : '하위 페이지 펼치기'} onClick={() => setExpanded(!expanded)}>
          {children.length ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span />}
        </button>
        <button type="button" className="tree-link" onClick={() => navigate(`/documents/${document.id}`)}>
          <FileText size={15} /><span>{getDocumentTitle(document)}</span>
        </button>
        <button type="button" className="tree-add" title="하위 페이지 추가" aria-label={`${getDocumentTitle(document)} 하위 페이지 추가`} onClick={() => onNewChild(document.id)}><Plus size={14} /></button>
      </div>
      {expanded && children.length > 0 && <div className="tree-children">{children.map((child) => <TreeItem key={child.id} document={child} documents={documents} onNewChild={onNewChild} />)}</div>}
    </div>
  )
}

export default function Sidebar({ mobileOpen, onCloseMobile, onNewPage, onNewChild }) {
  const [collapsed, setCollapsed] = useState(false)
  const { activeDocuments } = useDocumentStore()
  const roots = activeDocuments.filter((document) => !document.parentId || !activeDocuments.some((parent) => parent.id === document.parentId))
  const favorites = activeDocuments.filter((document) => document.isFavorite)

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="workspace-switcher">
        <div className="workspace-mark">F</div>
        <div className="workspace-name"><strong>Folio</strong><small>개인 워크스페이스</small></div>
        <button type="button" className="icon-button sidebar-collapse" aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
        <button type="button" className="icon-button mobile-close" aria-label="사이드바 닫기" onClick={onCloseMobile}><ChevronsLeft size={17} /></button>
      </div>
      <nav className="sidebar-nav" aria-label="워크스페이스">
        <NavLink to="/" end title="홈"><Home size={17} /><span>홈</span></NavLink>
        <button type="button" onClick={() => document.querySelector('.header-actions button[aria-label="검색"]')?.click()} title="빠른 검색"><Search size={17} /><span>빠른 검색</span><kbd>⌘ K</kbd></button>
        <div className="sidebar-divider" />
        <p className="sidebar-label">라이브러리</p>
        <NavLink to="/favorites" title="즐겨찾기"><Star size={17} /><span>즐겨찾기</span>{favorites.length > 0 && <small>{favorites.length}</small>}</NavLink>
        <NavLink to="/" end title="모든 문서"><FileText size={17} /><span>모든 문서</span></NavLink>
        <NavLink to="/trash" title="휴지통"><Trash2 size={17} /><span>휴지통</span></NavLink>
      </nav>
      <div className="tree-heading"><span className="sidebar-label">페이지</span><button type="button" className="icon-button" aria-label="새 페이지" title="새 페이지" onClick={onNewPage}><Plus size={16} /></button></div>
      <div className="document-tree">{roots.length ? roots.map((document) => <TreeItem key={document.id} document={document} documents={activeDocuments} onNewChild={onNewChild} />) : <p className="tree-empty">페이지가 없습니다.</p>}</div>
      <button type="button" className="sidebar-new-page" onClick={onNewPage}><Plus size={16} /><span>새 페이지</span></button>
      <div className="sidebar-profile"><div className="avatar">나</div><div><strong>내 워크스페이스</strong><small>로컬 저장소</small></div></div>
    </aside>
  )
}
