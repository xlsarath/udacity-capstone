import { decode } from 'jsonwebtoken'

import { JwtPayload } from './JwtPayload'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { createLogger } from '../utils/logger'


const logger = createLogger('utils')

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken: string): string {
  logger.info('parsing userId from jwtToken', {jwtToken:jwtToken})
  const decodedJwt = decode(jwtToken) as JwtPayload
  return decodedJwt.sub
}

export function getTokenFromApiGatewayEvent(event: APIGatewayProxyEvent) {
    logger.info('fetching token from headers')
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]
    return jwtToken
}

export function getUserId(event: APIGatewayProxyEvent) {
  logger.info('parsing userId from GatewayEvent')
  try {
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    return parseUserId(jwtToken)
  } catch (e) {
    logger.error('error ', { message: e })
    return 'unauthorizedUser'
  }
}
