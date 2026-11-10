import { useState } from 'react'
import { Outlet, useMatch, useNavigate } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useDocumentStore } from '../hooks/useDocumentStore'
import TemplateSelector from '../common/TemplateSelector'
import ChildPageModal from '../common/ChildPageModal'
import CalendarContent from '../calendar/CalendarContent'
import { useCalendarPanel } from '../calendar/useCalendarPanel'
import '../calendar/calendar.css'

export default function AppLayout() {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [childParentId, setChildParentId] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const calendar = useCalendarPanel()
  const documentMatch = useMatch('/documents/:documentId')
  const tasksMatch = useMatch('/tasks')
  const displayedCalendar = {
    ...calendar,
    isOpen: Boolean(tasksMatch) || (Boolean(documentMatch) && calendar.isOpen),
    isPinned: Boolean(tasksMatch),
  }
  const { activeDocuments, createDocument, updateDocument, storageError } = useDocumentStore()

  function createFromTemplate(templateId, parentId = null) {
    const id = createDocument(templateId, parentId)
    setTemplateOpen(false)
    setMobileSidebarOpen(false)
    navigate(`/documents/${id}`)
  }

  function openChildPage(parentId) {
  setMobileSidebarOpen(false)
  setChildParentId(parentId)
  }

  return (
    <div className="app-shell">
      {mobileSidebarOpen && <button className="mobile-scrim" aria-label="사이드바 닫기" onClick={() => setMobileSidebarOpen(false)} />}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onNewPage={() => setTemplateOpen(true)}
        onNewChild={openChildPage}    
        />
      <div className="main-column">
        <Header onOpenSidebar={() => setMobileSidebarOpen(true)} />
        {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
        <main className="main-content">
          <Outlet context={{ openChildPage, calendar: displayedCalendar, openNewPage: () => setTemplateOpen(true),}} />

          <CalendarContent
            documentId={documentMatch?.params.documentId}
            documents={activeDocuments}
            updateDocument={updateDocument}
            calendar={displayedCalendar}
          />
        </main>
      </div>

      {templateOpen && (
        <TemplateSelector
          onClose={() => setTemplateOpen(false)}
          onSelect={(templateId) => createFromTemplate(templateId)}
        />
      )}
      {childParentId && (
        <ChildPageModal
          key={childParentId}
          parentId={childParentId}
          onClose={() => setChildParentId(null)}
        />
      )}
      </div>
  )
}
