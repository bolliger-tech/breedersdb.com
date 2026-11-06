import { describe, it, expect } from 'vitest';
import { attributionValueHasValue } from './attributionValueHasValue';

describe('attributionValueHasValue', () => {
  it('is false without any value', () => {
    expect(
      attributionValueHasValue({ text_value: null, attachment_value: null }),
    ).toBe(false);
  });

  it.each([
    ['a new file', new File(['x'], 'report.pdf')],
    ['a stored file name', `${'a'.repeat(64)}.pdf`],
  ])('is true with an attachment: %s', (_, attachment_value) => {
    expect(attributionValueHasValue({ attachment_value })).toBe(true);
  });
});
