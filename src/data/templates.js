import { createId } from '../utils/documentUtils'

const block = (type, content = '') => ({
  id: createId(),
  type,
  content,
  checked: false
})

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
    name: '회의록',
    description: '회의 내용과 다음 할 일을 기록합니다.',
    title: '새 회의록',
    blocks: [
      block('heading1', '회의록'),
      block('paragraph', '날짜: '),
      block('heading2', '참석자'),
      block('paragraph'),
      block('heading2', '논의 내용'),
      block('bullet', '주요 안건을 적어보세요'),
      block('heading2', '다음 할 일'),
      block('todo', '담당자와 마감일을 정해보세요')
    ]
  },
  {
    id: 'project',
    name: '프로젝트 기획서',
    description: '목표, 일정, 범위를 한 곳에 정리합니다.',
    title: '새 프로젝트 기획서',
    blocks: [
      block('heading1', '프로젝트 개요'),
      block('paragraph', '해결하려는 문제와 목표를 작성하세요.'),
      block('heading2', '목표'),
      block('bullet', '목표 1'),
      block('heading2', '일정'),
      block('paragraph', '주요 마일스톤을 기록하세요.'),
      block('heading2', '참고 자료'),
      block('paragraph')
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
    id: 'study',
    name: '공부 노트',
    description: '배운 개념과 질문을 정리합니다.',
    title: '새 공부 노트',
    blocks: [
      block('heading1', '주제'),
      block('paragraph', '오늘 학습한 내용을 요약하세요.'),
      block('heading2', '핵심 개념'),
      block('bullet', '개념을 적어보세요'),
      block('heading2', '질문'),
      block('quote', '더 알아볼 내용을 적어두세요')
    ]
  },
  {
    id: 'checklist',
    name: '업무 체크리스트',
    description: '할 일을 작은 단계로 나눠 확인합니다.',
    title: '새 체크리스트',
    blocks: [
      block('heading1', '체크리스트'),
      block('todo', '첫 번째 할 일'),
      block('todo', '두 번째 할 일'),
      block('todo', '세 번째 할 일')
    ]
  }
]
