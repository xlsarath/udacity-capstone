import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { JwtToken } from '../../auth/JwtToken'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = process.env.JSON_WEBKEY_SET_ENDPOINT

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', { authorizationToken: event.authorizationToken})
  try {


    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', {jwtToken : jwtToken})

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message, line: e.lineNumber })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}


async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  logger.info('token ', {token: token})
  //const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  const certificate = await getCertificate(token)

  const decodedToken = verify(token, certificate, { algorithms: ['RS256'] } ) as JwtToken
  logger.info('User was authorized')

  return decodedToken
}

async function getCertificate(token: string) {

  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const kid = jwt.header.kid 
  logger.info('Kid of token', {kid: kid})
  logger.info('Fetching jwks data from ', { url: jwksUrl})
  const certificateKeys = (await Axios.get(jwksUrl)).data.keys
  logger.info('Got jwks data ', {jwksdata: certificateKeys})
  for(var i = 0;i<certificateKeys.length;i++) { 
    if (certificateKeys[i].kid  === kid) {
        logger.info('Found kid in cert', {certificate: certificateKeys[i]})
        const x5c = certificateKeys[i].x5c[0]
        return `-----BEGIN CERTIFICATE-----\n${x5c}\n-----END CERTIFICATE-----`
    }
 }
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
