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

export function isValidString({
  value,
  validation,
}: {
  value: string;
  validation: { maxLen: number | null; pattern: string | null };
}) {
  if (validation.maxLen !== null && value.length > validation.maxLen) {
    return false;
  }

  if (validation.pattern !== null) {
    const regex = new RegExp(validation.pattern, 'g');
    return regex.test(value);
  }

  return true;
}

export function isValidInteger({
  value,
  validation,
}: {
  value: number | string;
  validation: { min: number; max: number; step: number };
}) {
  if (parseFloat(value.toString()) !== parseInt(value.toString())) return false;
  return validateNumber({ value: parseInt(value.toString()), validation });
}

export function isValidFloat({
  value,
  validation,
}: {
  value: number | string;
  validation: { min: number; max: number; step: number };
}) {
  return validateNumber({ value: parseFloat(value.toString()), validation });
}

function validateNumber({
  value,
  validation,
}: {
  value: number;
  validation: { min: number; max: number; step: number };
}) {
  if (isNaN(value)) return false;

  if (value < validation.min) return false;
  if (value > validation.max) return false;

  const remainder = modulo(value - validation.min, validation.step);

  if (remainder !== 0) return false;

  return true;
}

function modulo(n: number, d: number) {
  const nPrecision = n.toString().split('.')[1]?.length || 0;
  const dPrecision = d.toString().split('.')[1]?.length || 0;
  const precision = Math.max(nPrecision, dPrecision);
  const power = Math.pow(10, precision);

  // make integers out of the floats
  // beacuse float operations may lead to wrong results
  // (e.g. 0.5 % 0.1 = 0.09999999999999998)
  const nInt = n * power;
  const dInt = d * power;

  // get the modulo instead of the remainder.
  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
  return ((nInt % dInt) + dInt) % dInt;
}

export function isValidDate({ value }: { value: string }) {
  return !isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

export function isValidDateTime({ value }: { value: string }) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?/.test(value))
    return false;
  return !isNaN(Date.parse(value));
}

export function isValidTime({ value }: { value: string }) {
  return !isNaN(Date.parse(`1970-01-01T${value}`));
}
