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
  // TODO: cleanup error handling
  if (data.errors) {
    console.error(data.errors);
    const firstError = data.errors[0];
    throw new ErrorWithStatus(500, firstError.message);
  }

  return data.data.insert_users_one;
}

// TODO: error must be json
export async function handleActions(req: ff.Request, res: ff.Response) {
  if (
    typeof req.headers['x-actions-secret'] !== 'string' ||
    !timingSafeEqual(req.headers['x-actions-secret'], config.ACTIONS_SECRET)
  ) {
    return res.status(401).send('Unauthorized');
  }

  const body = req.body;
  if (!body) {
    return res.status(400).send('Bad Request');
  }

  try {
    switch (body.action.name) {
      case 'InsertUser':
        return res.send(await InsertUserAction(body));
      default:
        throw new ErrorWithStatus(400, 'Bad Request');
    }
  } catch (err) {
    // TODO: error must be json
    if (err instanceof ErrorWithStatus) {
      res.status(err.status).send(err.message);
    } else {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  }
}
