import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { WEEKDAYS, buildMonthGrid, formatDateLabel, formatMonthLabel, getTodayKey, shiftMonth } from './calendarUtils'

// 문서별 캘린더와 전체 일정 캘린더가 함께 쓰는 틀 (제목, 월 이동, 달력)
export default function CalendarShell({ title, subtitle, events, calendar, onPickDate, children }) {
  const { selectedDate, visibleMonth, setVisibleMonth, close } = calendar
  const todayKey = getTodayKey()
  const eventCounts = {}
  events.forEach((event) => {
    eventCounts[event.date] = (eventCounts[event.date] ?? 0) + 1
  })

  return (
    <aside className="calendar-panel" aria-label={title} onKeyDown={(event) => {
      if (event.key === 'Escape') close()
    }}>
      <div className="calendar-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button type="button" className="icon-button" aria-label="캘린더 닫기" title="캘린더 닫기" onClick={close}><X size={17} /></button>
      </div>

      <div className="calendar-month-nav">
        <button type="button" className="icon-button" aria-label="이전 달" onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))}><ChevronLeft size={17} /></button>
        <strong aria-live="polite">{formatMonthLabel(visibleMonth)}</strong>
        <button type="button" className="icon-button" aria-label="다음 달" onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))}><ChevronRight size={17} /></button>
        <button type="button" className="text-action" onClick={() => onPickDate(todayKey)}>오늘</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => <span key={weekday} className="calendar-weekday">{weekday}</span>)}
        {buildMonthGrid(visibleMonth).map((cell) => {
          const count = eventCounts[cell.key] ?? 0
          const classes = ['calendar-day']
          if (!cell.inMonth) classes.push('is-outside')
          if (cell.weekday === 0) classes.push('is-sunday')
          if (cell.weekday === 6) classes.push('is-saturday')
          if (cell.key === todayKey) classes.push('is-today')
          if (cell.key === selectedDate) classes.push('is-selected')
          return (
            <button type="button" key={cell.key} className={classes.join(' ')} aria-label={`${formatDateLabel(cell.key)}${count ? `, 일정 ${count}개` : ''}`} aria-pressed={cell.key === selectedDate} aria-current={cell.key === todayKey ? 'date' : undefined} onClick={() => onPickDate(cell.key)}>
              <span>{cell.day}</span>
              <i className="calendar-dots" aria-hidden="true">{Array.from({ length: Math.min(count, 3) }, (_, index) => <b key={index} />)}</i>
            </button>
          )
        })}
      </div>

      {children}
    </aside>
  )
}
