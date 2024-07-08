// https://owasp.org/www-community/OWASP_Validation_Regex_Repository
export function isValidEmail(val: string): boolean {
  const re =
    /^[a-zA-Z0-9_+&-]+(?:\.[a-zA-Z0-9_+&-]+)*@(?:[a-zA-Z0-9-]+\.)*[a-zA-Z]{2,7}$/;
  return !!val?.length && re.test(val);
}

import { PASSWORD_REGEX } from '../../../cloud-function/src/lib/validation';

export function isValidPassword(val: string): boolean {
  return !!val?.length && PASSWORD_REGEX.test(val);
}
