export const prefix = '#';
const unprefixedLabelIdLength = 8;

export function isPrefixed(labelId: string) {
  return labelId.startsWith(prefix);
}

export function getPrefix(labelId: string) {
  return isPrefixed(labelId) ? prefix : null;
}

export function removePrefix(labelId: string) {
  return isPrefixed(labelId) ? labelId.substring(prefix.length) : labelId;
}

export function addPrefix(labelId: string) {
  return isPrefixed(labelId) ? labelId : `${prefix}${labelId}`;
}

export function isZeroFilled(labelId: string) {
  return (
    (!isPrefixed(labelId) && labelId.length === unprefixedLabelIdLength) ||
    labelId.length === unprefixedLabelIdLength + prefix.length
  );
}

export function getLeadingZeroes(labelId: string) {
  return removePrefix(labelId).match(/^0*/)?.[0] || '';
}

export function getSignificantDigits(labelId: string) {
  return removePrefix(labelId).replace(/^0*/, '');
}

export function zeroFill(labelId: string) {
  const zeroFilledDigits = getSignificantDigits(labelId).padStart(
    unprefixedLabelIdLength,
    '0',
  );
  return `${getPrefix(labelId) || ''}${zeroFilledDigits}`;
}

export function isValid(labelId: string) {
  const unprefixed = removePrefix(labelId);
  const pattern = new RegExp(`^[0-9]{${unprefixedLabelIdLength}}$`);
  return pattern.test(unprefixed) && parseInt(unprefixed, 10) > 0;
}
