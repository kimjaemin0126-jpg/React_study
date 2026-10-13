import { useDocuments } from '../hooks/useDocuments'
import { DocumentContext } from './storeContext'

export function DocumentProvider({ children }) {
  const value = useDocuments()
  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
}
