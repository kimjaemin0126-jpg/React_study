import { useState } from 'react'
import IdeaBoard from './IdeaBoard'
import { useIdeas } from '../hooks/useIdeas'
import { createId } from '../utils/documentUtils'

const SECTIONS_KEY_PREFIX = 'folio-idea-sections-v1'
const DEFAULT_SECTION_ID = 'default-ideas'

function getSectionsKey(workspaceId) {
  return `${SECTIONS_KEY_PREFIX}:${workspaceId}`
}

function loadSections(workspaceId) {
  if (!workspaceId) return []
  const raw = window.localStorage.getItem(getSectionsKey(workspaceId))
  if (raw === null) {
    return [{ id: DEFAULT_SECTION_ID, title: '아이디어 섹션 1' }]
  }

  const sections = JSON.parse(raw)
  if (
    !Array.isArray(sections) || sections.length === 0 ||
    !sections.every((section) => section &&
      typeof section.id === 'string' && typeof section.title === 'string') ||
    new Set(sections.map((section) => section.id)).size !== sections.length ||
    !sections.some((section) => section.id === DEFAULT_SECTION_ID)
  ) {
    throw new Error('섹션 데이터 형식이 올바르지 않습니다.')
  }
  return sections
}

function createSectionStore(workspaceId) {
  try {
    return { sections: loadSections(workspaceId), error: '', readable: true }
  } catch {
    return {
      sections: [],
      error: '섹션을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.',
      readable: false,
    }
  }
}

export default function IdeaSections({ workspaceId }) {
  // 카드 저장 상태는 부모 한 곳에서 관리해 섹션 사이의 덮어쓰기를 막습니다.
  const { ideas, error, readable, loading, addIdea, updateIdea, deleteIdea, moveIdea } = useIdeas(workspaceId)
  const [sectionStore, setSectionStore] = useState(() => createSectionStore(workspaceId))
  const [selectedIds, setSelectedIds] = useState([])
  const [destinationId, setDestinationId] = useState('')
  const [moving, setMoving] = useState(false)
  const [moveMessage, setMoveMessage] = useState('')

  // 삭제되어 더 이상 존재하지 않는 카드는 선택 개수에서 제외
  const selectedIdeas = ideas.filter((idea) =>
    selectedIds.includes(idea.id),
  )

  const canEdit = readable && sectionStore.readable
  const boardError = error || sectionStore.error

  function saveSections(nextSections) {
    if (!canEdit) return
    try {
      window.localStorage.setItem(getSectionsKey(workspaceId), JSON.stringify(nextSections))
      setSectionStore({ sections: nextSections, error: '', readable: true })
    } catch {
      setSectionStore({
        ...sectionStore,
        error: '섹션을 저장하지 못했습니다. 저장 공간을 확인해 주세요.',
      })
    }
  }

  function addSection() {
    saveSections([
      ...sectionStore.sections,
      { id: createId(), title: `아이디어 섹션 ${sectionStore.sections.length + 1}` },
    ])
  }

  function renameSection(sectionId, nextTitle) {
    saveSections(sectionStore.sections.map((section) => section.id === sectionId
      ? { ...section, title: nextTitle } : section))
  }
  function toggleSelection(ideaId) {
    if (moving) return

    setSelectedIds((current) =>
      current.includes(ideaId)
        ? current.filter((id) => id !== ideaId)
        : [...current, ideaId],
    )

    setMoveMessage('')
  }

  function clearSelection() {
    if (moving) return

    setSelectedIds([])
    setDestinationId('')
    setMoveMessage('')
  }

  async function moveSelectedIdeas() {
    if (!canEdit || moving || selectedIdeas.length === 0) return

    const destination = sectionStore.sections.find(
      (section) => section.id === destinationId,
    )

    if (!destination) return

    // 이미 목적지에 있는 카드는 서버에 다시 저장하지 않음
    const targets = selectedIdeas.filter(
      (idea) =>
        (idea.sectionId ?? DEFAULT_SECTION_ID) !== destinationId,
    )

    if (targets.length === 0) {
      setSelectedIds([])
      setDestinationId('')
      setMoveMessage('선택한 카드가 이미 해당 섹션에 있습니다.')
      return
    }

    setMoving(true)
    setMoveMessage('선택한 카드를 이동하고 있습니다.')

    const failedIds = []
    let successCount = 0

    try {
      // 기존 카드 이동 기능을 하나씩 실행
      for (const idea of targets) {
        try {
          const saved = await moveIdea(idea.id, destinationId)

          if (saved) {
            successCount += 1
          } else {
            failedIds.push(idea.id)
          }
        } catch {
          failedIds.push(idea.id)
        }
      }

      // 성공한 카드는 선택 해제, 실패한 카드만 선택 유지
      setSelectedIds(failedIds)

      if (failedIds.length > 0) {
        setMoveMessage(
          `${successCount}개 이동 완료, ${failedIds.length}개 이동 실패. 실패한 카드는 선택 상태로 남아 있습니다.`,
        )
      } else {
        setDestinationId('')
        setMoveMessage(
          `${successCount}개 카드를 ${destination.title || '제목 없는 섹션'}으로 이동했습니다.`,
        )
      }
    } finally {
      setMoving(false)
    }
  }
  return (
    <div className="idea-sections">
      {!workspaceId && <p className="idea-board-empty">공유 아이디어 보드를 사용하려면 스터디 문서를 만들거나 초대 링크로 참여하세요.</p>}
      {loading && <p className="idea-board-empty">아이디어를 불러오는 중입니다.</p>}
      {workspaceId && <>
      {boardError && <p className="idea-board-error" role="alert">{boardError}</p>}
      {selectedIdeas.length > 0 && (
        <div
          className="idea-selection-toolbar"
          role="region"
          aria-label="선택한 아이디어 이동"
          aria-busy={moving}
        >
          <strong>{selectedIdeas.length}개 선택됨</strong>

          <select
            aria-label="이동할 섹션"
            value={destinationId}
            onChange={(event) => setDestinationId(event.target.value)}
            disabled={moving || !canEdit}
          >
            <option value="">이동할 섹션 선택</option>

            {sectionStore.sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title || '제목 없는 섹션'}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="button button-primary"
            onClick={moveSelectedIdeas}
            disabled={!destinationId || moving || !canEdit}
          >
            {moving ? '이동 중…' : '이동'}
          </button>

          <button
            type="button"
            className="button"
            onClick={clearSelection}
            disabled={moving}
          >
            선택 해제
          </button>
        </div>
      )}

      <p className="idea-selection-message" role="status">
        {moveMessage}
      </p>
      {sectionStore.sections.map((section) => (
        <IdeaBoard
          key={section.id}
          section={section}
          ideas={ideas.filter((idea) =>
            (idea.sectionId ?? DEFAULT_SECTION_ID) === section.id)}
          error={boardError}
          readable={canEdit && !moving}
          addIdea={addIdea}
          updateIdea={updateIdea}
          deleteIdea={deleteIdea}
          onRenameSection={renameSection}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          selectionDisabled={moving || !canEdit}
        />
      ))}
      <button type="button" className="button" onClick={addSection} disabled={!canEdit||moving}>
        + 섹션 추가
      </button>
      </>}
    </div>
  )
}
