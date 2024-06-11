export function uppercaseFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toSnakeCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function toPascalCase(str: string) {
  return uppercaseFirstLetter(
    str.replace(/([-_][a-z])/gi, ($1) => $1.replace(/[-_]/, '').toUpperCase()),
  );
}
