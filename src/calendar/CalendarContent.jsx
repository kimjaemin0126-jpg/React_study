import CalendarPanel from './CalendarPanel'
import WorkspaceCalendarPanel from './WorkspaceCalendarPanel'
import { getDocumentTitle } from '../utils/documentUtils'

// 달력 상태는 레이아웃에서 유지하고, 현재 주소에 맞는 내용만 바꿉니다.
export default function CalendarContent({ documentId, documents, updateDocument, calendar }) {
  if (!calendar.isOpen) return null
  const active = documents.filter((document) => !document.isDeleted)
  if (!documentId) return <WorkspaceCalendarPanel documents={active} calendar={calendar} />

  const current = active.find((document) => document.id === documentId)
  if (!current) return null
  return (
    <CalendarPanel
      key={current.id}
      documentTitle={getDocumentTitle(current)}
      events={current.events ?? []}
      taskPeriod={current.isTask ? current : null}
      taskStatus={current.taskStatus ?? 'todo'}
      // 상태를 고르면 작업 보드에 바로 반영되도록 보드 문서로 표시
      onTaskStatusChange={(next) => updateDocument(current.id, { taskStatus: next, isTask: true })}
      onChange={(events) => updateDocument(current.id, { events })}
      readOnly={current.studyRole === 'VIEWER'}
      calendar={calendar}
    />
  )
}
