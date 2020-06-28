import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { v4 as uuid } from 'uuid'
import * as Utils from '../lambda/utils'
import { createLogger } from '../utils/logger'
import * as winston from 'winston'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

//Workaround for Document client, see https://github.com/aws/aws-xray-sdk-node/issues/23
const docClient1:DocumentClient = new DocumentClient()
AWSXRay.captureAWSClient(((docClient1) as any).service)

export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = docClient1,
        private readonly s3 = new XAWS.S3({
            signatureVersion: 'v4'
          }),
        private readonly logger: winston.Logger = createLogger('TodoAccess'),
        private readonly todoTable = process.env.TODO_TABLE,
        private readonly todoIdIndex = process.env.TODO_ID_INDEX,
        private readonly bucketName = process.env.TODO_S3_BUCKET,
        private readonly urlExpiration = parseInt (process.env.SIGNED_URL_EXPIRATION, 10)) { 
    }

    async getAllTodoItemsForUser(userId: string): Promise<TodoItem[]> {
        this.logger.info('Getting all todo items')

        const result = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: this.todoIdIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
          }).promise()
        
          let items
          if (result.Count !== 0) {
            items = result.Items.map(item => Utils.createTodoItemDto(item))
          } else {
            items = []
          }

        return items as TodoItem[]
    }

    async createNewTodoItem(newTodo : CreateTodoRequest, userId: string): Promise<TodoItem> {
        this.logger.info(`Creating new todo item ${newTodo} for user ${userId}`)

        const itemId = uuid()
        const newItem = {
          todoId: itemId,
          userId: userId,
          createdAt: new Date().toISOString(),
          attachmentUrl: `https://${this.bucketName}.s3.amazonaws.com/${itemId}`,
          done: false,
          ...newTodo
        }
      
        this.logger.info('new Item ', { newItem: newItem})
      
        await this.docClient.put({
          TableName: this.todoTable,
          Item: newItem
        }).promise()

        return Utils.createTodoItemDto(newItem)
    }

    async deleteTodoItem(todoId : string, userId: string) {
        this.logger.info(`Deleting todo item ${todoId} for user ${userId}`)
        const result = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: this.todoIdIndex,
            KeyConditionExpression: 'todoId = :todoId and userId = :userId',
            ExpressionAttributeValues: {
                ':todoId': todoId,
                ':userId' : userId
            }
          }).promise()
        
        if (result.Count !== 0) {
            const item = result.Items[0]
        
            await this.docClient.delete({
                TableName: this.todoTable,
                Key: {
                userId: item.userId,
                createdAt: item.createdAt
                }
            }).promise()
    
        }
    }

    async updateTodoItem(updatedTodo : UpdateTodoRequest, todoId: string, userId: string): Promise<TodoItem> {
        this.logger.info(`Updating todo item with ${updatedTodo} for user ${userId}`)
        const result = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: this.todoIdIndex,
            KeyConditionExpression: 'todoId = :todoId and userId = :userId',
            ExpressionAttributeValues: {
                ':todoId': todoId,
                ':userId' : userId
            }
          }).promise()
        

        if (result.Count !== 0) {
            const item = result.Items[0]
            const updatedItem = {
                ...item,
                ...updatedTodo
            }
         
            await this.docClient.put({
                TableName: this.todoTable,
                Item: updatedItem
            }).promise()

            return Utils.createTodoItemDto(updatedItem)
        } else {
            return null
        }
    }

    async generateUploadUrl(todoId : string): Promise<string> {
        this.logger.info(`Generating uploadUrl for todo item ${todoId}`)
        return this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: this.urlExpiration
          })
    }

}