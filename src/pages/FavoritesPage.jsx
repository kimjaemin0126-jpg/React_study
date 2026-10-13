import DocumentList from '../components/DocumentList'
import { useDocumentStore } from '../hooks/useDocumentStore'

export default function FavoritesPage() {
  const { activeDocuments } = useDocumentStore()
  return <DocumentList documents={activeDocuments.filter((document) => document.isFavorite)} title="즐겨찾기" description="자주 찾는 페이지를 모아두었습니다." emptyTitle="즐겨찾기가 비어 있어요" emptyDescription="문서에서 별 아이콘을 눌러 여기에 추가할 수 있습니다." />
}
