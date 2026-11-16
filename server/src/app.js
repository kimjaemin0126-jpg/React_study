import cookieParser from 'cookie-parser'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { healthRouter } from './routes/health.js'
import { invitesRouter } from './routes/invites.js'
import { workspacesRouter } from './routes/workspaces.js'

export const app = express()

// 배포 환경(Railway, Render 등)은 앞에 프록시가 있어서, 실제 접속자 IP를 X-Forwarded-For에서 읽도록 설정
app.set('trust proxy', 1)

app.use(express.json())
app.use(cookieParser())

// 전체 요청 제한: 화면이 5초마다 확인하는 요청을 고려해 넉넉하게 설정
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' },
})

// 악용되기 쉬운 요청(스터디 생성, 초대 수락): 더 엄격하게 제한
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: '너무 많이 시도했어요. 잠시 후 다시 시도해 주세요.' },
})

app.use('/api', generalLimiter)
app.use('/api/health', healthRouter)
app.post('/api/workspaces', strictLimiter)
app.post('/api/invites/:code/accept', strictLimiter)
app.use('/api/workspaces', workspacesRouter)
app.use('/api/invites', invitesRouter)

app.use((req, res) => {
  res.status(404).json({ error: '존재하지 않는 API입니다.' })
})

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: '서버 오류가 발생했습니다.' })
})
