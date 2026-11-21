import { Link } from 'react-router-dom'
import CalendarShell from './CalendarShell'
import { calendarMarkers, collectCalendarEntries, entriesOnDate, formatDateLabel, TASK_STATUS_LABELS } from './calendarUtils'

function EventLinks({ events, showDate = false }) {
  return (
    <ul className="calendar-event-list">
      {events.map((event) => (
        <li key={event.id}>
          <Link className="calendar-event-link" to={`/documents/${event.documentId}`}>
            <span className="calendar-event-main">
              <span className="calendar-event-time">
                {event.endDate !== event.date
                  ? `${formatDateLabel(event.date)} ~ ${formatDateLabel(event.endDate)}`
                  : showDate ? `${formatDateLabel(event.date)}${event.time ? ` ${event.time}` : ''}` : event.time || '종일'}
              </span>
              {/* 날짜 아래에 문서 제목, 그 아래에 일정 제목 */}
              <span className="calendar-event-document">{event.documentTitle}</span>
              <span className="calendar-event-title">{event.title}</span>
            </span>
            {/* 오른쪽 칸: 보드 문서의 작업 상태 */}
            {event.taskStatus && (
              <span className={`calendar-event-status status-${event.taskStatus}`}>{TASK_STATUS_LABELS[event.taskStatus]}</span>
            )}
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
  // 다가오는 일정은 보완 후 다시 켜기로 하고 잠시 숨김 (복구: 아래 주석과 getTodayKey, sortEvents import를 되살리면 됨)
  // const todayKey = getTodayKey()
  // const upcoming = sortEvents(events.filter((event) => event.endDate >= todayKey).map((event) => ({
  //   ...event,
  //   sortDate: event.date < todayKey ? todayKey : event.date,
  // }))).sort((a, b) => a.sortDate.localeCompare(b.sortDate) || a.time.localeCompare(b.time))

  return (
    <CalendarShell title="전체 일정" subtitle={`모든 문서 · 일정 ${events.length}개`} events={calendarMarkers(events, visibleMonth)} calendar={calendar} onPickDate={selectDate}>
      <section className="calendar-day-detail">
        <h3>{formatDateLabel(selectedDate)}</h3>
        {dayEvents.length > 0 ? <EventLinks events={dayEvents} /> : <p className="calendar-empty">등록된 일정이 없습니다.</p>}
      </section>
      {/*
      <section className="calendar-day-detail">
        <h3>다가오는 일정</h3>
        {upcoming.length > 0 ? <EventLinks events={upcoming} showDate /> : <p className="calendar-empty">예정된 일정이 없습니다.</p>}
        <p className="calendar-note">문서 일정은 각 문서의 캘린더에서, 보드 일정 기간은 타임라인·피드에서 수정할 수 있습니다.</p>
      </section>
      */}
    </CalendarShell>
  )
}
