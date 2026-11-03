import cookieParser from 'cookie-parser'
import express from 'express'
import { healthRouter } from './routes/health.js'
import { invitesRouter } from './routes/invites.js'
import { workspacesRouter } from './routes/workspaces.js'

export const app = express()

app.use(express.json())
app.use(cookieParser())

app.use('/api/health', healthRouter)
app.use('/api/workspaces', workspacesRouter)
app.use('/api/invites', invitesRouter)

app.use((req, res) => {
  res.status(404).json({ error: '존재하지 않는 API입니다.' })
})

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: '서버 오류가 발생했습니다.' })
})
