import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { dynamo, USERS_TABLE } from '../config/dynamodb.js'

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user exists
    const existing = await dynamo.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
      Limit: 1,
    }))
    if (existing.Count > 0) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const userId = uuidv4()
    const passwordHash = await bcrypt.hash(password, 12)
    const now = new Date().toISOString()

    await dynamo.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: { userId, email: email.toLowerCase(), name, passwordHash, createdAt: now },
    }))

    const token = jwt.sign({ userId, email: email.toLowerCase(), name }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    })

    res.status(201).json({ token, user: { userId, email: email.toLowerCase(), name } })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const result = await dynamo.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
      Limit: 1,
    }))

    const user = result.Items?.[0]
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({ token, user: { userId: user.userId, email: user.email, name: user.name } })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res) {
  res.json({ user: req.user })
}
