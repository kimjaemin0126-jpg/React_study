import { app } from './app.js'
import { removeIdleWorkspaces } from './store.js'

const PORT = process.env.PORT ?? 4000
const IDLE_LIMIT_MS = 24 * 60 * 60 * 1000

setInterval(() => {
  removeIdleWorkspaces(IDLE_LIMIT_MS)
}, 10 * 60 * 1000).unref()

app.listen(PORT, () => {
  console.log(`API 서버 실행 중: http://localhost:${PORT}`)
})
