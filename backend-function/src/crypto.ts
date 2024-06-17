import sodium from 'libsodium-wrappers-sumo';
import crypto from 'crypto';

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
  passwordAndSalt: string,
): Promise<boolean> {
  await sodium.ready;

  return sodium.crypto_pwhash_str_verify(passwordAndSalt, inputPassword);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function timingSafeEqual(a: String, b: String): boolean {
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
