import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { dynamo, TASKS_TABLE } from '../config/dynamodb.js'

const VALID_STATUSES = ['todo', 'in-progress', 'done']

export async function listTasks(req, res, next) {
  try {
    const { status } = req.query
    const params = {
      TableName: TASKS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': req.user.userId },
      ScanIndexForward: false,
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
      }
      params.FilterExpression = '#s = :status'
      params.ExpressionAttributeNames = { '#s': 'status' }
      params.ExpressionAttributeValues[':status'] = status
    }

    const result = await dynamo.send(new QueryCommand(params))
    res.json({ tasks: result.Items, count: result.Count })
  } catch (err) {
    next(err)
  }
}

export async function createTask(req, res, next) {
  try {
    const { title, description, status = 'todo' } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
    }

    const taskId = uuidv4()
    const now = new Date().toISOString()
    const task = {
      userId: req.user.userId,
      taskId,
      title,
      description: description || '',
      status,
      createdAt: now,
      updatedAt: now,
    }

    await dynamo.send(new PutCommand({ TableName: TASKS_TABLE, Item: task }))
    res.status(201).json({ task })
  } catch (err) {
    next(err)
  }
}

export async function getTask(req, res, next) {
  try {
    const result = await dynamo.send(new GetCommand({
      TableName: TASKS_TABLE,
      Key: { userId: req.user.userId, taskId: req.params.id },
    }))
    if (!result.Item) return res.status(404).json({ error: 'Task not found' })
    res.json({ task: result.Item })
  } catch (err) {
    next(err)
  }
}

export async function updateTask(req, res, next) {
  try {
    const { title, description, status } = req.body
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
    }

    const updates = []
    const names = {}
    const values = { ':uid': req.user.userId, ':tid': req.params.id }

    if (title !== undefined) { updates.push('#t = :title'); names['#t'] = 'title'; values[':title'] = title }
    if (description !== undefined) { updates.push('#d = :desc'); names['#d'] = 'description'; values[':desc'] = description }
    if (status !== undefined) { updates.push('#s = :status'); names['#s'] = 'status'; values[':status'] = status }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

    updates.push('#u = :updatedAt')
    names['#u'] = 'updatedAt'
    values[':updatedAt'] = new Date().toISOString()

    const result = await dynamo.send(new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { userId: req.user.userId, taskId: req.params.id },
      ConditionExpression: 'userId = :uid AND taskId = :tid',
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }))

    res.json({ task: result.Attributes })
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(404).json({ error: 'Task not found' })
    }
    next(err)
  }
}

export async function deleteTask(req, res, next) {
  try {
    await dynamo.send(new DeleteCommand({
      TableName: TASKS_TABLE,
      Key: { userId: req.user.userId, taskId: req.params.id },
      ConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': req.user.userId },
    }))
    res.status(204).send()
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(404).json({ error: 'Task not found' })
    }
    next(err)
  }
}
