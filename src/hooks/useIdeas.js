import { useCallback, useEffect, useState } from 'react'
import { studyApi } from '../services/studyApi'

export function useIdeas(workspaceId) {
  const [store, setStore] = useState({ ideas: [], error: '', loading: Boolean(workspaceId) })
  const load = useCallback(async () => {
    if (!workspaceId) return setStore({ ideas: [], error: '', loading: false })
    setStore((current) => ({ ...current, loading: true, error: '' }))
    try {
      const { ideas } = await studyApi.getIdeas(workspaceId)
      setStore({ ideas, error: '', loading: false })
    } catch (err) {
      setStore({ ideas: [], error: err.message, loading: false })
    }
  }, [workspaceId])

  useEffect(() => { load() }, [load])

  async function addIdea(title, content, sectionId) {
    try {
      const { idea } = await studyApi.createIdea(workspaceId, { title, content, sectionId })
      setStore((current) => ({ ...current, ideas: [...current.ideas, idea] }))
      return true
    } catch (err) {
      setStore((current) => ({ ...current, error: err.message }))
      return false
    }
  }

  async function updateIdea(id, title, content) {
    try {
      const { idea } = await studyApi.updateIdea(workspaceId, id, { title, content })
      setStore((current) => ({ ...current, ideas: current.ideas.map((item) => item.id === id ? idea : item) }))
      return true
    } catch (err) {
      setStore((current) => ({ ...current, error: err.message }))
      return false
    }
  }

  async function deleteIdea(id) {
    try {
      await studyApi.deleteIdea(workspaceId, id)
      setStore((current) => ({ ...current, ideas: current.ideas.filter((idea) => idea.id !== id) }))
      return true
    } catch (err) {
      setStore((current) => ({ ...current, error: err.message }))
      return false
    }
  }

async function moveIdea(id, sectionId) {
  const currentIdea = store.ideas.find((idea) => idea.id === id)

  if (!currentIdea) return false

  try {
    const { idea } = await studyApi.updateIdea(workspaceId, id, {
      sectionId,
    })

    setStore((current) => ({
      ...current,
      error: '',
      ideas: current.ideas.map((item) =>
        item.id === id ? idea : item,
      ),
    }))

    return true
  } catch (err) {
    setStore((current) => ({
      ...current,
      error: err.message,
    }))

    return false
  }
}

  return { ideas: store.ideas, error: store.error, loading: store.loading, readable: Boolean(workspaceId) && !store.loading, addIdea, updateIdea, deleteIdea,moveIdea }
}
