import { FilterRuleType, type FilterRuleTypeSchema } from './filterRule';

export class FilterRuleOperator {
  public readonly label: string;
  public readonly value: FilterOperatorValue;
  public readonly suitableRuleTypes: FilterRuleType[];
  public readonly schema: FilterRuleTypeSchema | undefined;

  constructor({
    label,
    value,
    suitableRuleTypes,
    schema,
  }: {
    label: string;
    value: FilterOperatorValue;
    suitableRuleTypes: FilterRuleType[];
    schema?: FilterRuleTypeSchema;
  }) {
    this.label = label;
    this.value = value;
    this.suitableRuleTypes = suitableRuleTypes;
    this.schema = schema;
  }

  get isValid() {
    if (typeof this.schema === 'undefined') return undefined;
    return this.suitableRuleTypes.includes(this.schema.type);
  }
}

export enum FilterOperatorValue {
  Equal = '===',
  NotEqual = '!==',
  Less = '<',
  LessOrEqual = '<=',
  Greater = '>',
  GreaterOrEqual = '>=',
  StartsWith = 'startsWith',
  StartsNotWith = 'startsNotWith',
  Contains = 'contains',
  NotContains = 'notContains',
  EndsWith = 'endsWith',
  NotEndsWith = 'notEndsWith',
  Empty = 'empty',
  NotEmpty = 'notEmpty',
  True = 'true',
  False = 'false',
}
