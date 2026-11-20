import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { collectEvents, getTodayKey, shiftMonth, toDateKey } from '../calendar/calendarUtils'
import { useDocumentStore } from '../hooks/useDocumentStore'
import TaskBoard from './TaskBoard'
import './TaskViews.css'

const viewTypes = [
    { id: 'board', label: '▥ 보드 보기' },
    { id: 'feed', label: '▤ 피드' },
    { id: 'timeline', label: '▦ 타임라인' },
]

const statuses = [
    { id: 'todo', label: '시작 전' },
    { id: 'doing', label: '진행 중' },
    { id: 'done', label: '완료' },
]

function TaskFields({ task, updateDocument }) {
    return (
        <div className="task-views-fields">
        <label>
            상태
            <select
            value={task.taskStatus ?? 'todo'}
            onChange={(event) =>
                updateDocument(task.id, {
                taskStatus: event.target.value,
                })
            }
            >
            {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                {status.label}
                </option>
            ))}
            </select>
        </label>

        <label>
            시작일
            <input
            type="date"
            value={task.startDate || ''}
            onChange={(event) => {
                const next = event.target.value

                updateDocument(task.id, {
                startDate: next || null,

                endDate: next
                    ? (
                        !task.endDate || task.endDate < next
                        ? next
                        : task.endDate
                    )
                    : null,
                })
            }}
            />
        </label>

        <label>
            종료일
            <input
            type="date"
            value={task.endDate || ''}
            min={task.startDate || undefined}
            disabled={!task.startDate}
            onChange={(event) => {
                const next = event.target.value

                if (next && next < task.startDate) return

                updateDocument(task.id, {
                endDate: next || null,
                })
            }}
            />
        </label>
        </div>
    )
}

function FeedView({ tasks, updateDocument }) {
    const sorted = [...tasks].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    )

    return (
        <div className="task-views-feed">
        {sorted.length === 0 && (
            <p className="task-views-empty">
            아직 일정이 없습니다. 보드 보기에서 일정을 추가하세요.
            </p>
        )}

        {sorted.map((task) => (
            <article className="task-views-feed-card" key={task.id}>
            <p className="task-views-meta">
                수정일: {new Date(task.updatedAt).toLocaleDateString('ko-KR')}
            </p>

            <h3>
                <Link to={`/documents/${task.id}`}>
                {task.title.trim() || '제목 없음'}
                </Link>
            </h3>

            <p className="task-views-content">
                {task.blocks
                .map((block) => block.content)
                .filter(Boolean)
                .join('\n') || '제목을 눌러 내용을 작성하세요.'}
            </p>

            <TaskFields task={task} updateDocument={updateDocument} />
            </article>
        ))}
        </div>
    )
}

