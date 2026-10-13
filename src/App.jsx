import './App.css'

const features = [
  {
    icon: '⚡',
    title: '빠른 학습',
    text: '핵심 개념을 바로 이해하고, 짧은 실습으로 점진적으로 익힐 수 있어요.'
  },
  {
    icon: '🧩',
    title: '실전 구조',
    text: '컴포넌트, 상태 관리, 이벤트 흐름까지 실제 프로젝트처럼 구성해 봅니다.'
  },
  {
    icon: '📘',
    title: '꾸준한 기록',
    text: '배운 내용을 정리하고 복습할 수 있는 흐름을 만들어 학습 효과를 높여줘요.'
  }
]

const stats = [
  { value: '3주', label: '기본 과정' },
  { value: '12개', label: '핵심 실습' },
  { value: '100%', label: 'React 중심' }
]

function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">React Study</div>
        <nav className="nav" aria-label="메인 네비게이션">
          <a href="#overview">Overview</a>
          <a href="#curriculum">Curriculum</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <button type="button" className="primary-button">
          시작하기
        </button>
      </header>

      <section className="hero" id="overview">
        <div className="hero-copy">
          <p className="eyebrow">FRONTEND STUDY</p>
          <h1>React로 생각을 코드로 바꾸는 시간</h1>
          <p className="subtitle">
            기본 문법을 넘어서, 컴포넌트 설계와 사용자 경험을 함께 고민하며
            실제로 쓸 수 있는 인터페이스를 만드는 스터디입니다.
          </p>

          <div className="cta-row">
            <button type="button" className="primary-button">
              무료 실습 시작
            </button>
            <button type="button" className="secondary-button">
              커리큘럼 보기
            </button>
          </div>

          <ul className="check-list">
            <li>React 기초부터 컴포넌트 설계까지</li>
            <li>매주 작은 프로젝트로 실력 쌓기</li>
            <li>피드백 중심의 학습 진행</li>
          </ul>
        </div>

        <div className="hero-panel" aria-label="스터디 요약">
          <div className="panel-card accent">
            <span className="panel-label">이번 주 목표</span>
            <strong>컴포넌트 분리와 상태 흐름 이해</strong>
          </div>

          <div className="mini-grid">
            <div className="mini-card">
              <span>학습률</span>
              <strong>82%</strong>
            </div>
            <div className="mini-card">
              <span>완료 과제</span>
              <strong>7/9</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-section" id="curriculum">
        <div className="section-heading">
          <p className="eyebrow">WHY US</p>
          <h2>작은 실습이 큰 성장으로 이어집니다</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stats-strip" id="reviews">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-item">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>
    </main>
  )
}

export default App
