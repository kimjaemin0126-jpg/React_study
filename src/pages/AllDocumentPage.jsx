import { useOutletContext } from 'react-router-dom'
import DocumentList from '../components/DocumentList'
import { useDocumentStore } from '../hooks/useDocumentStore'

export default function DocumentsPage() {
    const { activeDocuments } = useDocumentStore()
    const { openNewPage } = useOutletContext()

    return (
        <DocumentList
        documents={activeDocuments}
        title="모든 문서"
        description="작성한 문서를 확인하고 이어서 작업하세요."
        onNewPage={openNewPage}
        />
    )
}