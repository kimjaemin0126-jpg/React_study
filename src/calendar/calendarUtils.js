import { createId } from '../utils/documentUtils'

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const pad = (value) => String(value).padStart(2, '0')

// 날짜는 'YYYY-MM-DD' 문자열로 다룬다.
// toISOString()은 UTC 기준이라 한국 시간 오전 9시 이전에 전날로 밀리므로 쓰지 않는다.
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getTodayKey() {
  return toDateKey(new Date())
}

export function getMonthOf(key) {
  const date = parseDateKey(key)
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function shiftMonth({ year, month }, amount) {
  const date = new Date(year, month + amount, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
}

// 달마다 높이가 달라지지 않도록 항상 6주(42칸)를 만든다.
export function buildMonthGrid({ year, month }) {
  const firstWeekday = new Date(year, month, 1).getDay()
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, 1 - firstWeekday + index)
    return {
      key: toDateKey(date),
      day: date.getDate(),
      weekday: date.getDay(),
      inMonth: date.getMonth() === month
    }
  })
}

export function formatMonthLabel({ year, month }) {
  return `${year}년 ${month + 1}월`
}

export function formatDateLabel(key) {
  const date = parseDateKey(key)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`
}

// 시간이 없는 종일 일정이 그날의 맨 앞에 오도록 정렬한다.
export function sortEvents(events) {
  return [...events].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
}

export function createEvent({ title, date, time = '' }) {
  return { id: createId(), title, date, time }
}

// 여러 문서의 일정을 어느 문서 소속인지와 함께 한 목록으로 모은다.
export function collectEvents(documents) {
  return documents.flatMap((document) => (document.events ?? []).map((event) => ({
    ...event,
    documentId: document.id,
    documentTitle: document.title.trim() || '제목 없음'
  })))
}
