import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { templates } from '../data/templates'
import { loadDocuments, saveDocuments } from '../services/storageService'
import { createId, hasParentCycle } from '../utils/documentUtils'

function makeInitialDocuments() {
  const now = new Date().toISOString()
  return [
    {
      id: createId(),
      title: '환영합니다',
      parentId: null,
      blocks: [
        { id: createId(), type: 'heading1', content: 'MODO에 오신 것을 환영해요', checked: false },
        { id: createId(), type: 'paragraph', content: '이곳에서 생각을 정리하고 문서를 만들어 보세요. 모든 변경 사항은 이 브라우저에 자동으로 저장됩니다.', checked: false },
        { id: createId(), type: 'heading2', content: '시작하기', checked: false },
        { id: createId(), type: 'todo', content: '첫 번째 문서를 만들어 보기', checked: false },
        { id: createId(), type: 'todo', content: '중요한 페이지를 즐겨찾기에 추가하기', checked: false }
      ],
      isFavorite: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      title: '아이디어 보관함',
      parentId: null,
      blocks: [{ id: createId(), type: 'paragraph', content: '떠오르는 아이디어를 여기에 모아보세요.', checked: false }],
      isFavorite: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    }
  ]
}

export function useDocuments() {
  const [initialData] = useState(() => {
    try {
      return { documents: loadDocuments() ?? makeInitialDocuments(), error: '' }
    } catch (error) {
      console.error('문서를 불러오지 못했습니다.', error)
      return {
        documents: makeInitialDocuments(),
        error: '저장된 문서를 읽을 수 없습니다. 새 문서 데이터는 첫 변경 후 저장됩니다.'
      }
    }
  })
  const initialDocuments = useRef(initialData.documents)
  const [documents, setDocuments] = useState(initialData.documents)
  const [saveState, setSaveState] = useState(initialData.error ? 'error' : 'saved')
  const [storageError, setStorageError] = useState(initialData.error)

  useEffect(() => {
    if (initialData.error && documents === initialDocuments.current) return
    const timeout = window.setTimeout(() => {
      try {
        saveDocuments(documents)
        setStorageError('')
        setSaveState('saved')
      } catch (error) {
        console.error('문서를 저장하지 못했습니다.', error)
        setStorageError('저장 공간이 부족하거나 브라우저 저장소를 사용할 수 없습니다.')
        setSaveState('error')
      }
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [documents, initialData])

  const updateDocument = useCallback((documentId, changes) => {
    setSaveState('saving')
    setDocuments((current) => current.map((document) =>
      document.id === documentId
        ? { ...document, ...changes, updatedAt: new Date().toISOString() }
        : document
    ))
  }, [])

  const createDocument = useCallback((templateId = 'blank', parentId = null) => {
    const template = templates.find((item) => item.id === templateId) ?? templates[0]
    const now = new Date().toISOString()
    const document = {
      id: createId(),
      title: template.title,
      parentId,
      blocks: template.blocks.map((block) => ({ ...block, id: createId() })),
      isFavorite: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    }
    setSaveState('saving')
    setDocuments((current) => [document, ...current])
    return document.id
  }, [])

  const moveToTrash = useCallback((documentId) => {
    const ids = new Set([documentId])
    let changed = true
    while (changed) {
      changed = false
      documents.forEach((document) => {
        if (document.parentId && ids.has(document.parentId) && !ids.has(document.id)) {
          ids.add(document.id)
          changed = true
        }
      })
    }
    setSaveState('saving')
    setDocuments((current) => current.map((document) =>
      ids.has(document.id)
        ? { ...document, isDeleted: true, updatedAt: new Date().toISOString() }
        : document
    ))
  }, [documents])

  const restoreDocument = useCallback((documentId) => {
    const target = documents.find((item) => item.id === documentId)
    const parentIsDeleted = target?.parentId && documents.some(
      (item) => item.id === target.parentId && item.isDeleted
    )
    updateDocument(documentId, {
      isDeleted: false,
      parentId: parentIsDeleted ? null : target?.parentId ?? null
    })
  }, [documents, updateDocument])

  const permanentlyDelete = useCallback((documentId) => {
    setSaveState('saving')
    setDocuments((current) => current.filter((document) => document.id !== documentId))
  }, [])

  const duplicateDocument = useCallback((documentId) => {
    const source = documents.find((item) => item.id === documentId)
    if (!source) return null
    const now = new Date().toISOString()
    const copy = {
      ...source,
      id: createId(),
      title: `${source.title || '제목 없음'} 사본`,
      parentId: null,
      blocks: source.blocks.map((block) => ({ ...block, id: createId() })),
      isFavorite: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    }
    setSaveState('saving')
    setDocuments((current) => [copy, ...current])
    return copy.id
  }, [documents])

  const moveDocument = useCallback((documentId, parentId) => {
    if (parentId === documentId || (parentId && hasParentCycle(documents, documentId, parentId))) {
      return false
    }
    updateDocument(documentId, { parentId: parentId || null })
    return true
  }, [documents, updateDocument])

  const activeDocuments = useMemo(
    () => documents.filter((document) => !document.isDeleted && !document.studyLeft),
    [documents]
  )

  // 서버의 스터디 문서를 이 브라우저에 반영 (같은 id면 서버 내용으로 맞춤)
  const mergeStudyDocuments = useCallback((workspaceId, remoteDocs) => {
    setDocuments((current) => {
      const byId = new Map(current.map((document) => [document.id, document]))
      const now = new Date().toISOString()
      for (const remote of remoteDocs) {
        const local = byId.get(remote.id)
        byId.set(remote.id, {
          isFavorite: false,
          isDeleted: false,
          createdAt: now,
          ...local,
          id: remote.id,
          parentId: remote.parentId ?? null,
          title: remote.title,
          blocks: remote.blocks,
          events: remote.events ?? [],
          isTask: remote.isTask ?? false,
          startDate: remote.startDate ?? null,
          endDate: remote.endDate ?? null,
          status: remote.status ?? null,
          workspaceId,
          updatedAt: now,
        })
      }
      return [...byId.values()]
    })
  }, [])

  // 문서와 그 하위 문서 전체를 스터디에 연결
  const attachStudy = useCallback((documentId, workspaceId) => {
    setDocuments((current) => {
      const ids = new Set([documentId])
      let changed = true
      while (changed) {
        changed = false
        current.forEach((document) => {
          if (document.parentId && ids.has(document.parentId) && !ids.has(document.id)) {
            ids.add(document.id)
            changed = true
          }
        })
      }
      return current.map((document) => (ids.has(document.id) ? { ...document, workspaceId } : document))
    })
  }, [])

  // 같은 스터디의 모든 문서에 변경 적용 (예: 나간 스터디 표시)
  const updateWorkspaceDocuments = useCallback((workspaceId, changes) => {
    setDocuments((current) => current.map((document) => (document.workspaceId === workspaceId ? { ...document, ...changes } : document)))
  }, [])

  return {
    documents,
    activeDocuments,
    saveState,
    storageError,
    updateDocument,
    createDocument,
    moveToTrash,
    restoreDocument,
    permanentlyDelete,
    duplicateDocument,
    moveDocument,
    mergeStudyDocuments,
    attachStudy,
    updateWorkspaceDocuments
  }
}
