import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export default function NotFoundPage() {
  return <div className="empty-state"><div className="empty-icon"><FileQuestion size={25} /></div><h2>페이지를 찾을 수 없습니다</h2><p>주소가 변경되었거나 문서가 삭제되었을 수 있습니다.</p><Link className="button button-primary" to="/">홈으로 이동</Link></div>
}