function TimelineView({ tasks, documents, updateDocument, calendar, filter }) {
    const { visibleMonth, setVisibleMonth, selectDate } = calendar
    const { year, month } = visibleMonth
    const lastDay = new Date(year, month + 1, 0).getDate()

    const days = Array.from(
        { length: lastDay },
        (_, index) => new Date(year, month, index + 1)
    )

    const firstKey = toDateKey(days[0])
    const lastKey = toDateKey(days[days.length - 1])
    const todayKey = toDateKey(new Date())

    const undated = tasks.filter((task) => !task.startDate)

    // 이달과 일정 기간이 하루라도 겹치는 항목
    const visibleTasks = filter === 'events' ? [] : tasks.filter((task) => {
        if (!task.startDate) return false

        const end = task.endDate || task.startDate

        return task.startDate <= lastKey && end >= firstKey
    })
    const visibleEvents = (filter === 'tasks' ? [] : collectEvents(documents)).filter(
        (event) => event.date >= firstKey && event.date <= lastKey
    )

    function changeMonth(offset) {
        setVisibleMonth((current) => shiftMonth(current, offset))
    }

    return (
        <div className="task-views-timeline">
        <div className="task-views-month">
            <h3>{year}년 {month + 1}월</h3>

            <div>
            <button
                type="button"
                aria-label="이전 달"
                onClick={() => changeMonth(-1)}
            >
                ‹
            </button>

            <button type="button" onClick={() => selectDate(getTodayKey())}>
                오늘
            </button>

            <button
                type="button"
                aria-label="다음 달"
                onClick={() => changeMonth(1)}
            >
                ›
            </button>
            </div>
        </div>

        <p className="task-views-meta">
            기간 작업 {visibleTasks.length}개 · 문서 일정 {visibleEvents.length}개 · 날짜 없음 {undated.length}개
        </p>

        <div
            className="task-views-scroll"
            tabIndex={0}
            role="region"
            aria-label="월별 일정 타임라인, 가로 스크롤 가능"
        >
            <div
            className="task-views-timeline-table"
            style={{ '--day-count': lastDay }}
            >
            <div className="task-views-timeline-row">
                <div className="task-views-name">일정</div>

                <div className="task-views-days">
                {days.map((date) => (
                    <div
                    key={toDateKey(date)}
                    className={
                        toDateKey(date) === todayKey
                        ? 'task-views-day is-today'
                        : 'task-views-day'
                    }
                    >
                    {date.getDate()}
                    </div>
                ))}
                </div>
            </div>

            {visibleTasks.map((task) => {
                const endDate = task.endDate || task.startDate

                // 월을 넘어가는 일정은 현재 달 영역까지만 표시
                const visibleStart =
                task.startDate < firstKey ? firstKey : task.startDate

                const visibleEnd =
                endDate > lastKey ? lastKey : endDate

                const startDay = Number(visibleStart.slice(-2))
                const endDay = Number(visibleEnd.slice(-2))

                return (
                <div className="task-views-timeline-row" key={task.id}>
                    <Link
                    className="task-views-name"
                    to={`/documents/${task.id}`}
                    >
                    {task.title.trim() || '제목 없음'}
                    </Link>

                    <div className="task-views-days task-views-track">
                    {days.map((date) => (
                        <span
                        key={toDateKey(date)}
                        className={
                            toDateKey(date) === todayKey
                            ? 'task-views-cell is-today'
                            : 'task-views-cell'
                        }
                        />
                    ))}

                    <Link
                        to={`/documents/${task.id}`}
                        className={`task-views-bar task-views-bar-${task.taskStatus ?? 'todo'}`}
                        style={{
                        gridColumn: `${startDay} / ${endDay + 1}`,
                        gridRow: 1,
                        }}
                        aria-label={`${task.title}, ${task.startDate}부터 ${endDate}까지`}
                    >
                        {task.title || '제목 없음'}
                    </Link>
                    </div>
                </div>
                )
            })}
            {visibleEvents.map((event) => {
                const day = Number(event.date.slice(-2))
                return (
                <div className="task-views-timeline-row" key={`${event.documentId}:${event.id}`}>
                    <Link className="task-views-name" to={`/documents/${event.documentId}`}>
                        {event.title || '제목 없음'}
                        <small>문서 일정 · {event.documentTitle}</small>
                    </Link>
                    <div className="task-views-days task-views-track">
                    {days.map((date) => <span key={toDateKey(date)} className={toDateKey(date) === todayKey ? 'task-views-cell is-today' : 'task-views-cell'} />)}
                    <Link
                        to={`/documents/${event.documentId}`}
                        className="task-views-bar task-views-event"
                        style={{ gridColumn: `${day} / ${day + 1}`, gridRow: 1 }}
                        aria-label={`${event.title}, ${event.date}${event.time ? ` ${event.time}` : ''}`}
                    >
                        {event.time || '종일'} · {event.title}
                    </Link>
                    </div>
                </div>
                )
            })}
            </div>
        </div>

        {visibleTasks.length === 0 && visibleEvents.length === 0 && (
            <p className="task-views-empty">
            이달에 표시할 일정이 없습니다.
            아래에서 날짜를 지정하거나 다른 달로 이동하세요.
            </p>
        )}

        <details className="task-views-date-manager" open>
            <summary>일정 날짜·상태 관리</summary>

            <p className="task-views-meta">
            시작일을 지정하면 해당 월의 타임라인에 표시됩니다.
            </p>

            {tasks.map((task) => (
            <div className="task-views-date-item" key={task.id}>
                <Link to={`/documents/${task.id}`}>
                {task.title.trim() || '제목 없음'}
                </Link>

                <TaskFields task={task} updateDocument={updateDocument} />
            </div>
            ))}
        </details>
        </div>
    )
    }

export default function TaskViews() {
    const { calendar } = useOutletContext()
    const { activeDocuments, updateDocument } = useDocumentStore()

    // 하나의 일정 데이터를 모든 보기에서 함께 사용
    const tasks = activeDocuments.filter((document) => document.isTask)

    const [activeView, setActiveView] = useState('board')
    const [timelineFilter, setTimelineFilter] = useState('all')

    return (
        <section className="task-views">
        <div className="task-views-toolbar">
            <nav className="task-views-tabs" aria-label="일정 표시방식">
            {viewTypes.map((view) => (
                <button
                    key={view.id}
                    type="button"
                    aria-pressed={activeView === view.id}
                    onClick={() => setActiveView(view.id)}
                >
                    {view.label}
                </button>
                ))}
            </nav>
        </div>

        <div hidden={activeView !== 'board'}>
            <TaskBoard />
        </div>

        <div hidden={activeView !== 'feed'}>
            <FeedView tasks={tasks} updateDocument={updateDocument} />
        </div>

        <div hidden={activeView !== 'timeline'}>
        <div className="task-views-timeline-filters" role="group" aria-label="타임라인 일정 필터">
            {[
            { id: 'all', label: '전체' },
            { id: 'tasks', label: '작업' },
            { id: 'events', label: '문서 일정' },
            ].map((item) => (
            <button key={item.id} type="button" aria-pressed={timelineFilter === item.id} onClick={() => setTimelineFilter(item.id)}>
                {item.label}
            </button>
            ))}
        </div>
        <TimelineView tasks={tasks} documents={activeDocuments} updateDocument={updateDocument} calendar={calendar} filter={timelineFilter} />
        </div>

        </section>
    )
}
