import { Link } from 'react-router-dom'
import CalendarShell from './CalendarShell'
import { calendarMarkers, collectCalendarEntries, entriesOnDate, formatDateLabel, getTodayKey, sortEvents } from './calendarUtils'

function EventLinks({ events, showDate = false }) {
  return (
    <ul className="calendar-event-list">
      {events.map((event) => (
        <li key={event.id}>
          <Link className="calendar-event-link" to={`/documents/${event.documentId}`}>
            <span className="calendar-event-time">
              {event.kind === 'period'
                ? `${formatDateLabel(event.date)}${event.endDate !== event.date ? ` ~ ${formatDateLabel(event.endDate)}` : ''}`
                : showDate ? `${formatDateLabel(event.date)}${event.time ? ` ${event.time}` : ''}` : event.time || '종일'}
            </span>
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
  const { selectedDate, visibleMonth, selectDate } = calendar
  const events = collectCalendarEntries(documents)
  const dayEvents = entriesOnDate(events, selectedDate)
  const todayKey = getTodayKey()
  const upcoming = sortEvents(events.filter((event) => event.endDate >= todayKey).map((event) => ({
    ...event,
    sortDate: event.date < todayKey ? todayKey : event.date,
  }))).sort((a, b) => a.sortDate.localeCompare(b.sortDate) || a.time.localeCompare(b.time))

  return (
    <CalendarShell title="전체 일정" subtitle={`모든 문서 · 일정 ${events.length}개`} events={calendarMarkers(events, visibleMonth)} calendar={calendar} onPickDate={selectDate}>
      <section className="calendar-day-detail">
        <h3>{formatDateLabel(selectedDate)}</h3>
        {dayEvents.length > 0 ? <EventLinks events={dayEvents} /> : <p className="calendar-empty">등록된 일정이 없습니다.</p>}
      </section>
      <section className="calendar-day-detail">
        <h3>다가오는 일정</h3>
        {upcoming.length > 0 ? <EventLinks events={upcoming} showDate /> : <p className="calendar-empty">예정된 일정이 없습니다.</p>}
        <p className="calendar-note">문서 일정은 각 문서의 캘린더에서, 보드 일정 기간은 타임라인·피드에서 수정할 수 있습니다.</p>
      </section>
    </CalendarShell>
  )
}
