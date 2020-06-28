import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AuthUtils from '../../auth/utils'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createNewTodoItem } from '../../businessLogic/todos'
import *  as middy from 'middy'
import { cors } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'


const logger = createLogger('createTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // TODO: Implement creating a new TODO item
  logger.info('caller event ', { event: event})

  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  const token: string = AuthUtils.getTokenFromApiGatewayEvent(event)
  const item = await createNewTodoItem(newTodo, token)

  return {
    statusCode: 201,
    body: JSON.stringify({
        item: item
    })
  }
})

handler.use(
  cors({
      credentials: true
  })
)
