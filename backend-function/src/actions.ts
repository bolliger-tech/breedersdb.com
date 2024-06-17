import * as ff from '@google-cloud/functions-framework';
import { timingSafeEqual } from './crypto';
import { ErrorWithStatus } from './errors';
import { config } from './config';
import { InsertUserAction } from './actions/InsertUser';
import { SignIn } from './actions/SignIn';
import type { ActionProps } from './actions/types';
import { SignOut } from './actions/SignOut';

/* example request
body: {
  action: { name: 'InsertUser' },
  input: { email: 'tester@breedersdb.com', password: 'asdfasdf' },
  request_query: 'mutation InsertUser {\n' +
    '\n' +
    '  InsertUser(email: "tester@breedersdb.com", password: "asdfasdf") {email}\n' +
    '}\n',
  session_variables: { 'x-hasura-role': 'admin' }
}
*/

// hasura only allows 2xx or 4xx status codes
export async function handleActions(req: ff.Request, res: ff.Response) {
  try {
    // only access from hasura is allowed
    if (
      typeof req.headers['x-actions-secret'] !== 'string' ||
      !timingSafeEqual(req.headers['x-actions-secret'], config.ACTIONS_SECRET)
    ) {
      throw new ErrorWithStatus(401, 'Unauthorized');
    }

    const body = req.body;
    if (!body) {
      throw new ErrorWithStatus(400, 'Bad Request');
    }

    const props: ActionProps = {
      input: body.input,
      ctx: {
        req: { headers: { cookie: req.headers.cookie } },
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
      default:
        console.log(body);
        throw new ErrorWithStatus(404, 'Not Found');
    }
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value);
      }
    }
    console.log(result);
    return res.send(result.response);
  } catch (err) {
    if (err instanceof ErrorWithStatus) {
      res.status(err.status).send(err.toGraphQL());
    } else {
      console.error('Unknown error in handleActions:', err);
      const error = new ErrorWithStatus(400, 'Internal Server Error');
      res.status(error.status).send(error.toGraphQL());
    }
  }
}
