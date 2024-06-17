import * as ff from '@google-cloud/functions-framework';
import { hashAndSaltPassword, timingSafeEqual } from './crypto';
import { InsertUserMutation } from './queries';
import { ErrorWithStatus } from './errors';
import { config } from './config';
import { fetchGraphQL } from './fetch';

/*
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
async function InsertUserAction(body: any) {
  const input = body.input;
  if (!input || !input.email || !input.password) {
    throw new ErrorWithStatus(400, 'Bad Request');
  }

  const passwordHash = await hashAndSaltPassword(input.password);

  // save user to db
  const data = await fetchGraphQL({
    query: InsertUserMutation,
    variables: {
      user_object: {
        email: input.email,
        password_hash: passwordHash,
        ...(input.locale && { locale: input.locale }),
      },
    },
  });
  if (data.errors) {
    const firstError = data.errors[0];
    throw new ErrorWithStatus(400, firstError.message);
  }

  return data.data.insert_users_one;
}

// hasura only allows 2xx or 4xx status codes
export async function handleActions(req: ff.Request, res: ff.Response) {
  try {
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

    switch (body.action.name) {
      case 'InsertUser':
        return res.send(await InsertUserAction(body));
      default:
        throw new ErrorWithStatus(404, 'Not Found');
    }
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
