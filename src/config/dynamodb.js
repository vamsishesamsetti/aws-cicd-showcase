import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
}

// In development, point to local DynamoDB container
if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT
  clientConfig.credentials = { accessKeyId: 'local', secretAccessKey: 'local' }
}

const raw = new DynamoDBClient(clientConfig)

export const dynamo = DynamoDBDocumentClient.from(raw, {
  marshallOptions: { removeUndefinedValues: true },
})

export const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'cicd-users'
export const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE || 'cicd-tasks'
