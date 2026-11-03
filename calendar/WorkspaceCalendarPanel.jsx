import { Link } from 'react-router-dom'
import CalendarShell from './CalendarShell'
import { collectEvents, formatDateLabel, getTodayKey, sortEvents } from './calendarUtils'

function EventLinks({ events, showDate = false }) {
  return (
    <ul className="calendar-event-list">
      {events.map((event) => (
        <li key={event.id}>
          <Link className="calendar-event-link" to={`/documents/${event.documentId}`}>
            <span className="calendar-event-time">{showDate ? formatDateLabel(event.date) : event.time || '종일'}{showDate && event.time && ` ${event.time}`}</span>
            <span className="calendar-event-title">{event.title}</span>
            <span className="calendar-event-document">{event.documentTitle}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// 모든 문서 화면의 캘린더: 전체 일정을 모아 보고, 누르면 해당 문서로 이동한다.
export default function WorkspaceCalendarPanel({ documents, calendar }) {
  const { selectedDate, selectDate } = calendar
  const events = sortEvents(collectEvents(documents))
  const dayEvents = events.filter((event) => event.date === selectedDate)
  const todayKey = getTodayKey()
  const upcoming = events.filter((event) => event.date >= todayKey)

  return (
    <CalendarShell title="전체 일정" subtitle={`모든 문서 · 일정 ${events.length}개`} events={events} calendar={calendar} onPickDate={selectDate}>
      <section className="calendar-day-detail">
        <h3>{formatDateLabel(selectedDate)}</h3>
        {dayEvents.length > 0 ? <EventLinks events={dayEvents} /> : <p className="calendar-empty">등록된 일정이 없습니다.</p>}
      </section>
      <section className="calendar-day-detail">
        <h3>다가오는 일정</h3>
        {upcoming.length > 0 ? <EventLinks events={upcoming} showDate /> : <p className="calendar-empty">예정된 일정이 없습니다.</p>}
        <p className="calendar-note">일정 추가와 수정은 각 문서의 캘린더에서 할 수 있습니다.</p>
      </section>
    </CalendarShell>
  )
}
