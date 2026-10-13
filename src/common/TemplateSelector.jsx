import { FilePlus2, NotebookPen } from 'lucide-react'
import { templates } from '../data/templates'
import Modal from './Modal'

export default function TemplateSelector({ onSelect, onClose }) {
  return (
    <Modal title="새 페이지 만들기" onClose={onClose} className="template-modal">
      <p className="modal-description">원하는 시작점을 선택하세요. 나중에 자유롭게 수정할 수 있습니다.</p>
      <div className="template-grid">
        {templates.map((template, index) => (
          <button type="button" className="template-option" key={template.id} onClick={() => onSelect(template.id)}>
            <span className="template-icon">{index === 0 ? <FilePlus2 size={20} /> : <NotebookPen size={20} />}</span>
            <strong>{template.name}</strong>
            <small>{template.description}</small>
          </button>
        ))}
      </div>
    </Modal>
  )
}
