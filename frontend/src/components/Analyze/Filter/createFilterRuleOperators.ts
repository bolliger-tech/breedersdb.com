import { FilterOperatorValue, FilterRuleOperator } from './filterRuleOperator';
import type { ColumnTypes } from 'src/utils/columnTypes';

export function createGetFilterRuleOperators() {
  const all = getAllFilterRuleOperators();

  return (type: ColumnTypes, allowEmpty: boolean) => {
    return all
      .filter((operator) => {
        return operator.suitableRuleTypes.includes(type);
      })
      .filter((operator) => {
        return (
          allowEmpty ||
          (operator.value !== FilterOperatorValue.Empty &&
            operator.value !== FilterOperatorValue.NotEmpty)
        );
      });
  };
}

function getAllFilterRuleOperators() {
  return [
    new FilterRuleOperator({ value: FilterOperatorValue.Equal }),
    new FilterRuleOperator({ value: FilterOperatorValue.NotEqual }),
    new FilterRuleOperator({ value: FilterOperatorValue.Less }),
    new FilterRuleOperator({ value: FilterOperatorValue.LessOrEqual }),
    new FilterRuleOperator({ value: FilterOperatorValue.Greater }),
    new FilterRuleOperator({ value: FilterOperatorValue.GreaterOrEqual }),
    new FilterRuleOperator({ value: FilterOperatorValue.StartsWith }),
    new FilterRuleOperator({ value: FilterOperatorValue.StartsNotWith }),
    new FilterRuleOperator({ value: FilterOperatorValue.Contains }),
    new FilterRuleOperator({ value: FilterOperatorValue.NotContains }),
    new FilterRuleOperator({ value: FilterOperatorValue.EndsWith }),
    new FilterRuleOperator({ value: FilterOperatorValue.NotEndsWith }),
    new FilterRuleOperator({ value: FilterOperatorValue.Empty }),
    new FilterRuleOperator({ value: FilterOperatorValue.NotEmpty }),
    new FilterRuleOperator({ value: FilterOperatorValue.True }),
    new FilterRuleOperator({ value: FilterOperatorValue.False }),
  ];
}
