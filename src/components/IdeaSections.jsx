import { useEffect, useState } from 'react'
import IdeaBoard from './IdeaBoard'
import { useIdeas } from '../hooks/useIdeas'
import { createId } from '../utils/documentUtils'
import { studyApi } from '../services/studyApi'

const DEFAULT_SECTION_ID = 'default-ideas'

export default function IdeaSections({ workspaceId }) {
  // 카드 저장 상태는 부모 한 곳에서 관리해 섹션 사이의 덮어쓰기를 막습니다.
  const { ideas, error, readable, loading, addIdea, updateIdea, deleteIdea, moveIdea } = useIdeas(workspaceId)
  const [sectionStore, setSectionStore] = useState({ sections: [], error: '', readable: true })
  const [selectedIds, setSelectedIds] = useState([])
  const [destinationId, setDestinationId] = useState('')
  const [moving, setMoving] = useState(false)
  const [moveMessage, setMoveMessage] = useState('')

  // 섹션 목록을 서버에서 불러오고, 5초마다 다시 받아서 스터디 전체가 같은 섹션을 보게 함
  useEffect(() => {
    if (!workspaceId) return
    let ignore = false
    function load() {
      studyApi.getIdeaSections(workspaceId)
        .then(({ sections }) => {
          if (!ignore) setSectionStore((current) => ({ ...current, sections, error: '', readable: true }))
        })
        .catch((err) => {
          if (!ignore) setSectionStore((current) => ({ ...current, error: err.message, readable: false }))
        })
    }
    load()
    const timer = window.setInterval(load, 5000)
    return () => {
      ignore = true
      window.clearInterval(timer)
    }
  }, [workspaceId])

  // 삭제되어 더 이상 존재하지 않는 카드는 선택 개수에서 제외
  const selectedIdeas = ideas.filter((idea) =>
    selectedIds.includes(idea.id),
  )

  const canEdit = readable && sectionStore.readable
  const boardError = error || sectionStore.error

  function saveSections(nextSections) {
    if (!canEdit) return
    setSectionStore((current) => ({ ...current, sections: nextSections, error: '' }))
    studyApi.saveIdeaSections(workspaceId, nextSections).catch((err) => {
      setSectionStore((current) => ({ ...current, error: err.message }))
    })
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
