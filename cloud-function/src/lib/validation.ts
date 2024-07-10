import { ErrorWithStatus } from './errors';

// ⚠️ EMAIL_REGEX is also used in frontend/src/utils/validationUtils.ts
// https://owasp.org/www-community/OWASP_Validation_Regex_Repository
const EMAIL_REGEX =
  /^[a-zA-Z0-9_+&-]+(?:\.[a-zA-Z0-9_+&-]+)*@(?:[a-zA-Z0-9-]+\.)*[a-zA-Z]{2,7}$/;

// ⚠️ PASSWORD_REGEX is also used in frontend/src/utils/validationUtils.ts
// 8 characters if: uppercase+lowercase+number+special character
// 12 characters if: uppercase+lowercase+number
// 32 characters otherwise
const PASSWORD_REGEX =
  /(^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$|^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$|^.{32,}$)/;

export const validateEmail = (email: string) => {
  if (!EMAIL_REGEX.test(email)) {
    throw new ErrorWithStatus(400, 'Bad Request: Enter a valid email address.');
  }
};

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
