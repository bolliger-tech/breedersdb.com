import type { FilterColumn } from './filterColumn';
import { FilterOperatorValue, type FilterOperator } from './filterOperator';
import { FilterRuleType } from './filterRuleTypes';
import type { FilterTerm } from './filterTerm';

export class FilterRule {
  column: FilterColumn | undefined;
  operator: FilterOperator | undefined;
  term: FilterTerm | undefined;
  private _includeEntitiesWithoutAttributions = false;

  get isAttribute() {
    return this.column?.isAttribute;
  }
  get type() {
    return this.column?.type;
  }
  get tableName() {
    return this.column?.table;
  }
  get columnName() {
    return this.column?.tableColumn;
  }
  get canBeNullOrEmpty() {
    return (
      this.column?.termCanBeEmpty &&
      this.type === FilterRuleType.String &&
      this.operator?.value &&
      [
        FilterOperatorValue.Equal,
        FilterOperatorValue.NotEqual,
        FilterOperatorValue.Empty,
        FilterOperatorValue.NotEmpty,
      ].includes(this.operator.value)
    );
  }
  get includeEntitiesWithoutAttributions() {
    if (!this.isAttribute) return false;
    return this._includeEntitiesWithoutAttributions;
  }
  set includeEntitiesWithoutAttributions(value: boolean) {
    if (!this.isAttribute)
      throw new Error('Only attributions can have this property');
    this._includeEntitiesWithoutAttributions = value;
  }
  get requiresTerm() {
    switch (this.type) {
      case FilterRuleType.Date:
      case FilterRuleType.Datetime:
      case FilterRuleType.Integer:
      case FilterRuleType.Float:
      case FilterRuleType.Enum:
        return true;
      case FilterRuleType.String:
        return (
          this.operator?.value !== FilterOperatorValue.Empty &&
          this.operator?.value !== FilterOperatorValue.NotEmpty
        );
      default:
        return false;
    }
  }
  get isValid() {
    if (!this.column || !this.operator) return undefined;
    if (this.requiresTerm && this.term === undefined) return undefined;

    return (
      this.column.isValid &&
      this.operator.isValid &&
      ((this.requiresTerm && this.term?.isValid) || !this.requiresTerm)
    );
  }
}
