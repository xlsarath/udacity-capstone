import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AuthUtils from '../../auth/utils'
import { deleteTodoItem } from '../../businessLogic/todos'
import *  as middy from 'middy'
import { cors } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'

const logger = createLogger('deleteTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('caller event ', { event: event})
  const todoId = event.pathParameters.todoId
  const token = AuthUtils.getTokenFromApiGatewayEvent(event)

  await deleteTodoItem(todoId, token)

  return {
      statusCode: 204,
      headers: {
          'Access-Control-Allow-Origin': '*'
      },
      body: ''
  }

})

handler.use(
  cors({
      credentials: true
  })
)
