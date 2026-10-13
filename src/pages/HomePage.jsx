import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DocumentList from '../components/DocumentList'
import TemplateSelector from '../common/TemplateSelector'
import { useDocumentStore } from '../hooks/useDocumentStore'

export default function HomePage() {
  const [templateOpen, setTemplateOpen] = useState(false)
  const navigate = useNavigate()
  const { activeDocuments, createDocument } = useDocumentStore()
  function create(templateId) {
    const id = createDocument(templateId)
    setTemplateOpen(false)
    navigate(`/documents/${id}`)
  }
  return (
    <>
      <DocumentList documents={activeDocuments} title="모든 문서" description="워크스페이스의 페이지를 한눈에 확인하고 이어서 작업하세요." onNewPage={() => setTemplateOpen(true)} />
      {templateOpen && <TemplateSelector onClose={() => setTemplateOpen(false)} onSelect={create} />}
    </>
  )
}
