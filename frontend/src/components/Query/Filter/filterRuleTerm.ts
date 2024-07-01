import { type FilterRuleSchema } from './filterRule';
import { ColumnTypes } from 'src/utils/columnTypes';

export type FilterRuleTermJson = {
  value: string;
};

export class FilterRuleTerm {
  public value: string;
  public schema: FilterRuleSchema | undefined;

  constructor({ value }: { value: string }) {
    this.value = value;
  }

  get type() {
    return this.schema?.type;
  }

  get allowEmpty() {
    return this.schema?.allowEmpty;
  }

  get validation() {
    if (typeof this.schema === 'undefined') return undefined;
    switch (this.schema.type) {
      case ColumnTypes.String:
      case ColumnTypes.Integer:
      case ColumnTypes.Float:
      case ColumnTypes.Enum:
        return this.schema.validation;
      case ColumnTypes.Boolean:
      case ColumnTypes.Date:
      case ColumnTypes.DateTime:
      case ColumnTypes.Time:
      case ColumnTypes.Photo:
        return undefined;
      default:
        throw new Error(`Unknown column type: ${this.type}`);
    }
  }

  get isValid() {
    if (typeof this.schema === 'undefined') return undefined;

    if (this.value === '') return this.allowEmpty;

    switch (this.type) {
      case ColumnTypes.String:
        return this.isValidString();
      case ColumnTypes.Integer:
        return this.isValidInteger();
      case ColumnTypes.Float:
        return this.isValidFloat();
      case ColumnTypes.Boolean:
        return this.isValidBoolean();
      case ColumnTypes.Enum:
        return this.isValidEnum();
      case ColumnTypes.Date:
        return this.isValidDate();
      case ColumnTypes.DateTime:
        return this.isValidDateTime();
      case ColumnTypes.Time:
        return this.isValidTime();
      case ColumnTypes.Photo:
        return this.isValidPhoto();
      default:
        throw new Error(`Unknown column type: ${this.type}`);
    }
  }

  toJSON(): FilterRuleTermJson {
    return {
      value: this.value,
    };
  }

  static FromJSON(json: string | FilterRuleTermJson) {
    const data = 'string' === typeof json ? JSON.parse(json) : json;

    return new FilterRuleTerm({
      value: data.value,
    });
  }

  private isValidString() {
    if (this.schema?.type !== ColumnTypes.String) return false;
    const validation = this.schema.validation;

    if (validation.maxLen !== null && this.value.length > validation.maxLen) {
      return false;
    }

    if (validation.pattern !== null) {
      const regex = new RegExp(validation.pattern, 'g');
      return regex.test(this.value);
    }

    return true;
  }

  private isValidInteger() {
    if (parseFloat(this.value) !== parseInt(this.value)) return false;
    return this.isValidFloat();
  }

  private isValidFloat() {
    if (
      this.schema?.type !== ColumnTypes.Float &&
      this.schema?.type !== ColumnTypes.Integer
    )
      return false;
    const validation = this.schema.validation;

    const value = parseFloat(this.value);

    if (isNaN(value)) return false;

    if (value < validation.min) return false;
    if (value > validation.max) return false;

    const remainder = this.modulo(value - validation.min, validation.step);

    if (remainder !== 0) return false;

    return true;
  }

  private modulo(n: number, d: number) {
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

  private isValidDate() {
    return !isNaN(Date.parse(`${this.value}T00:00:00.000Z`));
  }

  private isValidDateTime() {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?/.test(this.value))
      return false;
    return !isNaN(Date.parse(this.value));
  }

  private isValidTime() {
    return !isNaN(Date.parse(`1970-01-01T${this.value}`));
  }

  private isValidEnum() {
    if (this.schema?.type !== ColumnTypes.Enum) return false;
    // as we can also apply string functions (startsWith, contains, etc.) on
    // enums there is not much we can validate
    return true;
  }

  private isValidBoolean() {
    return typeof this.value !== 'undefined' && this.value !== '';
  }

  private isValidPhoto() {
    return typeof this.value !== 'undefined' && this.value !== '';
  }
}
