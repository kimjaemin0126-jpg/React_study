import { useDialog } from '../context/dialogContext'
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
import ChildPageModal from '../common/ChildPageModal'
import MembersPanel from '../components/MembersPanel'
import { studyApi } from '../services/studyApi'

export default function AppLayout() {
  const dialog = useDialog()
  const [templateOpen, setTemplateOpen] = useState(false)
  const [childParentId, setChildParentId] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
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

  function openChildPage(parentId) {
    setMobileSidebarOpen(false)
    setChildParentId(parentId)
  }

  // 스터디 만들기: 방장 계정이 생기고, 지금 문서 내용을 서버에 한 번 올림
  // (이후 편집 내용의 서버 동기화는 문서 화면에서 처리)
  async function handleCreateStudy() {
    if (!currentDocument) return
    const nickname = (await dialog.prompt('스터디에서 사용할 닉네임을 입력해주세요.', { title: '스터디 만들기', placeholder: '닉네임 (1~20자)', maxLength: 20, confirmLabel: '만들기' }))?.trim()
    if (!nickname) return

    const name = getDocumentTitle(currentDocument).slice(0, 50)
    try {
      const { workspace } = await studyApi.createStudy(name, nickname.slice(0, 20))
      await studyApi.saveDocument(workspace.id, { title: name, blocks: currentDocument.blocks })
      updateDocument(currentDocument.id, { workspaceId: workspace.id })
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
            handleCreateStudy,
            toggleMembers: () => setShowMembers((value) => !value),
            toggleCalendar: calendar.toggle,
            calendarOpen: calendar.isOpen,
          }} />
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
      {showMembers && currentDocument?.workspaceId && (
        <MembersPanel
          workspaceId={currentDocument.workspaceId}
          onClose={() => setShowMembers(false)}
          onClosed={() => setShowMembers(false)}
          onLeft={() => {
            // 나간 스터디 문서는 목록에서 숨김 (문서 자체는 이 기기에 남김)
            updateDocument(currentDocument.id, { studyLeft: true })
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
