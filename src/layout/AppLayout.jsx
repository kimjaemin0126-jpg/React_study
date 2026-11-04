import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useDocumentStore } from '../hooks/useDocumentStore'
import TemplateSelector from '../common/TemplateSelector'
import CalendarPanel from '../calendar/CalendarPanel'
import WorkspaceCalendarPanel from '../calendar/WorkspaceCalendarPanel'
import { useCalendarPanel } from '../calendar/useCalendarPanel'
import '../calendar/calendar.css'
import { getDocumentTitle } from '../utils/documentUtils'

export default function AppLayout() {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { documents, activeDocuments, createDocument, updateDocument, storageError } = useDocumentStore()
  const calendar = useCalendarPanel()

  // 문서 화면에서는 그 문서의 일정을, 나머지 화면에서는 전체 일정을 보여줌
  const documentId = location.pathname.match(/^\/documents\/([^/]+)/)?.[1]
  const currentDocument = documents.find((document) => document.id === documentId && !document.isDeleted)

  function createFromTemplate(templateId, parentId = null) {
    const id = createDocument(templateId, parentId)
    setTemplateOpen(false)
    setMobileSidebarOpen(false)
    navigate(`/documents/${id}`)
  }

  return (
    <div className="app-shell">
      {mobileSidebarOpen && <button className="mobile-scrim" aria-label="사이드바 닫기" onClick={() => setMobileSidebarOpen(false)} />}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onNewPage={() => setTemplateOpen(true)}
        onNewChild={(parentId) => createFromTemplate('blank', parentId)}
      />
      <div className="main-column">
        <Header onOpenSidebar={() => setMobileSidebarOpen(true)} onToggleCalendar={calendar.toggle} />
        {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
        <main className="main-content">
          <Outlet />
        </main>

        {calendar.isOpen && (currentDocument ? (
          <CalendarPanel
            documentTitle={getDocumentTitle(currentDocument)}
            events={currentDocument.events ?? []}
            onChange={(events) => updateDocument(currentDocument.id, { events })}
            calendar={calendar}
          />
        ) : (
          <WorkspaceCalendarPanel documents={activeDocuments} calendar={calendar} />
        ))}
      </div>
      {templateOpen && (
        <TemplateSelector
          onClose={() => setTemplateOpen(false)}
          onSelect={(templateId) => createFromTemplate(templateId)}
        />
      )}
    </div>
  )
}
