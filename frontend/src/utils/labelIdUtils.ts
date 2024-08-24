class LabelIdUtils {
  constructor(
    private readonly prefix: string,
    private readonly unprefixedLabelIdLength: number,
  ) {}

  public isPrefixed(labelId: string | null | undefined) {
    return !!(labelId && labelId.startsWith(this.prefix));
  }

  public getPrefix(labelId: string | null | undefined) {
    return this.isPrefixed(labelId) ? this.prefix : null;
  }

  public removePrefix(labelId: string | null | undefined) {
    return this.isPrefixed(labelId)
      ? (labelId ?? '').substring(this.prefix.length)
      : (labelId ?? '');
  }

  public addPrefix(labelId: string | null | undefined) {
    return this.isPrefixed(labelId)
      ? (labelId ?? '')
      : `${this.prefix}${labelId ?? ''}`;
  }

  public isZeroFilled(labelId: string | null | undefined) {
    return (
      (!this.isPrefixed(labelId) &&
        (labelId ?? '').length === this.unprefixedLabelIdLength) ||
      (labelId ?? '').length ===
        this.unprefixedLabelIdLength + this.prefix.length
    );
  }

  public getLeadingZeroes(labelId: string | null | undefined) {
    return this.removePrefix(labelId).match(/^0*/)?.[0] || '';
  }

  public getSignificantDigits(labelId: string | null | undefined) {
    return this.removePrefix(labelId).replace(/^0*/, '');
  }

  public zeroFill(labelId: string | null | undefined) {
    const zeroFilledDigits = this.getSignificantDigits(labelId).padStart(
      this.unprefixedLabelIdLength,
      '0',
    );
    return `${this.getPrefix(labelId) || ''}${zeroFilledDigits}`;
  }

  public isValid(labelId: string | null | undefined) {
    const unprefixed = this.removePrefix(labelId);
    const pattern = new RegExp(`^[0-9]{${this.unprefixedLabelIdLength}}$`);
    return pattern.test(unprefixed) && parseInt(unprefixed, 10) > 0;
  }
}

export const plantLabelIdUtils = new LabelIdUtils('#', 8);
export const plantGroupLabelIdUtils = new LabelIdUtils('G', 8);
