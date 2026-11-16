import { Link } from 'react-router-dom'
import CalendarShell from './CalendarShell'
import { buildMonthGrid, formatDateLabel } from './calendarUtils'
import { getDocumentTitle } from '../utils/documentUtils'

export default function TimelineCalendarPanel({ documents, calendar }) {
    const { selectedDate, visibleMonth, selectDate } = calendar
    const tasks = documents.filter((doc) => doc.isTask && doc.startDate)

    function isOnDate(task, date) {
        const endDate = task.endDate || task.startDate
        return task.startDate <= date && date <= endDate
    }

    // 달력에 보이는 날짜에만 점을 계산합니다. 저장하는 데이터가 아닙니다.
    const markers = buildMonthGrid(visibleMonth).flatMap(({ key: date }) =>
        tasks
        .filter((task) => isOnDate(task, date))
        .map(() => ({ date }))
    )

const selectedTasks = tasks.filter((task) => isOnDate(task, selectedDate))

return (
    <CalendarShell
        title="일정 캘린더"
        subtitle={`날짜가 있는 일정 ${tasks.length}개`}
        events={markers}
        calendar={calendar}
        onPickDate={selectDate}
    >
    <section className="calendar-day-detail">
        <h3>{formatDateLabel(selectedDate)}</h3>

        {selectedTasks.length === 0 ? (
        <p className="calendar-empty">등록된 일정이 없습니다.</p>
        ) : (
            <ul className="calendar-event-list">
                {selectedTasks.map((task) => (
                    <li key={task.id}>
                        <Link
                        className="calendar-event-link"
                        to={`/documents/${task.id}`}
                        >
                        <span className="calendar-event-title">
                            {getDocumentTitle(task)}
                        </span>
                        <span className="calendar-event-document">
                            {task.startDate}
                            {task.endDate && task.endDate !== task.startDate
                            ? ` ~ ${task.endDate}`
                            : ''}
                        </span>
                    </Link>
                </li>
                ))}
            </ul>
            )}
        </section>
    </CalendarShell>
    )
}