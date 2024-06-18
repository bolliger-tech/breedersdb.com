import { ErrorWithStatus } from './errors';

// 8 characters if: uppercase+lowercase+number+special character
// 12 characters if: uppercase+lowercase+number
// 32 characters otherwise
const PASSWORD_REGEX =
  /(^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$|^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$|^.{32,}$)/;

export function validatePassword(password: string) {
  if (!PASSWORD_REGEX.test(password)) {
    throw new ErrorWithStatus(
      400,
      'Bad Request: Make the password longer or more complex.' +
        ' (8 characters if: uppercase+lowercase+number+special character,' +
        ' 12 characters if: uppercase+lowercase+number, 32 characters otherwise)',
    );
  }
}
