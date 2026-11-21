import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Search, Sun, Moon, X } from 'lucide-react'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { getDocumentTitle } from '../utils/documentUtils'

export default function Header({ onOpenSidebar }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('folio-theme') === 'dark')
  const navigate = useNavigate()
  const { activeDocuments, saveState } = useDocumentStore()
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])
  // 검색 창을 닫을 때 입력한 검색어도 함께 지워서, 다시 열거나 다른 화면으로 가도 남지 않게 함
  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
  }

  const results = query.trim()
    ? activeDocuments.filter((document) => `${document.title} ${document.blocks.map((block) => block.content).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : []

  function toggleTheme() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('folio-theme', next ? 'dark' : 'light')
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
  }

  return (
    <header className="app-header">
      <button type="button" className="icon-button mobile-menu-button" aria-label="메뉴 열기" onClick={onOpenSidebar}><Menu size={19} /></button>
      <div className="breadcrumbs"><Link to="/">내 문서</Link><span>/</span><span>나의 워크스페이스</span></div>
      <div className="header-actions">
        <span className={`save-indicator ${saveState}`} aria-live="polite">
          <i />{saveState === 'saving' ? '저장 중' : saveState === 'error' ? '저장 실패' : '저장됨'}
        </span>
        <button type="button" className="icon-button" title="검색 (Ctrl/⌘ + K)" aria-label="검색" onClick={() => setSearchOpen(true)}><Search size={18} /></button>
        <button type="button" className="icon-button" title="테마 전환" aria-label="테마 전환" onClick={toggleTheme}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
      </div>
      {searchOpen && (
        <div className="search-layer" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeSearch()
        }}>
          <section className="search-dialog" role="dialog" aria-modal="true" aria-label="문서 검색">
            <div className="search-field"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문서 제목과 본문 검색..." onKeyDown={(event) => {
              if (event.key === 'Escape') closeSearch()
            }} /><button type="button" className="icon-button" aria-label="검색 닫기" onClick={closeSearch}><X size={17} /></button></div>
            <div className="search-results">
              {!query.trim() && <p className="search-hint">제목과 본문에서 문서를 찾아보세요.</p>}
              {query.trim() && results.length === 0 && <p className="search-hint">검색 결과가 없습니다.</p>}
              {results.map((document) => (
                <button type="button" key={document.id} onClick={() => {
                  navigate(`/documents/${document.id}`)
                  closeSearch()
                }}>
                  <Search size={15} /><span>{getDocumentTitle(document)}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </header>
  )
}
