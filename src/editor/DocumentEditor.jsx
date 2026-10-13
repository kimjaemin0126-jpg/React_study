import { useEffect, useRef } from 'react'
import BlockRenderer from './BlockRenderer'
import EditorToolbar from './EditorToolbar'
import { createBlock } from './blockTypes'

export default function DocumentEditor({ blocks, onChange }) {
  const editorRef = useRef(null)

  function updateBlock(index, changes) {
    onChange(blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...changes } : block))
  }

  function addBlock(type = 'paragraph', position = blocks.length) {
    const nextBlocks = [...blocks]
    nextBlocks.splice(position, 0, createBlock(type))
    onChange(nextBlocks)
    requestAnimationFrame(() => editorRef.current?.querySelectorAll('textarea')[position]?.focus())
  }

  function splitBlock(index, before, after, type) {
    const nextBlocks = [...blocks]
    nextBlocks[index] = { ...blocks[index], content: before }
    const nextType = ['heading1', 'heading2', 'heading3'].includes(type) ? 'paragraph' : type
    nextBlocks.splice(index + 1, 0, createBlock(nextType))
    nextBlocks[index + 1].content = after
    onChange(nextBlocks)
    requestAnimationFrame(() => {
      const textarea = editorRef.current?.querySelectorAll('textarea')[index + 1]
      textarea?.focus()
      textarea?.setSelectionRange(0, 0)
    })
  }

  function mergeBlock(index) {
    const previous = blocks[index - 1]
    const current = blocks[index]
    if (!previous || previous.type === 'divider' || current.type === 'divider') return
    const cursor = previous.content.length
    const nextBlocks = [...blocks]
    nextBlocks[index - 1] = { ...previous, content: previous.content + current.content }
    nextBlocks.splice(index, 1)
    onChange(nextBlocks)
    requestAnimationFrame(() => {
      const textarea = editorRef.current?.querySelectorAll('textarea')[index - 1]
      textarea?.focus()
      textarea?.setSelectionRange(cursor, cursor)
    })
  }

  function deleteBlock(index) {
    const nextBlocks = blocks.filter((_, blockIndex) => blockIndex !== index)
    onChange(nextBlocks.length ? nextBlocks : [createBlock()])
  }

  useEffect(() => {
    function onShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.altKey && /^[1-3]$/.test(event.key)) {
        event.preventDefault()
        const active = document.activeElement
        const target = active?.closest('.block-row')
        const rows = [...(editorRef.current?.querySelectorAll('.block-row') ?? [])]
        const index = target ? rows.indexOf(target) : -1
        if (index >= 0 && blocks[index]) updateBlock(index, { type: `heading${event.key}` })
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  })

  return (
    <div className="editor" ref={editorRef}>
      <div className="editor-help">텍스트에서 Enter를 누르면 새 블록이 생깁니다. 빈 블록에서 Alt + Backspace로 삭제할 수 있어요.</div>
      <div className="block-list">
        {blocks.map((block, index) => <BlockRenderer key={block.id} block={block} index={index} onChange={updateBlock} onDelete={deleteBlock} onSplit={splitBlock} onMerge={mergeBlock} />)}
      </div>
      <EditorToolbar onAddBlock={addBlock} />
    </div>
  )
}
