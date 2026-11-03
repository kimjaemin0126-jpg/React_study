import { useState } from 'react'
import { loadIdeas, saveIdeas } from '../services/ideaStorageService'
import { createId } from '../utils/documentUtils'

export function useIdeas() {
  const [store, setStore] = useState(() => {
    try {
      return { ideas: loadIdeas(), error: '', readable: true }
    } catch {
      return { ideas: [], error: '아이디어를 불러오지 못했습니다. 기존 데이터는 보존됩니다. 새로고침 후 다시 시도해 주세요.', readable: false }
    }
  })

  function commit(next) {
    if (!store.readable) return false
    try {
      saveIdeas(next)
      setStore({ ideas: next, error: '', readable: true })
      return true
    } catch {
      setStore({ ...store, error: '아이디어를 저장하지 못했습니다. 입력 내용은 그대로입니다. 저장 공간을 확인하고 다시 시도해 주세요.' })
      return false
    }
  }

  function addIdea(title, content) {
    const now = new Date().toISOString()
    return commit([...store.ideas, {
      id: createId(), title: title.trim(), content: content.trim(), createdAt: now, updatedAt: now,
    }])
  }

  function updateIdea(id, title, content) {
    return commit(store.ideas.map((idea) => idea.id === id
      ? { ...idea, title: title.trim(), content: content.trim(), updatedAt: new Date().toISOString() }
      : idea))
  }

  function deleteIdea(id) {
    return commit(store.ideas.filter((idea) => idea.id !== id))
  }

  return {
    ideas: store.ideas.filter((idea) => !idea.isDeleted),
    error: store.error,
    readable: store.readable,
    addIdea, updateIdea, deleteIdea,
  }
}
