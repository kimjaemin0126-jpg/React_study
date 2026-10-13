import { useContext } from 'react'
import { DocumentContext } from '../context/storeContext'

export function useDocumentStore() {
  const context = useContext(DocumentContext)
  if (!context) throw new Error('useDocumentStore는 DocumentProvider 안에서 사용해야 합니다.')
  return context
}
