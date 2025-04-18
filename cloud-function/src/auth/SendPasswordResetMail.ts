import type { ActionProps, ActionResult } from '../types';
import { ErrorWithStatus } from '../lib/errors';
import { config } from '../lib/config';
import { rateLimited } from '../lib/rateLimited';
import { generateJws } from '../lib/crypto';
import { sendEmail } from '../lib/email';
import { validateEmail } from '../lib/validation';
import { getUserByEmail } from '../lib/user';
import type { UserOutput } from './types';

const RATE_LIMITS = [
  {
    // 2 per second
    intervalMs: 1000,
    maxCalls: 2,
  },
  {
    // 5 per minute
    intervalMs: 60 * 1000,
    maxCalls: 5,
  },
  {
    // 20 per day
    intervalMs: 24 * 60 * 60 * 1000,
    maxCalls: 20,
  },
];

const LOGGED_ACTION_NAME = 'password_reset_request';

export async function SendPasswordResetMail({
  input,
  ctx,
}: ActionProps): Promise<ActionResult<UserOutput>> {
  // validate input
  if (!input || !input.email || typeof input.email !== 'string') {
    throw new ErrorWithStatus(400, 'Bad Request: Missing or invalid email');
  }
  const emailAddress = input.email.trim().toLowerCase();
  validateEmail(emailAddress);

  // rate limit
  let mustBeRateLimited = false;
  try {
    mustBeRateLimited = await rateLimited({
      name: LOGGED_ACTION_NAME,
      subject: emailAddress,
      context: null,
      limits: RATE_LIMITS,
    });
  } catch (err) {
    console.error(err);
    throw new ErrorWithStatus(500, 'Internal Server Error');
  }

  if (mustBeRateLimited) {
    throw new ErrorWithStatus(
      429,
      'Too Many Requests: Too many password reset requests',
    );
  }

  // get user
  const user = await getUserByEmail(emailAddress);

  // create reset token
  const tokenPayload = {
    sub: emailAddress,
    aud: config.CLOUD_FUNCTION_URL,
    exp: '15m',
    mod: user.modified,
  };
  const resetToken = await generateJws({
    payload: tokenPayload,
    key: config.PASSWORD_RESET_SECRET,
  });

  // send reset email
  const resetLink = config.PASSWORD_RESET_URL.replace('{jwt}', resetToken);
  try {
    await sendEmail({
      to: emailAddress,
      subject: 'Your Password Reset Request for BreedersDB',
      text: `Hi,\n\nFollow this link to reset your password: ${resetLink}\n\nIf you did not request a password reset, please ignore this email.\n\nHave an excellent day,\nBreedersDB`,
      html: `<p>Hi,</p><p>Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p><p>If you did not request a password reset, please ignore this email.</p><p>Have an excellent day,<br />BreedersDB</p>`,
    });
  } catch (err) {
    console.error('Error sending email:', err);
    throw new ErrorWithStatus(500, 'Internal Server Error');
  }

  return {
    response: { id: user.id },
  };
}
