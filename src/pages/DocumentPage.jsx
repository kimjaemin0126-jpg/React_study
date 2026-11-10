import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ChevronRight, Copy, Download, FilePlus2, FileText, MoreHorizontal, Star, Trash2, UserPlus, Users } from 'lucide-react'
import DocumentEditor from '../editor/DocumentEditor'
import { createBlock } from '../editor/blockTypes'
import MembersPanel from '../components/MembersPanel'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { studyApi } from '../services/studyApi'
import { formatRelativeDate, getDocumentTitle, hasParentCycle } from '../utils/documentUtils'
import { exportDocumentToPdf } from '../utils/exportPdf'

// 스터디 접근을 잃었을 때 이유를 알려주는 안내 창 (401/403: 강퇴, 410: 스터디 닫힘)
function denyAccess(err) {
  if (err.status === 410) window.alert('스터디가 닫혀서 문서를 열 수 없어요.')
  else if (err.status === 401 || err.status === 403) window.alert('이 스터디에서 나가게 되어 문서를 열 수 없어요.')
}

export default function DocumentPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { openChildPage } = useOutletContext()
  const { documents, activeDocuments, updateDocument, moveToTrash, duplicateDocument, moveDocument } = useDocumentStore()
  const [showMembers, setShowMembers] = useState(false)
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
        denyAccess(err)
        setAccess({ workspaceId, status: 'denied', message: err.message })
      })
    return () => { ignore = true }
  }, [workspaceId, documentId, updateDocument])

  // 문서를 열어둔 채로도 강퇴, 스터디 닫기가 바로 반영되도록 주기적으로 권한을 확인
  // (내용은 다시 불러오지 않아서 입력 중인 글이 지워지지 않음)
  useEffect(() => {
    if (!workspaceId) return
    let ignore = false
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      studyApi.getStudy(workspaceId).catch((err) => {
        if (ignore) return
        denyAccess(err)
        setAccess({ workspaceId, status: 'denied', message: err.message })
      })
    }, 5000)
    return () => {
      ignore = true
      window.clearInterval(timer)
    }
  }, [workspaceId])

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

  if (!current) return <div className="document-missing"><FileText size={24} /><h2>문서를 찾을 수 없습니다</h2><p>문서가 삭제되었거나 더 이상 존재하지 않습니다.</p><Link to="/">모든 문서 보기</Link></div>

  // 스터디 접근이 거부되면 내 작업 화면(홈)으로 보냄
  if (access?.workspaceId === workspaceId && access.status === 'denied') {
    return <Navigate to="/" replace />
  }

  const children = activeDocuments.filter((document) => document.parentId === current.id)
  const possibleParents = activeDocuments.filter((document) => document.id !== current.id && !hasParentCycle(activeDocuments, current.id, document.id))

  function changeTitle(value) {
    updateDocument(current.id, { title: value })
  }

  // 스터디 만들기: 방장 계정이 생기고, 지금 문서 내용을 서버에 한 번 올림
  // (이후 편집 내용의 서버 동기화는 다음 단계)
  async function handleCreateStudy() {
    const nickname = window.prompt('스터디에서 사용할 닉네임을 입력해주세요 (1~20자)')?.trim()
    if (!nickname) return

    const name = getDocumentTitle(current).slice(0, 50)
    try {
      const { workspace } = await studyApi.createStudy(name, nickname.slice(0, 20))
      await studyApi.saveDocument(workspace.id, { title: name, blocks: current.blocks })
      updateDocument(current.id, { workspaceId: workspace.id })
      setShowMembers(true)
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <article className="document-page">
      <div className="document-breadcrumb">
        <Link to="/">모든 문서</Link>
        {ancestry.map((parent) => <span key={parent.id} className="breadcrumb-parent"><ChevronRight size={14} /><Link to={`/documents/${parent.id}`}>{getDocumentTitle(parent)}</Link></span>)}
        <span><ChevronRight size={14} />{getDocumentTitle(current)}</span>
        <div className="document-actions">
          <button type="button" className={`icon-button ${current.isFavorite ? 'active-favorite' : ''}`} title={current.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} aria-label={current.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'} onClick={() => updateDocument(current.id, { isFavorite: !current.isFavorite })}><Star size={17} fill={current.isFavorite ? 'currentColor' : 'none'} /></button>
          {current.workspaceId ? (
            <button type="button" className="text-action" onClick={() => setShowMembers((value) => !value)}><Users size={15} />팀원</button>
          ) : (
            <button type="button" className="text-action" onClick={handleCreateStudy}><UserPlus size={15} />스터디 만들기</button>
          )}
          <button type="button" className="icon-button" title="PDF로 내보내기" aria-label="PDF로 내보내기" onClick={() => exportDocumentToPdf(current)}><Download size={16} /></button>
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
      {showMembers && current.workspaceId && (
        <MembersPanel
          workspaceId={current.workspaceId}
          onClose={() => setShowMembers(false)}
          onClosed={() => setAccess({ workspaceId, status: 'denied', message: '스터디를 닫았어요.' })}
        />
      )}
    </article>
  )
}
