import { describe, it, expect } from 'vitest';
import { attributionValueHasValue } from './attributionValueHasValue';

describe('attributionValueHasValue', () => {
  it('is false without any value', () => {
    expect(
      attributionValueHasValue({ text_value: null, file_value: null }),
    ).toBe(false);
  });

  it.each([
    ['a new file', new File(['x'], 'report.pdf')],
    ['a stored file name', `${'a'.repeat(64)}.pdf`],
  ])('is true with a file: %s', (_, file_value) => {
    expect(attributionValueHasValue({ file_value })).toBe(true);
  });
});
