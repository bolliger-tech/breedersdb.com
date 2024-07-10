// ⚠️ EMAIL_REGEX is also used in cloud-function/src/lib/validation.ts
// https://owasp.org/www-community/OWASP_Validation_Regex_Repository
const EMAIL_REGEX =
  /^[a-zA-Z0-9_+&-]+(?:\.[a-zA-Z0-9_+&-]+)*@(?:[a-zA-Z0-9-]+\.)*[a-zA-Z]{2,7}$/;

// ⚠️ PASSWORD_REGEX is also used in cloud-function/src/lib/validation.ts
// 8 characters if: uppercase+lowercase+number+special character
// 12 characters if: uppercase+lowercase+number
// 32 characters otherwise
const PASSWORD_REGEX =
  /(^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$|^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$|^.{32,}$)/;

export function isValidEmail(val: string): boolean {
  return !!val?.length && EMAIL_REGEX.test(val);
}

export function isValidPassword(val: string): boolean {
  return !!val?.length && PASSWORD_REGEX.test(val);
}
