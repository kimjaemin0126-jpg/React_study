import { createBlock } from '../editor/blockTypes'

// 고른 아이디어를 문서 블록으로 바꿈: 제목은 2단계 제목, 내용은 줄마다 텍스트
// 스터디 문서에 넣을 때는(author가 있으면) 작성자를 인용문으로 함께 적음
export function ideasToBlocks(ideas, author = '') {
  return ideas.flatMap((idea) => {
    const heading = { ...createBlock('heading2'), content: idea.title || '제목 없음' }
    const byline = author ? [{ ...createBlock('quote'), content: `작성자 · ${author}` }] : []
    const lines = (idea.content || '').split('\n').map((line) => line.trim()).filter(Boolean)
    return [heading, ...byline, ...lines.map((line) => ({ ...createBlock('paragraph'), content: line }))]
  })
}
