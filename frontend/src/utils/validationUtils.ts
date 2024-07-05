// https://owasp.org/www-community/OWASP_Validation_Regex_Repository
export function isValidEmail(val: string): boolean {
  const re =
    /^[a-zA-Z0-9_+&-]+(?:\.[a-zA-Z0-9_+&-]+)*@(?:[a-zA-Z0-9-]+\.)*[a-zA-Z]{2,7}$/;
  return re.test(val);
}
