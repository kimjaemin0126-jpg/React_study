import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import CalendarShell from './CalendarShell'
import EventForm from './EventForm'
import { calendarMarkers, collectCalendarEntries, createEvent, entriesOnDate, formatDateLabel, formatRangeLabel, getEventEndDate, sortEvents } from './calendarUtils'

// 문서 안에서 여는 캘린더: 현재 문서의 일정을 보고 추가·수정·삭제한다.
export default function CalendarPanel({ documentTitle, events, onChange, calendar, taskPeriod = null, taskStatus = 'todo', onTaskStatusChange, readOnly = false }) {
  const [editingId, setEditingId] = useState(null)
  const { selectedDate, visibleMonth, selectDate } = calendar
  // 기간 일정은 시작일~종료일 사이의 모든 날짜에 보인다.
  const dayEvents = sortEvents(events.filter((event) => event.date <= selectedDate && selectedDate <= getEventEndDate(event)))
  const editingEvent = dayEvents.find((event) => event.id === editingId)
  const periods = taskPeriod ? collectCalendarEntries([{ ...taskPeriod, events: [] }]) : []
  const selectedPeriods = entriesOnDate(periods, selectedDate)
  const markers = calendarMarkers([...events.map((event) => ({ ...event, endDate: getEventEndDate(event) })), ...periods], visibleMonth)

  function pickDate(key) {
    setEditingId(null)
    selectDate(key)
  }

  function addEvent(values) {
    onChange([...events, createEvent(values)])
  }

  function saveEvent(values) {
    onChange(events.map((event) => event.id === editingId ? { ...event, ...values } : event))
    setEditingId(null)
    selectDate(values.date)
  }

  function deleteEvent(id) {
    if (id === editingId) setEditingId(null)
    onChange(events.filter((event) => event.id !== id))
  }

  return (
    <CalendarShell title="이 문서의 일정" subtitle={documentTitle} events={markers} calendar={calendar} onPickDate={pickDate}>
      <section className="calendar-day-detail">
        <h3>{formatDateLabel(selectedDate)}</h3>
        {selectedPeriods.map((period) => (
          <p key={period.id} className="calendar-period-note">보드 일정 기간: {period.date} ~ {period.endDate}</p>
        ))}
        {dayEvents.length === 0 && <p className="calendar-empty">이 날짜에 등록된 문서 일정이 없습니다.</p>}
        {dayEvents.length > 0 && (
          <ul className="calendar-event-list">
            {dayEvents.map((event) => (
              <li key={event.id} className={event.id === editingId ? 'is-editing' : ''}>
                <span className="calendar-event-title">
                  {event.title}
                  {getEventEndDate(event) !== event.date && <small className="calendar-event-range">{formatRangeLabel(event.date, getEventEndDate(event))}</small>}
                </span>
                {!readOnly && <button type="button" className="block-delete" aria-label={`${event.title} 수정`} title="일정 수정" onClick={() => setEditingId(event.id)}><Pencil size={13} /></button>}
                {!readOnly && <button type="button" className="block-delete" aria-label={`${event.title} 삭제`} title="일정 삭제" onClick={() => deleteEvent(event.id)}><Trash2 size={13} /></button>}
              </li>
            ))}
          </ul>
        )}
        {editingEvent
          ? <EventForm key={editingEvent.id} event={editingEvent} date={selectedDate} taskStatus={taskStatus} onTaskStatusChange={onTaskStatusChange} onSubmit={saveEvent} onCancel={() => setEditingId(null)} />
          : (readOnly ? <p className="calendar-empty">보기 권한에서는 일정을 추가할 수 없어요.</p> : <EventForm key={`new-${selectedDate}`} date={selectedDate} taskStatus={taskStatus} onTaskStatusChange={onTaskStatusChange} onSubmit={addEvent} />)}
      </section>
    </CalendarShell>
  )
}
