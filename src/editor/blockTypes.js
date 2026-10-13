export const blockTypes = [
  { value: 'paragraph', label: '텍스트', shortcut: '텍스트' },
  { value: 'heading1', label: '제목 1', shortcut: '제목 1' },
  { value: 'heading2', label: '제목 2', shortcut: '제목 2' },
  { value: 'heading3', label: '제목 3', shortcut: '제목 3' },
  { value: 'bullet', label: '글머리 기호', shortcut: '글머리 기호' },
  { value: 'numbered', label: '번호 목록', shortcut: '번호 목록' },
  { value: 'todo', label: '체크리스트', shortcut: '체크리스트' },
  { value: 'quote', label: '인용문', shortcut: '인용문' },
  { value: 'divider', label: '구분선', shortcut: '구분선' },
  { value: 'code', label: '코드', shortcut: '코드 블록' }
]

export function createBlock(type = 'paragraph') {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    content: '',
    checked: false
  }
}
