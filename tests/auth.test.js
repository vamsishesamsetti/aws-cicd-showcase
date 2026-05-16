import request from 'supertest'
import app from '../src/app.js'

// These tests cover input validation — no DynamoDB connection required.
// DynamoDB integration is tested in staging after CD deploys to EC2.

describe('POST /auth/register — validation', () => {
  it('returns 400 when all fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({})
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/required/)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'password123' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/required/)
  })

  it('returns 400 when password is shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '123', name: 'Test' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/6 characters/)
  })
})

describe('POST /auth/login — validation', () => {
  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/required/)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'password123' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/required/)
  })
})

describe('GET /auth/me — authentication', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toMatch(/Authorization/)
  })

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-real-token')
    expect(res.statusCode).toBe(401)
  })
})

describe('Tasks routes — unauthenticated', () => {
  it('GET /tasks returns 401 without token', async () => {
    const res = await request(app).get('/tasks')
    expect(res.statusCode).toBe(401)
  })

  it('POST /tasks returns 401 without token', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Test' })
    expect(res.statusCode).toBe(401)
  })
})
