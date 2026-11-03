import { useState } from 'react'

// event가 있으면 수정 모드, 없으면 date 날짜에 새 일정을 추가하는 모드로 동작한다.
export default function EventForm({ date, event, onSubmit, onCancel }) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [time, setTime] = useState(event?.time ?? '')
  const [eventDate, setEventDate] = useState(event?.date ?? date)
  const targetDate = event ? eventDate : date
  const canSubmit = Boolean(title.trim() && targetDate)

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    if (!canSubmit) return
    onSubmit({ title: title.trim(), date: targetDate, time })
    if (!event) {
      setTitle('')
      setTime('')
    }
  }

  return (
    <form className="calendar-form" onSubmit={handleSubmit}>
      <input value={title} placeholder="일정 제목" aria-label="일정 제목" maxLength={100} onChange={(changeEvent) => setTitle(changeEvent.target.value)} />
      <div className="calendar-form-row">
        {event && <input type="date" value={eventDate} aria-label="일정 날짜" onChange={(changeEvent) => setEventDate(changeEvent.target.value)} />}
        <input type="time" value={time} aria-label="일정 시간 (비워두면 종일)" title="비워두면 종일 일정" onChange={(changeEvent) => setTime(changeEvent.target.value)} />
      </div>
      <div className="calendar-form-actions">
        {event && <button type="button" className="button" onClick={onCancel}>취소</button>}
        <button type="submit" className="button button-primary" disabled={!canSubmit}>{event ? '저장' : '일정 추가'}</button>
      </div>
    </form>
  )
}
