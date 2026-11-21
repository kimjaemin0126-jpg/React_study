import { createId } from '../utils/documentUtils.js'

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

// 종료일이 없거나 시작일보다 앞서면 하루짜리 일정으로 본다.
export function getEventEndDate(event) {
  return event.endDate && event.endDate >= event.date ? event.endDate : event.date
}

export function createEvent({ title, date, endDate, time = '' }) {
  return { id: createId(), title, date, endDate: endDate && endDate >= date ? endDate : date, time }
}

// 시작일이 같으면 '5월 3일 (월)', 기간이면 '5월 3일 (월) ~ 5월 5일 (수)'
export function formatRangeLabel(start, end) {
  return end && end !== start ? `${formatDateLabel(start)} ~ ${formatDateLabel(end)}` : formatDateLabel(start)
}

// 여러 문서의 일정을 어느 문서 소속인지와 함께 한 목록으로 모은다.
export const TASK_STATUS_LABELS = { todo: '시작 전', doing: '진행 중', done: '완료' }

// 보드 문서가 아니면 상태를 보여주지 않으려고 null
function taskStatusOf(document) {
  return document.isTask ? (document.taskStatus ?? 'todo') : null
}

export function collectEvents(documents) {
  return documents.flatMap((document) => (document.events ?? []).map((event) => ({
    ...event,
    documentId: document.id,
    documentTitle: document.title.trim() || '제목 없음',
    taskStatus: taskStatusOf(document),
  })))
}

// 문서별 events와 보드의 기간을 조회할 때만 합칩니다. 원본 데이터는 바꾸지 않습니다.
export function collectCalendarEntries(documents) {
  const active = documents.filter((document) => !document.isDeleted)
  const events = collectEvents(active).map((event) => ({
    ...event,
    id: `${event.documentId}:event:${event.id}`,
    time: event.time || '',
    endDate: getEventEndDate(event),
    kind: 'event',
  }))
  const periods = active.filter((document) => document.isTask && document.startDate).map((document) => ({
    id: `${document.id}:period`,
    documentId: document.id,
    documentTitle: document.title.trim() || '제목 없음',
    title: document.title.trim() || '제목 없음',
    taskStatus: taskStatusOf(document),
    date: document.startDate,
    endDate: document.endDate && document.endDate >= document.startDate ? document.endDate : document.startDate,
    time: '',
    kind: 'period',
  }))
  return sortEvents([...events, ...periods])
}

export function entriesOnDate(entries, date) {
  return entries.filter((entry) => entry.date <= date && date <= (entry.endDate || entry.date))
}

export function calendarMarkers(entries, month) {
  return buildMonthGrid(month).flatMap(({ key }) => entriesOnDate(entries, key).map(() => ({ date: key })))
}
