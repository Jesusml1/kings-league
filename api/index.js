import { Hono } from 'hono'
import leaderboard from '../db/leaderboard.json'

const app = new Hono()

app.get('/', c => {
  return c.json([
    {
      endpoint: '/leaderboard',
      description: 'Return the leaderboard'
    }
  ])
})

app.get('/leaderboard', c => {
  return c.json(leaderboard)
})

export default app
