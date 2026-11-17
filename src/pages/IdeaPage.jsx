import IdeaSections from '../components/IdeaSections'
import './WorkspacePages.css'
import { useDocumentStore } from '../hooks/useDocumentStore'

export default function IdeasPage() {
    const { activeDocuments } = useDocumentStore()
    const workspaceId = activeDocuments.find((document) => document.workspaceId && !document.studyLeft)?.workspaceId
    return (
    <div className="workspace-page">
        <IdeaSections key={workspaceId ?? 'no-workspace'} workspaceId={workspaceId} />
    </div>
    )
}
