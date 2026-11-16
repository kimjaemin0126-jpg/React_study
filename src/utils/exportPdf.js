import { getDocumentTitle } from './documentUtils'

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

// 블록 하나를 HTML 조각으로 변환 (연속된 목록은 아래에서 한 덩어리로 묶음)
function blockToHtml(block) {
  const text = escapeHtml(block.content || '') || '&nbsp;'
  switch (block.type) {
    case 'heading1': return `<h1>${text}</h1>`
    case 'heading2': return `<h2>${text}</h2>`
    case 'heading3': return `<h3>${text}</h3>`
    case 'todo': return `<p class="todo">${block.checked ? '☑' : '☐'} ${text}</p>`
    case 'quote': return `<blockquote>${text}</blockquote>`
    case 'code': return `<pre><code>${escapeHtml(block.content || '')}</code></pre>`
    case 'divider': return '<hr>'
    default: return `<p>${text}</p>`
  }
}

function blocksToHtml(blocks) {
  const parts = []
  let list = null // { tag: 'ul' | 'ol', items: [] }

  const flush = () => {
    if (list) parts.push(`<${list.tag}>${list.items.join('')}</${list.tag}>`)
    list = null
  }

  for (const block of blocks) {
    const listTag = block.type === 'bullet' ? 'ul' : block.type === 'numbered' ? 'ol' : null
    if (listTag) {
      if (list && list.tag !== listTag) flush()
      if (!list) list = { tag: listTag, items: [] }
      list.items.push(`<li>${escapeHtml(block.content || '') || '&nbsp;'}</li>`)
    } else {
      flush()
      parts.push(blockToHtml(block))
    }
  }
  flush()
  return parts.join('\n')
}

const printStyles = `
  body { font-family: 'Malgun Gothic', sans-serif; color: #111; line-height: 1.7; margin: 0; }
  h1.doc-title { font-size: 28px; margin: 0 0 24px; }
  h1 { font-size: 24px; } h2 { font-size: 20px; } h3 { font-size: 17px; }
  p, li { font-size: 14px; margin: 4px 0; }
  blockquote { border-left: 3px solid #ccc; margin: 8px 0; padding-left: 12px; color: #555; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 6px; white-space: pre-wrap; font-size: 13px; }
  hr { border: 0; border-top: 1px solid #ddd; margin: 16px 0; }
  @page { margin: 20mm; }
`

// 브라우저 인쇄 창을 열어 "PDF로 저장"을 선택하게 함 (숨겨진 iframe 사용)
export function exportDocumentToPdf(doc) {
  const title = getDocumentTitle(doc)
  const html = `<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${printStyles}</style></head>
<body><h1 class="doc-title">${escapeHtml(title)}</h1>${blocksToHtml(doc.blocks)}</body>
</html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0;'
  document.body.appendChild(iframe)

  iframe.contentDocument.open()
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()

  iframe.contentWindow.focus()
  iframe.contentWindow.print()

  // 인쇄 창이 닫힌 뒤 정리 (afterprint가 안 올 수 있어서 넉넉히 기다린 뒤 제거)
  setTimeout(() => iframe.remove(), 60000)
}
