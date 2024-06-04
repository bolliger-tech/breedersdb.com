import { type FilterRuleSchema } from './filterRule';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';

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
      case ColumnType.String:
      case ColumnType.Integer:
      case ColumnType.Float:
      case ColumnType.Enum:
        return this.schema.validation;
      case ColumnType.Boolean:
      case ColumnType.Date:
      case ColumnType.DateTime:
      case ColumnType.Time:
      case ColumnType.Photo:
        return undefined;
      default:
        throw new Error(`Unknown column type: ${this.type}`);
    }
  }

  get isValid() {
    if (typeof this.schema === 'undefined') return undefined;

    if (this.value === '') return this.allowEmpty;

    switch (this.type) {
      case ColumnType.String:
        return this.isValidString();
      case ColumnType.Integer:
        return this.isValidInteger();
      case ColumnType.Float:
        return this.isValidFloat();
      case ColumnType.Boolean:
        return this.isValidBoolean();
      case ColumnType.Enum:
        return this.isValidEnum();
      case ColumnType.Date:
        return this.isValidDate();
      case ColumnType.DateTime:
        return this.isValidDateTime();
      case ColumnType.Time:
        return this.isValidTime();
      case ColumnType.Photo:
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
    if (this.schema?.type !== ColumnType.String) return false;
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
      this.schema?.type !== ColumnType.Float &&
      this.schema?.type !== ColumnType.Integer
    )
      return false;
    const validation = this.schema.validation;

    const value = parseFloat(this.value);

    if (isNaN(value)) return false;

    if (value < validation.min) return false;
    if (value > validation.max) return false;

    const reminder = (value - validation.min) % validation.step;
    const significantDigits =
      validation.step.toString().split('.')[1]?.length || 0;
    const roundedReminder = Number(reminder.toFixed(significantDigits));

    if (roundedReminder !== 0) return false;

    return true;
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
    if (this.schema?.type !== ColumnType.Enum) return false;
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
