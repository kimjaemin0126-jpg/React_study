import { Plus } from 'lucide-react'
import { blockTypes } from './blockTypes'

export default function EditorToolbar({ onAddBlock }) {
  return (
    <div className="editor-toolbar">
      <span>블록 추가</span>
      <div className="toolbar-actions">
        {blockTypes.map((type) => (
          <button type="button" key={type.value} onClick={() => onAddBlock(type.value)} title={`${type.label} 블록 추가`}>
            <Plus size={13} />{type.label}
          </button>
        ))}
      </div>
    </div>
  )
}
