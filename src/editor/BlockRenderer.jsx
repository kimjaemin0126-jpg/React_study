import { useEffect, useRef } from 'react'
import { GripVertical, Trash2 } from 'lucide-react'
import { blockTypes } from './blockTypes'

const placeholders = {
  paragraph: '내용을 입력하세요. (Enter로 다음 블록)',
  heading1: '제목 1',
  heading2: '제목 2',
  heading3: '제목 3',
  bullet: '목록 항목',
  numbered: '목록 항목',
  todo: '할 일',
  quote: '인용문',
  code: '코드를 입력하세요'
}

export default function BlockRenderer({ block, index, onChange, onDelete, onSplit, onMerge }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || block.type === 'code') return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [block.content, block.type])

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && block.type !== 'code') {
      event.preventDefault()
      const cursor = event.currentTarget.selectionStart
      const before = block.content.slice(0, cursor)
      const after = block.content.slice(cursor)
      onSplit(index, before, after, block.type)
    }
    if (event.key === 'Backspace' && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0 && index > 0) {
      event.preventDefault()
      onMerge(index)
    }
    if (event.key === 'Backspace' && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0 && !block.content) {
      if (event.altKey) {
        event.preventDefault()
        onDelete(index)
      }
    }
  }

  if (block.type === 'divider') {
    return <div className="block-row divider-row"><span className="block-grip"><GripVertical size={15} /></span><hr /><button type="button" className="block-delete" aria-label="구분선 삭제" onClick={() => onDelete(index)}><Trash2 size={14} /></button></div>
  }

  return (
    <div className={`block-row block-${block.type}`}>
      <span className="block-grip" aria-hidden="true"><GripVertical size={15} /></span>
      {block.type === 'todo' && <input className="todo-checkbox" type="checkbox" aria-label="할 일 완료" checked={Boolean(block.checked)} onChange={(event) => onChange(index, { checked: event.target.checked })} />}
      {(block.type === 'bullet' || block.type === 'numbered') && <span className="list-marker" aria-hidden="true">{block.type === 'bullet' ? '•' : `${index + 1}.`}</span>}
      <textarea
        ref={textareaRef}
        rows={block.type === 'code' ? 3 : 1}
        value={block.content}
        placeholder={placeholders[block.type] ?? placeholders.paragraph}
        aria-label={`${blockTypes.find((item) => item.value === block.type)?.label ?? '텍스트'} 블록 내용`}
        className={block.checked ? 'is-checked' : ''}
        onChange={(event) => {
          const field = event.currentTarget
          onChange(index, { content: field.value })
          field.style.height = 'auto'
          field.style.height = `${field.scrollHeight}px`
        }}
        onKeyDown={handleKeyDown}
        onInput={(event) => {
          if (block.type !== 'code') {
            event.currentTarget.style.height = 'auto'
            event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`
          }
        }}
      />
      <select
        className="block-type-select"
        aria-label="블록 유형"
        value={block.type}
        onChange={(event) => onChange(index, { type: event.target.value })}
      >
        {blockTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
      </select>
      <button type="button" className="block-delete" aria-label="블록 삭제" title="블록 삭제" onClick={() => onDelete(index)}><Trash2 size={14} /></button>
    </div>
  )
}
