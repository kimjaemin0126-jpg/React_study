import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useDocumentStore } from '../hooks/useDocumentStore'
import TemplateSelector from '../common/TemplateSelector'

export default function AppLayout() {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { createDocument, storageError } = useDocumentStore()

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
        <Header onOpenSidebar={() => setMobileSidebarOpen(true)} />
        {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
        <main className="main-content"><Outlet /></main>
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
