import { FilterRuleType, type FilterRuleTypeSchema } from './filterRule';

export type FilterRuleTermJson = {
  value: string;
};

export class FilterRuleTerm {
  public value: string;
  public schema: FilterRuleTypeSchema | undefined;

  constructor({
    value,
    schema,
  }: {
    value: string;
    schema: FilterRuleTypeSchema | undefined;
  }) {
    this.value = value;
    this.schema = schema;
  }

  get isValid() {
    if (typeof this.schema === 'undefined') return undefined;

    if (this.value === '') return this.schema.allowEmpty;

    switch (this.schema.type) {
      case FilterRuleType.String:
        return this.isValidString();
      case FilterRuleType.Integer:
        return this.isValidInteger();
      case FilterRuleType.Float:
        return this.isValidFloat();
      case FilterRuleType.Boolean:
        return this.isValidBoolean();
      case FilterRuleType.Enum:
        return this.isValidEnum();
      case FilterRuleType.Date:
        return this.isValidDate();
      case FilterRuleType.Datetime:
        return this.isValidDateTime();
      case FilterRuleType.Time:
        return this.isValidTime();
      case FilterRuleType.Photo:
        return this.isValidPhoto();
      default:
        throw new Error(
          // @ts-expect-error type can be other than never FilterRuleType is extended
          `Unknown filter rule type: ${this.schema.type}`,
        );
    }
  }

  toJSON(): FilterRuleTermJson {
    return {
      value: this.value,
    };
  }

  static FromJSON(
    json: string | FilterRuleTermJson,
    schema?: FilterRuleTypeSchema,
  ) {
    const data = 'string' === typeof json ? JSON.parse(json) : json;

    return new FilterRuleTerm({
      value: data.value,
      schema,
    });
  }

  private isValidString() {
    if (this.schema?.type !== FilterRuleType.String) return false;
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
      this.schema?.type !== FilterRuleType.Float &&
      this.schema?.type !== FilterRuleType.Integer
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
    if (this.schema?.type !== FilterRuleType.Enum) return false;
    const validation = this.schema.validation;

    return validation.options.includes(this.value);
  }

  private isValidBoolean() {
    return typeof this.value !== 'undefined' && this.value !== '';
  }

  private isValidPhoto() {
    return typeof this.value !== 'undefined' && this.value !== '';
  }
}
