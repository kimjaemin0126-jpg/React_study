import { useState } from 'react'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarSidebar() {
  // 현재 달력에 표시할 연도와 월
const [viewDate, setViewDate] = useState(() => new Date())

  // 사용자가 선택한 날짜
const [selectedDate, setSelectedDate] = useState(() => new Date())

const today = new Date()
const year = viewDate.getFullYear()
  const month = viewDate.getMonth() // 0 = 1월, 11 = 12월

  // 이번 달 1일의 요일과 마지막 날짜
const firstDay = new Date(year, month, 1).getDay()
const lastDate = new Date(year, month + 1, 0).getDate()

  // 첫 주의 빈칸 + 이번 달 날짜
const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: lastDate }, (_, index) => index + 1),
]

function changeMonth(offset) {
    setViewDate(new Date(year, month + offset, 1))
}

function isSameDate(date, day) {
    return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
    )
}

function goToToday() {
    const now = new Date()
    setViewDate(now)
    setSelectedDate(now)
}

return (
<aside className="calendar-sidebar" aria-label="달력 사이드바">
    <div className="calendar-heading">
        <h2>{year}년 {month + 1}월</h2>

    <div className="calendar-controls">
        <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="이전 달"
        >
            ‹
        </button>

        <button type="button" onClick={goToToday}>
            오늘
        </button>

        <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="다음 달"
        >
            ›
        </button>
        </div>
    </div>

    <div className="calendar-grid">
        {weekdays.map((day) => (
        <span className="calendar-weekday" key={day}>
            {day}
        </span>
        ))}

        {cells.map((day, index) =>
        day === null ? (
            <span key={`empty-${index}`} />
        ) : (
        <button
            type="button"
            key={day}
            className={[
                'calendar-day',
                isSameDate(today, day) ? 'is-today' : '',
                isSameDate(selectedDate, day) ? 'is-selected' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setSelectedDate(new Date(year, month, day))}
            aria-label={`${year}년 ${month + 1}월 ${day}일`}
            aria-pressed={isSameDate(selectedDate, day)}
            aria-current={isSameDate(today, day) ? 'date' : undefined}
            >
            {day}
            </button>
        )
        )}
    </div>

    <div className="calendar-selection">
        선택한 날짜: {selectedDate.toLocaleDateString('ko-KR')}
    </div>
    </aside>
)
}