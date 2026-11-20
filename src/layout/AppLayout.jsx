import { useState } from 'react'
import { Outlet, useMatch, useNavigate } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { useDialog } from '../context/dialogContext'
import TemplateSelector from '../common/TemplateSelector'
import ChildPageModal from '../common/ChildPageModal'
import CalendarContent from '../calendar/CalendarContent'
import { useCalendarPanel } from '../calendar/useCalendarPanel'
import '../calendar/calendar.css'
import MembersPanel from '../components/MembersPanel'
import { studyApi } from '../services/studyApi'
import { getDocumentTitle } from '../utils/documentUtils'
import { collectDescendantIds, toStudyDocs } from '../utils/studyDocs'
import { useStudyWatch } from '../hooks/useStudyWatch'

export default function AppLayout() {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [childParentId, setChildParentId] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const navigate = useNavigate()
  const dialog = useDialog()
  const calendar = useCalendarPanel()
  const documentMatch = useMatch('/documents/:documentId')
  const tasksMatch = useMatch('/tasks')
  const displayedCalendar = {
    ...calendar,
    isOpen: Boolean(tasksMatch) || (Boolean(documentMatch) && calendar.isOpen),
    isPinned: Boolean(tasksMatch),
  }
  const { documents, activeDocuments, createDocument, updateDocument, storageError, attachStudy, updateWorkspaceDocuments, applyStudyRole, hideStudyForMembers } = useDocumentStore()
  useStudyWatch({ documents, updateWorkspaceDocuments, applyStudyRole, hideStudyForMembers })
  const currentDocument = documentMatch
    ? documents.find((document) => document.id === documentMatch.params.documentId && !document.isDeleted)
    : undefined

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

  // 스터디 만들기: 방장 계정이 생기고, 지금 문서 내용을 서버에 한 번 올림
  async function handleCreateStudy() {
    if (!currentDocument) return
    const nickname = (await dialog.prompt('스터디에서 사용할 닉네임을 입력해주세요.', { title: '스터디 만들기', placeholder: '닉네임 (1~20자)', maxLength: 20, confirmLabel: '만들기' }))?.trim()
    if (!nickname) return

    const name = getDocumentTitle(currentDocument).slice(0, 50)
    try {
      const { workspace } = await studyApi.createStudy(name, nickname.slice(0, 20))
      const ids = collectDescendantIds(documents, currentDocument.id)
      const docs = toStudyDocs(documents.filter((document) => ids.has(document.id)).map((document) => ({ ...document, workspaceId: workspace.id })), workspace.id)
      await studyApi.saveDocument(workspace.id, { docs })
      attachStudy(currentDocument.id, workspace.id)
      applyStudyRole(workspace.id, 'OWNER')
      setMobileSidebarOpen(false)
      setShowMembers(true)
    } catch (err) {
      await dialog.alert(err.message, { title: '스터디를 만들 수 없어요' })
    }
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
          <Outlet context={{
            openChildPage,
            openNewPage: () => setTemplateOpen(true),
            calendar: displayedCalendar,
            handleCreateStudy,
            toggleMembers: () => setShowMembers((value) => !value),
            toggleCalendar: calendar.toggle,
            calendarOpen: displayedCalendar.isOpen,
          }} />

          <CalendarContent
            documentId={documentMatch?.params.documentId}
            documents={activeDocuments}
            updateDocument={updateDocument}
            calendar={displayedCalendar}
          />
        </main>
      </div>

      {showMembers && currentDocument?.workspaceId && (
        <MembersPanel
          workspaceId={currentDocument.workspaceId}
          onClose={() => setShowMembers(false)}
          onClosed={() => setShowMembers(false)}
          onDeleted={() => {
            // 팀원이 없어서 스터디 데이터가 지워졌으므로 목록에서도 숨김
            updateWorkspaceDocuments(currentDocument.workspaceId, { studyLeft: true })
            setShowMembers(false)
            navigate('/')
          }}
          onLeft={() => {
            // 나간 스터디 문서는 목록에서 숨김 (문서 자체는 이 기기에 남김)
            updateWorkspaceDocuments(currentDocument.workspaceId, { studyLeft: true })
            setShowMembers(false)
            navigate('/')
          }}
        />
      )}
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
