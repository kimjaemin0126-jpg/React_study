import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import DocumentEditor from '../editor/DocumentEditor'
import { createBlock } from '../editor/blockTypes'
import { useDocumentStore } from '../hooks/useDocumentStore'
import { getDocumentTitle } from '../utils/documentUtils'

export default function ChildPageModal({ parentId, onClose }) {
    const [title, setTitle] = useState('')

    // 아직 문서를 만들지 않고, 팝업 안에서만 초안을 관리
    const [blocks, setBlocks] = useState(() => [
        createBlock('paragraph'),
    ])

    const navigate = useNavigate()

    const {
        activeDocuments,
        createDocument,
        updateDocument,
    } = useDocumentStore()

    const parent = activeDocuments.find(
        (document) => document.id === parentId
    )

    function submitPage(event) {
        event.preventDefault()

        if (!parent || !title.trim()) return

        const id = createDocument('blank', parentId)

        updateDocument(id, {
        title: title.trim(),
        blocks,
        })

        onClose()
        navigate(`/documents/${id}`)
    }

return (
    <Modal
        title="하위 페이지 만들기"
        onClose={onClose}
        className="child-page-modal"
        >
        {!parent ? (
            <p role="alert">상위 페이지를 찾을 수 없습니다.</p>
        ) : (
            <form className="child-page-form" onSubmit={submitPage}>
            <p className="modal-description">
                상위 페이지: {getDocumentTitle(parent)}
            </p>

            <label className="child-page-title-field">
                제목
                <input
                autoFocus
                placeholder="하위 페이지 제목"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                />
            </label>

            <div className="child-page-editor">
                <DocumentEditor blocks={blocks} onChange={setBlocks} />
            </div>

            <div className="child-page-modal-actions">
                <button type="button" className="button" onClick={onClose}>
                취소
                </button>
                <button
                type="submit"
                className="button button-primary"
                disabled={!title.trim()}
                >
                페이지 만들기
                </button>
            </div>
            </form>
        )}
    </Modal>
    )
}