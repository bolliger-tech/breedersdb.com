import * as ff from '@google-cloud/functions-framework';
import { ErrorWithStatus } from './lib/errors';
import { config } from './lib/config';
import type { ActionProps } from './types';
import { InsertUserAction } from './auth/InsertUser';
import { SignIn } from './auth/SignIn';
import { SignOut } from './auth/SignOut';
import { Me } from './auth/Me';
import { ChangePassword } from './auth/ChangePassword';
import { validateBackendAuth } from './auth/validateBackendAuth';
import { SendPasswordResetMail } from './auth/SendPasswordResetMail';
import { ResetPassword } from './auth/ResetPassword';
import { CreatePersonalAccessToken } from './auth/CreatePersonalAccessToken';

/* example request
body: {
  action: { name: 'InsertUser' },
  input: { object: { email: 'tester@breedersdb.com', password: 'Asdfasdf.1' } },
  request_query: 'mutation InsertUser {\n' +
    '\n' +
    '  InsertUser(email: "tester@breedersdb.com", password: "Asdfasdf.1") {email}\n' +
    '}\n',
  session_variables: { 'x-hasura-role': 'admin' }
}
*/

// hasura only allows 2xx or 4xx status codes
export async function handleActions(req: ff.Request, res: ff.Response) {
  try {
    // only access from hasura is allowed
    if (!validateBackendAuth(req)) {
      throw new ErrorWithStatus(401, 'Unauthorized');
    }

    const body = req.body;
    if (!body) {
      throw new ErrorWithStatus(400, 'Bad Request');
    }

    const props: ActionProps = {
      input: body.input,
      ctx: {
        req: {
          headers: {
            cookie: req.headers.cookie,
            authorization: req.headers.authorization,
          },
        },
        sessionVariables: body.session_variables,
      },
    };

    let result;
    switch (body.action.name) {
      case 'InsertUser':
        result = await InsertUserAction(props);
        break;
      case 'SignIn':
        result = await SignIn(props);
        break;
      case 'SignOut':
        result = await SignOut(props);
        break;
      case 'Me':
        result = await Me(props);
        break;
      case 'ChangePassword':
        result = await ChangePassword(props);
        break;
      case 'SendPasswordResetMail':
        result = await SendPasswordResetMail(props);
        break;
      case 'ResetPassword':
        result = await ResetPassword(props);
        break;
      case 'CreatePersonalAccessToken':
        result = await CreatePersonalAccessToken(props);
        break;
      default:
        console.error('unknown action:', body);
        throw new ErrorWithStatus(404, 'Not Found');
    }
    if (config.LOG_REQUESTS) {
      console.log('action result:', result);
      console.log('------------------------');
    }
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value);
      }
    }
    return res.send(result.response);
  } catch (err) {
    if (err instanceof ErrorWithStatus) {
      let status = err.status;
      // hasura expects 2xx or 4xx status codes
      if (status < 200 || (status >= 300 && status < 400) || status >= 500) {
        console.error(err);
        status = 400;
      }
      res.status(status).send(err.toGraphQL());
    } else {
      console.error('Unknown error in handleActions:', err);
      const error = new ErrorWithStatus(400, 'Internal Server Error');
      res.status(error.status).send(error.toGraphQL());
    }
  }
}
