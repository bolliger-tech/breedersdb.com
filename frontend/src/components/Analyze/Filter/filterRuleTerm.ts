import { type FilterRuleSchema } from './filterRule';
import { ColumnTypes } from 'src/utils/columnTypes';
import * as validationUtils from 'src/utils/validationUtils';

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
      case ColumnTypes.Rating:
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
      case ColumnTypes.Rating:
        return this.isValidRating();
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
    return validationUtils.isValidString({
      value: this.value,
      validation: this.schema.validation,
    });
  }

  private isValidRating() {
    if (this.schema?.type !== ColumnTypes.Rating) return false;
    return validationUtils.isValidInteger({
      value: this.value,
      validation: this.schema.validation,
    });
  }

  private isValidInteger() {
    if (this.schema?.type !== ColumnTypes.Integer) return false;
    return validationUtils.isValidInteger({
      value: this.value,
      validation: this.schema.validation,
    });
  }

  private isValidFloat() {
    if (this.schema?.type !== ColumnTypes.Float) return false;
    return validationUtils.isValidFloat({
      value: this.value,
      validation: this.schema.validation,
    });
  }

  private isValidDate() {
    return validationUtils.isValidDate({ value: this.value });
  }

  private isValidDateTime() {
    return validationUtils.isValidDateTime({ value: this.value });
  }

  private isValidTime() {
    return validationUtils.isValidTime({ value: this.value });
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
