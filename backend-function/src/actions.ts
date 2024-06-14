import * as ff from '@google-cloud/functions-framework';
import { hashAndSaltPassword } from './crypto';
import { InsertUserMutation } from './queries';
import { WrappedError } from './errors';
import { config } from './config';

/*
Action: {
  action: { name: 'InsertUser' },
  input: { email: 'asdf@asdf.com', password: 'asdf' },
  request_query: 'mutation InsertUser {\n' +
    '\n' +
    '  InsertUser(email: "asdf@asdf.com", password: "asdf") {email}\n' +
    '}\n',
  session_variables: { 'x-hasura-role': 'admin' }
}
*/
async function InsertUserAction(body: any) {
  const input = body.input;
  if (!input || !input.email || !input.password) {
    throw new WrappedError(400, 'Bad Request');
  }

  const passwordHash = await hashAndSaltPassword(input.password);

  const data = await fetch(config.HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'x-hasura-admin-secret': config.HASURA_GRAPHQL_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: InsertUserMutation,
      variables: {
        email: input.email,
        password_hash: passwordHash,
      },
    }),
  }).then((res) => res.json());

  // TODO: cleanup error handling
  if (data.errors) {
    console.error(data.errors);
    const firstError = data.errors[0];
    throw new WrappedError(500, firstError.message);
  }

  return data.data.insert_users_one;
}

// TODO: error must be json
export async function handleActions(req: ff.Request, res: ff.Response) {
  if (req.headers['actions_secret'] !== config.ACTIONS_SECRET) {
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
        return res.status(400).send('Bad Request');
    }
  } catch (err) {
    if (err instanceof WrappedError) {
      // TODO: error must be json
      res.status(err.status).send(err.message);
    } else {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  }
}
