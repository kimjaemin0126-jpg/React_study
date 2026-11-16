import { Link, useOutletContext } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { useDocumentStore } from '../hooks/useDocumentStore'
import {
  collectCalendarEntries,
  entriesOnDate,
  formatDateLabel,
  getTodayKey,
} from '../calendar/calendarUtils'
import {
  formatRelativeDate,
  getDocumentTitle,
} from '../utils/documentUtils'
import './HomePage.css'

export default function HomePage() {
  const { activeDocuments } = useDocumentStore()
  const { openNewPage, calendar } = useOutletContext()

  const today = getTodayKey()

  // 문서 일정과 보드 기간을 함께 확인
  const todayEntries = entriesOnDate(
    collectCalendarEntries(activeDocuments),
    today
  )

  const visibleSchedules = todayEntries.slice(0, 3)

  // 홈에서는 일정 문서를 제외한 일반 문서만 최대 5개
  const recentDocuments = activeDocuments
    .filter((document) => !document.isTask)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)

  return (
    <div className="home-dashboard">
      <header className="home-dashboard-header">
        <div>
          <p className="home-dashboard-date">
            {formatDateLabel(today)}
          </p>

          <h1>홈</h1>

          <p className="home-dashboard-description">
            오늘 일정을 확인하고 최근 작업을 이어가세요.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={openNewPage}
        >
          <Plus size={16} />
          새 문서
        </button>
      </header>

      <section className="home-section" aria-labelledby="home-today-title">
        <div className="home-section-heading">
          <h2 id="home-today-title">
            오늘 일정
            <span>{todayEntries.length}</span>
          </h2>

          <Link
            to="/tasks"
            className="home-section-action"
            onClick={() => calendar.selectDate(today)}
          >
            전체 일정 보기 →
          </Link>
        </div>

        {visibleSchedules.length === 0 ? (
          <p className="home-empty">
            오늘 등록된 일정이 없습니다.
            왼쪽 ‘일정’ 메뉴에서 작업을 추가할 수 있어요.
          </p>
        ) : (
          <ul className="home-list">
            {visibleSchedules.map((entry) => (
              <li key={entry.id}>
                <Link
                  className="home-schedule-row"
                  to={`/documents/${entry.documentId}`}
                  onClick={() => calendar.open(today)}
                >
                  <span className="home-schedule-time">
                    {entry.kind === 'period'
                      ? '진행 기간'
                      : entry.time || '종일'}
                  </span>

                  <span className="home-row-main">
                    <strong>{entry.title}</strong>
                    <small>{entry.documentTitle}</small>
                  </span>

                  <span className="home-row-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {todayEntries.length > 3 && (
          <p className="home-more-note">
            일정 {todayEntries.length - 3}개가 더 있습니다.
            ‘전체 일정 보기’에서 확인하세요.
          </p>
        )}
      </section>

      <section
        className="home-section"
        aria-labelledby="home-recent-title"
      >
        <div className="home-section-heading">
          <h2 id="home-recent-title">최근 수정한 문서</h2>

          <Link className="home-section-action" to="/documents">
            모든 문서 보기 →
          </Link>
        </div>

        {recentDocuments.length === 0 ? (
          <p className="home-empty">
            아직 작성한 문서가 없습니다.
            위의 ‘새 문서’ 버튼으로 시작해 보세요.
          </p>
        ) : (
          <ul className="home-list">
            {recentDocuments.map((document) => (
              <li key={document.id}>
                <Link
                  className="home-document-row"
                  to={`/documents/${document.id}`}
                >
                  <FileText
                    size={17}
                    className="home-document-icon"
                    aria-hidden="true"
                  />

                  <strong className="home-document-title">
                    {getDocumentTitle(document)}
                  </strong>

                  <span className="home-document-date">
                    {formatRelativeDate(document.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
