import request from 'supertest'
import app from '../src/app.js'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.ts).toBeDefined()
  })
})

describe('GET /unknown-route', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent')
    expect(res.statusCode).toBe(404)
    expect(res.body.error).toBe('Route not found')
  })
})
