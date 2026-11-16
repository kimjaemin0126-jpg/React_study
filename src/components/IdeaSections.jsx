import { useState } from 'react'
import IdeaBoard from './IdeaBoard'
import { useIdeas } from '../hooks/useIdeas'
import { createId } from '../utils/documentUtils'

const SECTIONS_KEY = 'folio-idea-sections-v1'
const DEFAULT_SECTION_ID = 'default-ideas'

function loadSections() {
  const raw = window.localStorage.getItem(SECTIONS_KEY)
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

export default function IdeaSections() {
  // 카드 저장 상태는 부모 한 곳에서 관리해 섹션 사이의 덮어쓰기를 막습니다.
  const { ideas, error, readable, addIdea, updateIdea, deleteIdea } = useIdeas()
  const [sectionStore, setSectionStore] = useState(() => {
    try {
      return { sections: loadSections(), error: '', readable: true }
    } catch {
      return {
        sections: [],
        error: '섹션을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.',
        readable: false,
      }
    }
  })

  const canEdit = readable && sectionStore.readable
  const boardError = error || sectionStore.error

  function saveSections(nextSections) {
    if (!canEdit) return
    try {
      window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(nextSections))
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

  return (
    <div className="idea-sections">
      {boardError && <p className="idea-board-error" role="alert">{boardError}</p>}
      {sectionStore.sections.map((section) => (
        <IdeaBoard
          key={section.id}
          section={section}
          ideas={ideas.filter((idea) =>
            (idea.sectionId ?? DEFAULT_SECTION_ID) === section.id)}
          error={boardError}
          readable={canEdit}
          addIdea={addIdea}
          updateIdea={updateIdea}
          deleteIdea={deleteIdea}
          onRenameSection={renameSection}
        />
      ))}
      <button type="button" className="button" onClick={addSection} disabled={!canEdit}>
        + 섹션 추가
      </button>
    </div>
  )
}
