export function uppercaseFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toSnakeCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function toKebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function toPascalCase(str: string) {
  return uppercaseFirstLetter(
    str.replace(/([-_][a-z])/gi, ($1) => $1.replace(/[-_]/, '').toUpperCase()),
  );
}

export function singularize(word: string) {
  // inspired by https://stackoverflow.com/a/76251896
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('zes')) {
    return word.slice(0, -3);
  }
  if (word.endsWith('shes') || word.endsWith('ches')) {
    return word.slice(0, -4);
  }
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('s')) {
    return word.slice(0, -1);
  }
  return word;
}
