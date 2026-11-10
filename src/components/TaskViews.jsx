import { useState } from 'react'
import { Link } from 'react-router-dom'
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

// 날짜를 YYYY-MM-DD 문자열로 변환
function toDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

// 피드와 타임라인에서 함께 사용하는 상태·날짜 입력
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

function TimelineView({ tasks, updateDocument }) {
    const [viewMonth, setViewMonth] = useState(() => new Date())

    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
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
    const visibleTasks = tasks.filter((task) => {
        if (!task.startDate) return false

        const end = task.endDate || task.startDate

        return task.startDate <= lastKey && end >= firstKey
    })

    function changeMonth(offset) {
        setViewMonth(new Date(year, month + offset, 1))
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

            <button type="button" onClick={() => setViewMonth(new Date())}>
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
            이달 일정 {visibleTasks.length}개 · 날짜 없음 {undated.length}개
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
            </div>
        </div>

        {visibleTasks.length === 0 && (
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
    const { activeDocuments, updateDocument } = useDocumentStore()

    // 하나의 일정 데이터를 모든 보기에서 함께 사용
    const tasks = activeDocuments.filter((document) => document.isTask)

    // 처음에는 보드 탭만 표시
    const [views, setViews] = useState(['board'])
    const [activeView, setActiveView] = useState('board')
    const [pickerOpen, setPickerOpen] = useState(false)

    function addView(id) {
        setViews((current) =>
        current.includes(id) ? current : [...current, id]
        )

        setActiveView(id)
        setPickerOpen(false)
    }

    return (
        <section className="task-views">
        <div className="task-views-toolbar">
            <nav className="task-views-tabs" aria-label="일정 표시방식">
            {views.map((id) => {
                const view = viewTypes.find((item) => item.id === id)

                return (
                <button
                    key={id}
                    type="button"
                    aria-pressed={activeView === id}
                    onClick={() => setActiveView(id)}
                >
                    {view.label}
                </button>
                )
            })}
            </nav>

            <button
            type="button"
            className="task-views-add"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen(!pickerOpen)}
            >
            ＋ 표시방식 추가
            </button>
        </div>

        {pickerOpen && (
            <div className="task-views-picker">
            <p>추가할 표시방식을 선택하세요.</p>

            {viewTypes
                .filter((view) => !views.includes(view.id))
                .map((view) => (
                <button
                    type="button"
                    key={view.id}
                    onClick={() => addView(view.id)}
                >
                    {view.label}
                </button>
                ))}

            {views.length === viewTypes.length && (
                <p>모든 표시방식을 추가했습니다.</p>
            )}

            <button type="button" onClick={() => setPickerOpen(false)}>
                닫기
            </button>
            </div>
        )}

        <div hidden={activeView !== 'board'}>
            <TaskBoard />
        </div>

        {views.includes('feed') && (
            <div hidden={activeView !== 'feed'}>
            <FeedView tasks={tasks} updateDocument={updateDocument} />
            </div>
        )}

        {views.includes('timeline') && (
            <div hidden={activeView !== 'timeline'}>
            <TimelineView tasks={tasks} updateDocument={updateDocument} />
            </div>
        )}
        </section>
    )
}