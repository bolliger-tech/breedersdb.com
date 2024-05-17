import { PropertySchemaOptionType } from './filterOptionSchema';
import {
  FilterComparator,
  FilterComparatorOption,
  FilterCriteria,
  FilterOption,
} from './filterTypes';

export class FilterRule {
  column: FilterOption | undefined;
  comparator: FilterComparatorOption | undefined;
  criteria: FilterCriteria | undefined;
  isValid = false;
  private _includeEntitiesWithoutAttributions = false;
  get isAttribute() {
    return this.tableName === 'attribute';
  }
  get dataType() {
    return this.column?.schema.options.type;
  }
  get tableName() {
    return this.column?.value.split('.')[0];
  }
  get columnName() {
    return this.column?.value.split('.')[1];
  }
  get columnValueCanBeEmpty() {
    return this.column?.schema.options.allowEmpty;
  }
  get compareNullAndEmpty() {
    return (
      this.columnValueCanBeEmpty &&
      this.dataType === PropertySchemaOptionType.String &&
      this.comparator?.value &&
      [
        FilterComparator.Equal,
        FilterComparator.NotEqual,
        FilterComparator.Empty,
        FilterComparator.NotEmpty,
      ].includes(this.comparator.value)
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
}
