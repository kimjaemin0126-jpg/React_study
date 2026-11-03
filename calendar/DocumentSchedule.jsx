import { CalendarDays, Plus } from 'lucide-react'
import { formatDateLabel, getTodayKey, sortEvents } from './calendarUtils'

const MAX_VISIBLE = 3

// 문서 제목 아래에 표시되는 이 문서의 다가오는 일정 요약
export default function DocumentSchedule({ events, onOpen }) {
  const todayKey = getTodayKey()
  const upcoming = sortEvents(events).filter((event) => event.date >= todayKey)
  const hiddenCount = upcoming.length - MAX_VISIBLE

  return (
    <section className="document-schedule" aria-label="이 문서의 일정">
      <span className="document-schedule-label"><CalendarDays size={14} />일정</span>
      {upcoming.slice(0, MAX_VISIBLE).map((event) => (
        <button type="button" key={event.id} className="schedule-chip" onClick={() => onOpen(event.date)}>
          <span>{formatDateLabel(event.date)}{event.time && ` ${event.time}`}</span>
          <strong>{event.title}</strong>
        </button>
      ))}
      {hiddenCount > 0 && <button type="button" className="text-action" onClick={() => onOpen()}>외 {hiddenCount}개</button>}
      {upcoming.length === 0 && events.length > 0 && <span className="schedule-note">예정된 일정이 없습니다. (지난 일정 {events.length}개)</span>}
      {upcoming.length === 0 && <button type="button" className="text-action" onClick={() => onOpen()}><Plus size={13} />일정 추가</button>}
    </section>
  )
}
