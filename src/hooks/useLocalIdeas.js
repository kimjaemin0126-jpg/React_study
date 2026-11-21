import { useState } from 'react'
import { createId } from '../utils/documentUtils'

// 개인 아이디어: 로그인 없이 이 브라우저에만 저장 (스터디에 들어가지 않은 상태)
// 카드와 섹션은 키를 나눠서 저장해 서로 덮어쓰지 않게 함
const IDEAS_KEY = 'folio-personal-ideas-v2'
const SECTIONS_KEY = 'folio-personal-idea-sections-v1'
export const DEFAULT_SECTION = { id: 'default-ideas', title: '아이디어 섹션 1' }

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간이 가득 찼거나 막혀 있으면 화면에서만 유지됨
  }
}

export function readLocalIdeas() {
  const data = readJson(IDEAS_KEY, [])
  return Array.isArray(data) ? data.filter((idea) => idea && typeof idea.id === 'string') : []
}

export function readLocalSections() {
  const data = readJson(SECTIONS_KEY, null)
  return Array.isArray(data) && data.length > 0 ? data : [DEFAULT_SECTION]
}

export function writeLocalSections(sections) {
  writeJson(SECTIONS_KEY, sections)
}

// 아이디어 목록을 관리하는 훅 (카드 추가, 수정, 삭제, 섹션 이동)
export function useLocalIdeas() {
  const [ideas, setIdeas] = useState(readLocalIdeas)

  function update(change) {
    setIdeas((current) => {
      const next = change(current)
      writeJson(IDEAS_KEY, next)
      return next
    })
    return true
  }

  return {
    ideas,
    error: '',
    loading: false,
    readable: true,
    addIdea: (title, content, sectionId) => update((current) => [
      ...current,
      { id: createId(), title, content, sectionId: sectionId || DEFAULT_SECTION.id, createdAt: new Date().toISOString() },
    ]),
    updateIdea: (id, title, content) => update((current) => current.map((idea) => (idea.id === id ? { ...idea, title, content } : idea))),
    deleteIdea: (id) => update((current) => current.filter((idea) => idea.id !== id)),
    moveIdea: (id, sectionId) => update((current) => current.map((idea) => (idea.id === id ? { ...idea, sectionId } : idea))),
  }
}
