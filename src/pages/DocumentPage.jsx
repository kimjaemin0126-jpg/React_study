import { useDialog } from '../context/dialogContext'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { CalendarDays, ChevronRight, Copy, Download, FilePlus2, FileText, MoreHorizontal, Star, Trash2, UserPlus, Users } from 'lucide-react'
import DocumentEditor from '../editor/DocumentEditor'
import { createBlock } from '../editor/blockTypes'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { studyApi } from '../services/studyApi'
import { formatRelativeDate, getDocumentTitle, hasParentCycle } from '../utils/documentUtils'
import { exportDocumentToPdf } from '../utils/exportPdf'

// 스터디 접근을 잃었을 때 이유를 알려주는 안내 창 (401/403: 강퇴, 410: 스터디 닫힘)
// 401/403은 강퇴 등으로 접근을 잃은 경우라서 홈으로 보냄 (닫힌 스터디는 문서에 남김)
function denyAccess(err, showAlert) {
  if (err.status === 401 || err.status === 403) showAlert('이 스터디에서 나가게 되어 문서를 열 수 없어요.', { title: '문서를 열 수 없어요' })
}

export default function DocumentPage() {
  const dialog = useDialog()
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { openChildPage, handleCreateStudy, toggleMembers, toggleCalendar, calendarOpen } = useOutletContext()
  const { documents, activeDocuments, updateDocument, moveToTrash, duplicateDocument, moveDocument } = useDocumentStore()
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

  const workspaceId = current?.workspaceId ?? null
  const [access, setAccess] = useState(null) // { workspaceId, status: 'ok' | 'denied', myRole, message }
  const [syncError, setSyncError] = useState('')
  const accessReady = workspaceId !== null && access?.workspaceId === workspaceId && access.status === 'ok'
  const canEdit = accessReady && ['OWNER', 'EDITOR'].includes(access.myRole)
  const inert = workspaceId !== null && !canEdit
  const title = current?.title
  const blocks = current?.blocks

  // 스터디 문서는 서버 내용을 기준으로 불러옴 (강퇴, 권한 변경이 바로 반영되도록)
  useEffect(() => {
    if (!workspaceId) return
    let ignore = false
    studyApi.getDocument(workspaceId)
      .then((remote) => {
        if (ignore) return
        updateDocument(documentId, {
          title: remote.title,
          blocks: remote.blocks.length ? remote.blocks : [createBlock()]
        })
        setAccess({ workspaceId, status: 'ok', myRole: remote.myRole })
      })
      .catch((err) => {
        if (ignore) return
        denyAccess(err, dialog.alert)
        setAccess({ workspaceId, status: err.status === 410 ? 'closed' : 'denied', message: err.message })
        if (err.status === 401 || err.status === 403) updateDocument(documentId, { studyLeft: true })
      })
    return () => { ignore = true }
  }, [workspaceId, documentId, updateDocument, dialog])

  // 문서를 열어둔 채로도 강퇴, 스터디 닫기가 바로 반영되도록 주기적으로 권한을 확인
  // (내용은 다시 불러오지 않아서 입력 중인 글이 지워지지 않음)
  useEffect(() => {
    if (!workspaceId) return
    let ignore = false
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      studyApi.getStudy(workspaceId).catch((err) => {
        if (ignore) return
        denyAccess(err, dialog.alert)
        setAccess({ workspaceId, status: err.status === 410 ? 'closed' : 'denied', message: err.message })
        if (err.status === 401 || err.status === 403) updateDocument(documentId, { studyLeft: true })
      })
    }, 5000)
    return () => {
      ignore = true
      window.clearInterval(timer)
    }
  }, [workspaceId, documentId, updateDocument, dialog])

  // 편집 내용을 서버에 저장 (입력이 0.8초 멈추면 저장, 보기 권한은 저장하지 않음)
  useEffect(() => {
    if (!workspaceId || !canEdit || !blocks) return
    const timer = window.setTimeout(() => {
      studyApi.saveDocument(workspaceId, { title, blocks })
        .then(() => setSyncError(''))
        .catch((err) => setSyncError(err.message))
    }, 800)
    return () => window.clearTimeout(timer)
  }, [workspaceId, canEdit, title, blocks])

  // 문서를 새로 열거나 바꿀 때 창을 맨 위로 올림
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector('.main-content')?.scrollTo?.(0, 0)
  }, [documentId])

  if (!current) return <div className="document-missing"><FileText size={24} /><h2>문서를 찾을 수 없습니다</h2><p>문서가 삭제되었거나 더 이상 존재하지 않습니다.</p><Link to="/">모든 문서 보기</Link></div>

  // 강퇴 등으로 접근을 잃으면 내 작업 화면(홈)으로 보냄
  if (access?.workspaceId === workspaceId && access.status === 'denied') {
    return <Navigate to="/" replace />
  }
  const isClosed = access?.workspaceId === workspaceId && access.status === 'closed'
  // 보기 권한이면 편집 관련 기능을 막음 (닫힌 스터디는 보관 목적이라 제외)
  const viewerOnly = workspaceId !== null && access?.workspaceId === workspaceId && access.myRole === 'VIEWER'
  const viewerHint = '보기 권한에서는 사용할 수 없어요'

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
          <button type="button" disabled={viewerOnly} title={viewerOnly ? viewerHint : undefined} className={`icon-button ${current.isFavorite ? 'active-favorite' : ''}`} title={current.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} aria-label={current.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} onClick={() => updateDocument(current.id, { isFavorite: !current.isFavorite })}><Star size={17} fill={current.isFavorite ? 'currentColor' : 'none'} /></button>
          {current.workspaceId ? (
            <button type="button" className="icon-button" title="팀원" aria-label="팀원" onClick={toggleMembers}><Users size={16} /></button>
          ) : (
            <button type="button" className="icon-button" title="스터디 만들기" aria-label="스터디 만들기" onClick={handleCreateStudy}><UserPlus size={16} /></button>
          )}
          <button type="button" className={`icon-button ${calendarOpen ? 'is-active' : ''}`} title="캘린더" aria-label="캘린더" onClick={toggleCalendar}><CalendarDays size={16} /></button>
          <button type="button" disabled={viewerOnly} className="icon-button" title={viewerOnly ? viewerHint : "PDF로 내보내기"} aria-label="PDF로 내보내기" onClick={() => exportDocumentToPdf(current)}><Download size={16} /></button>
          <button type="button" disabled={viewerOnly} className="icon-button" title={viewerOnly ? viewerHint : "문서 복제"} aria-label="문서 복제" onClick={() => {
            const copyId = duplicateDocument(current.id)
            if (copyId) navigate(`/documents/${copyId}`)
          }}><Copy size={16} /></button>
          <button type="button" disabled={viewerOnly} className="icon-button" title={viewerOnly ? viewerHint : "휴지통으로 이동"} aria-label="휴지통으로 이동" onClick={async () => {
            if (await dialog.confirm(`"${getDocumentTitle(current)}" 페이지와 하위 페이지를 휴지통으로 이동할까요?`, { title: '휴지통으로 이동', confirmLabel: '이동', danger: true })) {
              moveToTrash(current.id)
              navigate('/')
            }
          }}><Trash2 size={16} /></button>
          <button type="button" className="icon-button" title="페이지 옵션" aria-label="페이지 옵션" onClick={(event) => event.currentTarget.nextElementSibling?.classList.toggle('menu-open')}><MoreHorizontal size={18} /></button>
          <div className="document-menu">
            <label htmlFor="parent-select">상위 페이지</label>
            <select id="parent-select" value={current.parentId ?? ''} onChange={(event) => {
              if (!moveDocument(current.id, event.target.value || null)) dialog.alert('순환 구조가 되는 위치로 이동할 수 없습니다.', { title: '이동할 수 없어요' })
            }}>
              <option value="">최상위 페이지</option>
              {possibleParents.map((parent) => <option key={parent.id} value={parent.id}>{getDocumentTitle(parent)}</option>)}
            </select>
          </div>
        </div>
      </div>
      {isClosed && <p className="study-warning">스터디가 닫혔어요. 문서는 그대로 남아 있지만 더 이상 편집할 수 없어요.</p>}
      <div className="document-meta"><FileText size={15} /><span>마지막 수정 {formatRelativeDate(current.updatedAt)}</span></div>
      {access?.myRole === 'VIEWER' && <p className="study-warning">보기 전용 문서예요. 편집은 방장이나 편집자만 할 수 있어요.</p>}
      {syncError && <p className="study-error" role="alert">서버에 저장하지 못했어요: {syncError}</p>}
      <div inert={inert}>
        <input className="document-title-input" value={current.title} placeholder="제목 없음" onChange={(event) => changeTitle(event.target.value)} aria-label="문서 제목" />
        <div className="document-subtitle">{current.title.trim() ? '나만의 생각과 지식을 정리해 보세요.' : '제목 없음'}</div>
        <DocumentEditor blocks={current.blocks} onChange={(blocks) => updateDocument(current.id, { blocks })} />
      </div>
      <section className="child-pages">
        <div className="child-pages-heading"><h2>하위 페이지</h2><button type="button" className="text-action" onClick={() => openChildPage(current.id)}><FilePlus2 size={15} />페이지 추가</button></div>
        {children.length ? children.map((child) => <Link to={`/documents/${child.id}`} key={child.id} className="child-page-link"><FileText size={16} /><span>{getDocumentTitle(child)}</span><ChevronRight size={16} /></Link>) : <p className="child-empty">이 페이지에 연결된 하위 페이지가 없습니다.</p>}
      </section>
    </article>
  )
}
