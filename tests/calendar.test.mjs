import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import { calendarMarkers, collectCalendarEntries, entriesOnDate } from '../src/calendar/calendarUtils.js'

const documents = [
  { id: 'doc-a', title: '문서 A', events: [{ id: 'same-id', title: 'A 회의', date: '2026-11-10', time: '14:00' }] },
  { id: 'doc-b', title: '문서 B', events: [{ id: 'same-id', title: 'B 복습', date: '2026-11-10', time: '' }] },
  { id: 'task', title: '기간 작업', isTask: true, startDate: '2026-11-09', endDate: '2026-11-12' },
  { id: 'removed', title: '삭제 문서', isDeleted: true, events: [{ id: 'gone', title: '삭제 일정', date: '2026-11-10' }] },
  { id: 'empty', title: '빈 문서' },
]

test('전체 일정은 문서 이벤트와 타임라인 기간을 합치고 삭제 문서는 제외한다', () => {
  const before = structuredClone(documents)
  const entries = collectCalendarEntries(documents)
  assert.equal(entries.length, 3)
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 3)
  assert.deepEqual(entriesOnDate(entries, '2026-11-10').map((entry) => entry.title).sort(), ['A 회의', 'B 복습', '기간 작업'])
  assert.deepEqual(documents, before)
})

test('기간 전체 날짜에 점을 표시하고 날짜 변경도 즉시 반영한다', () => {
  const entries = collectCalendarEntries(documents)
  assert.equal(entriesOnDate(entries, '2026-11-11').length, 1)
  assert.equal(entriesOnDate(entries, '2026-11-13').length, 0)
  const markers = calendarMarkers(entries, { year: 2026, month: 10 })
  assert.equal(markers.filter((marker) => marker.date === '2026-11-10').length, 3)
  const updated = documents.map((doc) => doc.id === 'task' ? { ...doc, startDate: '2026-12-01', endDate: '2026-12-03' } : doc)
  assert.equal(entriesOnDate(collectCalendarEntries(updated), '2026-11-11').length, 0)
  assert.equal(entriesOnDate(collectCalendarEntries(updated), '2026-12-02').length, 1)
})

test('월 경계를 넘는 기간과 종료일 없는 단일 일정을 표시한다', () => {
  const entries = collectCalendarEntries([
    { id: 'span', title: '월 경계', isTask: true, startDate: '2026-10-30', endDate: '2026-11-02' },
    { id: 'single', title: '하루', isTask: true, startDate: '2026-11-01' },
  ])
  assert.equal(entriesOnDate(entries, '2026-11-01').length, 2)
  assert.equal(entriesOnDate(entries, '2026-11-03').length, 0)
})

let vite
let CalendarContent
before(async () => {
  // 네트워크 포트나 사용자 브라우저 저장소 없이 실제 JSX를 렌더링합니다.
  vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
  CalendarContent = (await vite.ssrLoadModule('/src/calendar/CalendarContent.jsx')).default
})
after(async () => { await vite?.close() })

function render(documentId, isOpen = true) {
  const calendar = {
    isOpen, selectedDate: '2026-11-10', visibleMonth: { year: 2026, month: 10 },
    selectDate() {}, setVisibleMonth() {}, close() {},
  }
  return renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(CalendarContent, { documentId, documents, updateDocument() {}, calendar })))
}

test('홈에서는 전체 일정과 두 문서의 이벤트, 기간 작업을 함께 렌더링한다', () => {
  const html = render(undefined)
  assert.match(html, /전체 일정/)
  assert.match(html, /A 회의/)
  assert.match(html, /B 복습/)
  assert.match(html, /기간 작업/)
  assert.doesNotMatch(html, /삭제 일정/)
})

test('문서 A에서는 A 일정과 생성 폼만 표시하고 문서 B 일정은 표시하지 않는다', () => {
  const html = render('doc-a')
  assert.match(html, /이 문서의 일정/)
  assert.match(html, /A 회의/)
  assert.match(html, /일정 제목/)
  assert.match(html, /A 회의 수정/)
  assert.match(html, /A 회의 삭제/)
  assert.doesNotMatch(html, /B 복습/)
  assert.doesNotMatch(html, /기간 작업/)
})

test('문서를 바꾸면 그 문서의 일정만 표시하고 빈 문서도 추가 폼을 제공한다', () => {
  assert.doesNotMatch(render('doc-b'), /A 회의/)
  assert.match(render('doc-b'), /B 복습/)
  assert.match(render('empty'), /일정 제목/)
  assert.match(render('task'), /보드 일정 기간/)
})

test('닫힌 달력이나 존재하지 않거나 삭제된 문서는 패널을 렌더링하지 않는다', () => {
  assert.equal(render('doc-a', false), '')
  assert.equal(render('missing'), '')
  assert.equal(render('removed'), '')
})
