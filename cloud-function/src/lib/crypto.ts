import sodium from 'libsodium-wrappers-sumo';
import crypto from 'crypto';
import jose from 'jose';
import { config } from './config';

const JWT_ALG = 'HS256';

export async function hashAndSaltPassword(password: string): Promise<string> {
  await sodium.ready;

  return sodium.crypto_pwhash_str(
    password,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
  );
}

export async function verifyPassword(
  inputPassword: string,
  passwordHash: string,
): Promise<boolean> {
  await sodium.ready;

  return sodium.crypto_pwhash_str_verify(passwordHash, inputPassword);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function timingSafeEqual(a: String, b: String): boolean {
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function hashFileForStorage(file: Buffer): string {
  return crypto.createHash('sha256').update(file).digest('hex');
}

export async function generateJws({
  payload,
  key,
}: {
  payload: {
    aud: string;
    sub: string;
    iat?: never;
    exp: number | Date | string;
  } & Record<string, unknown>;
  key: string;
}) {
  const encSecret = new TextEncoder().encode(key);
  const { aud, sub, exp, ...rest } = payload;
  return await new jose.SignJWT(rest)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(config.CLOUD_FUNCTION_URL)
    .setAudience(aud)
    .setSubject(sub)
    .setExpirationTime(exp)
    .sign(encSecret);
}

export async function verifyJwt({
  jwt,
  key,
  issuer,
}: {
  jwt: string;
  key: string;
  issuer?: string;
}) {
  return await jose.jwtVerify(jwt, new TextEncoder().encode(key), {
    algorithms: [JWT_ALG],
    audience: config.CLOUD_FUNCTION_URL,
    issuer,
  });
}
