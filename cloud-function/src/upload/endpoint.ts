import * as ff from '@google-cloud/functions-framework';
import { authenticateRequest } from '..';
import { hashFile } from '../lib/crypto';

export async function handleUpload(req: ff.Request, res: ff.Response) {
  if (['POST', 'OPTIONS'].includes(req.method) === false) {
    return res.status(405).send('Method Not Allowed');
  }
  // TODO url
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', [
    'Content-Type',
    'X-File-Name',
  ]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // TODO should OPTION requests be authenticated? makes for a bad error message
  // (unknown) in xhr requests but otherwise it seems the server first has to
  // receive the payload before it can respond with a 401
  if (req.method === 'OPTIONS') {
    return res.send();
  }

  const auth = await authenticateRequest(req.headers.cookie);
  if (!auth) {
    return res.status(401).send('Unauthorized');
  }

  const file = req.body;
  console.log('received:', file);

  const fileName = hashFile(file);
  const url = `http://todo/${fileName}`;
  return res.send({ fileName, url });
}
