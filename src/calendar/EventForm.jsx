import { useState } from 'react'
import { getEventEndDate } from './calendarUtils'

// event가 있으면 수정 모드, 없으면 date 날짜에 새 일정을 추가하는 모드로 동작한다.
// 시작일~종료일을 고를 수 있고, 종료일을 시작일과 같게 두면 하루 일정이다.
// 시간 대신 문서의 작업 상태(시작 전·진행 중·완료)를 고르며, 작업 보드에 그대로 반영된다.
const TASK_STATUS_OPTIONS = [
  { id: 'todo', label: '시작 전' },
  { id: 'doing', label: '진행 중' },
  { id: 'done', label: '완료' },
]

export default function EventForm({ date, event, taskStatus = 'todo', onTaskStatusChange, onSubmit, onCancel }) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [startDate, setStartDate] = useState(event?.date ?? date)
  const [endDate, setEndDate] = useState(event ? getEventEndDate(event) : date)
  const canSubmit = Boolean(title.trim() && startDate && endDate && endDate >= startDate)

  function changeStartDate(next) {
    setStartDate(next)
    // 시작일을 종료일 뒤로 옮기면 종료일도 함께 맞춘다.
    if (next && (!endDate || endDate < next)) setEndDate(next)
  }

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    if (!canSubmit) return
    onSubmit({ title: title.trim(), date: startDate, endDate })
    if (!event) setTitle('')
  }

  return (
    <form className="calendar-form" onSubmit={handleSubmit}>
      <input value={title} placeholder="일정 제목" aria-label="일정 제목" maxLength={100} onChange={(changeEvent) => setTitle(changeEvent.target.value)} />
      <div className="calendar-form-range">
        <label>
          시작일
          <input type="date" value={startDate} aria-label="시작일" onChange={(changeEvent) => changeStartDate(changeEvent.target.value)} />
        </label>
        <span aria-hidden="true">~</span>
        <label>
          종료일
          <input type="date" value={endDate} min={startDate || undefined} aria-label="종료일" onChange={(changeEvent) => setEndDate(changeEvent.target.value)} />
        </label>
      </div>
      <div className="calendar-form-row">
        <select value={taskStatus} aria-label="작업 상태" onChange={(changeEvent) => onTaskStatusChange?.(changeEvent.target.value)}>
          {TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="calendar-form-actions">
        {event && <button type="button" className="button" onClick={onCancel}>취소</button>}
        <button type="submit" className="button button-primary" disabled={!canSubmit}>{event ? '저장' : '일정 추가'}</button>
      </div>
    </form>
  )
}
