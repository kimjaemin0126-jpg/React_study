import { createId } from '../utils/documentUtils'

const block = (type, content = '', checked = false) => ({
  id: createId(),
  type,
  content,
  checked
})

// 오늘 날짜: 2026.11.10 (화)
function today() {
  const d = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mm}.${dd} (${days[d.getDay()]})`
}

export const templates = [
  {
    id: 'blank',
    name: '빈 문서',
    description: '처음부터 자유롭게 작성합니다.',
    title: '제목 없음',
    blocks: [block('paragraph')]
  },
  {
    id: 'meeting',
    name: '스터디 회의록',
    description: '안건, 논의 내용, 결정 사항, 할 일을 정리합니다.',
    // getter: 문서를 만드는 순간의 날짜가 제목에 들어갑니다
    get title() {
      return `${today()} 회의록`
    },
    get blocks() {
      return [
        block('quote', `일시: ${today()}`),
        block('paragraph', '참석자: '),
        block('heading2', '안건'),
        block('numbered'),
        block('heading2', '논의 내용'),
        block('bullet'),
        block('heading2', '결정 사항'),
        block('bullet'),
        block('heading2', '할 일'),
        block('todo', '담당자 - 할 일 - 마감일')
      ]
    }
  },
  {
    id: 'study',
    name: '학습 노트',
    description: '핵심 개념, 코드 예시, 질문, 참고 자료를 정리합니다.',
    title: '학습 노트',
    blocks: [
      block('quote', '이번 주 주제: '),
      block('heading2', '핵심 개념'),
      block('bullet'),
      block('heading2', '코드 예시'),
      block('code', '// 예시 코드를 작성하세요'),
      block('heading2', '모르는 점 / 질문'),
      block('todo'),
      block('heading2', '참고 자료'),
      block('bullet', '링크: ')
    ]
  },
  {
    id: 'kpt',
    name: '주간 회고 (KPT)',
    description: 'Keep · Problem · Try 로 한 주를 돌아봅니다.',
    get title() {
      return `${today()} 주간 회고`
    },
    blocks: [
      block('quote', '이번 주를 한 문장으로 요약하면?'),
      block('heading2', 'Keep — 잘한 점, 계속할 것'),
      block('bullet'),
      block('heading2', 'Problem — 아쉬운 점, 문제'),
      block('bullet'),
      block('heading2', 'Try — 다음 주에 시도할 것'),
      block('todo')
    ]
  },
  {
    id: 'weekly',
    name: '주간 계획',
    description: '이번 주 우선순위와 일정을 계획합니다.',
    title: '이번 주 계획',
    blocks: [
      block('heading1', '이번 주 우선순위'),
      block('todo', '가장 중요한 일'),
      block('todo', '이번 주에 완료할 일'),
      block('heading2', '메모'),
      block('paragraph')
    ]
  },
  {
    id: 'project',
    name: '프로젝트 기획서',
    description: '개요, 목표, 기능, 일정, 역할 분담을 정리합니다.',
    title: '프로젝트 기획서',
    blocks: [
      block('quote', '한 줄 소개: '),
      block('heading2', '목표'),
      block('bullet'),
      block('heading2', '주요 기능'),
      block('numbered'),
      block('heading2', '일정'),
      block('todo', '1주차: '),
      block('todo', '2주차: '),
      block('heading2', '역할 분담'),
      block('bullet', '프론트엔드: '),
      block('bullet', '백엔드: '),
      block('divider'),
      block('heading3', '관련 자료'),
      block('bullet', '링크: ')
    ]
  },
  {
    id: 'issue',
    name: '버그 / 이슈 리포트',
    description: '현상, 재현 방법, 원인, 해결 방법을 기록합니다.',
    title: '이슈: ',
    blocks: [
      block('heading2', '현상'),
      block('paragraph'),
      block('heading2', '재현 방법'),
      block('numbered'),
      block('heading2', '기대 결과 vs 실제 결과'),
      block('bullet', '기대: '),
      block('bullet', '실제: '),
      block('heading2', '에러 로그'),
      block('code'),
      block('heading2', '원인 및 해결'),
      block('paragraph')
    ]
  },
  {
    id: 'checklist',
    name: '할 일 목록',
    description: '오늘 / 이번 주 할 일을 체크리스트로 관리합니다.',
    title: '할 일',
    blocks: [
      block('heading2', '오늘'),
      block('todo'),
      block('heading2', '이번 주'),
      block('todo'),
      block('heading2', '완료'),
      block('todo', '', true)
    ]
  }
]
