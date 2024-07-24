import { describe, expect, it } from 'vitest';
import { filterToQuery } from './filterToQuery';
import { BaseTable, FilterConjunction, FilterNode } from '../Filter/filterNode';
import { FilterRule } from '../Filter/filterRule';
import { FilterRuleColumn } from '../Filter/filterRuleColumn';
import { ColumnTypes } from 'src/utils/columnTypes';
import {
  FilterOperatorValue,
  FilterRuleOperator,
} from '../Filter/filterRuleOperator';
import { FilterRuleTerm } from '../Filter/filterRuleTerm';

function prepareForRegex(str: string) {
  return (
    str
      // escape all special characters
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // add whitespace flexibility
      .replace(/\s+/g, ' ')
      .replace(/ /g, '\\s+')
      .trim()
  );
}

const basicPagination = {
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 100,
};

const filterRootArgs = {
  childrensConjunction: FilterConjunction.And,
  baseTable: BaseTable.Cultivars,
};

const emptyAttributionFilter = FilterNode.FilterRoot({
  childrensConjunction: FilterConjunction.And,
  baseTable: BaseTable.Attributions,
});

const filterRules = {
  id: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'cultivars',
      tableColumnName: 'id',
      tableLabel: 'Cultivars',
      tableColumnLabel: 'ID',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.Integer,
        validation: {
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          step: 1,
        },
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.Greater,
    }),
    term: new FilterRuleTerm({ value: '10' }),
  }),

  name: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'cultivars',
      tableColumnName: 'name',
      tableLabel: 'Cultivars',
      tableColumnLabel: 'Name',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.String,
        validation: {
          maxLen: 255,
          pattern: null,
        },
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.Contains,
    }),
    term: new FilterRuleTerm({ value: 'ab' }),
  }),

  created: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'cultivars',
      tableColumnName: 'created',
      tableLabel: 'Cultivars',
      tableColumnLabel: 'Created',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.Date,
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.NotEqual,
    }),
    term: new FilterRuleTerm({ value: '2021-01-01' }),
  }),

  nestedBoolean: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'cultivars.lots',
      tableColumnName: 'boolean',
      tableLabel: 'Cultivars',
      tableColumnLabel: 'Boolean',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.Boolean,
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.False,
    }),
    term: undefined,
  }),

  nestedStringAllowEmpty: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'cultivars.lots',
      tableColumnName: 'string_allow_empty',
      tableLabel: 'Cultivars',
      tableColumnLabel: 'String Allow Empty',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: 255,
          pattern: null,
        },
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.Empty,
    }),
  }),

  nestedIntegerAllowEmpty: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'cultivars.lots',
      tableColumnName: 'integer_allow_empty',
      tableLabel: 'Cultivars',
      tableColumnLabel: 'Integer Allow Empty',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Integer,
        validation: {
          min: 0,
          max: 255,
          step: 1,
        },
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.Empty,
    }),
  }),

  nestedRatingAllowEmpty: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'cultivars.lots',
      tableColumnName: 'rating_allow_empty',
      tableLabel: 'Cultivars',
      tableColumnLabel: 'Rating Allow Empty',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Rating,
        validation: {
          min: 0,
          max: 9,
          step: 1,
        },
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.Empty,
    }),
  }),

  nestedStringWithValue: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'cultivars.lots',
      tableColumnName: 'string',
      tableLabel: 'Cultivars',
      tableColumnLabel: 'String',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.String,
        validation: {
          maxLen: 255,
          pattern: null,
        },
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.NotEmpty,
    }),
  }),

  attribute: new FilterRule({
    column: new FilterRuleColumn({
      tableName: 'attributes',
      tableColumnName: '123',
      tableLabel: 'Attributions',
      tableColumnLabel: 'Scab',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.Integer,
        validation: {
          min: 0,
          max: 9,
          step: 1,
        },
      },
    }),
    operator: new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    }),
    term: new FilterRuleTerm({ value: '1' }),
    includeEntitiesWithoutAttributions: false,
  }),
};

describe('filterToQuery', () => {
  describe('where', () => {
    describe('conjunction', () => {
      it('should return: _and', () => {
        const filter = FilterNode.FilterRoot({
          childrensConjunction: FilterConjunction.And,
          baseTable: BaseTable.Cultivars,
        });
        FilterNode.FilterLeaf({
          parent: filter,
          filterRule: filterRules.id,
        });
        FilterNode.FilterLeaf({
          parent: filter,
          filterRule: filterRules.name,
        });

        const { query } = filterToQuery({
          baseFilter: filter,
          attributionFilter: emptyAttributionFilter,
          columns: [],
          pagination: basicPagination,
        });

        expect(query).toMatch(
          new RegExp(
            prepareForRegex(`
cultivars(where: { _and: [
  { id: { _gt: $v000 } },
  { name: { _ilike: $v000 } }
] }`).replaceAll('$v000', '$v\\d+'),
          ),
        );
      });

      it('should return: _or', () => {
        const filter = FilterNode.FilterRoot({
          childrensConjunction: FilterConjunction.Or,
          baseTable: BaseTable.Cultivars,
        });
        FilterNode.FilterLeaf({
          parent: filter,
          filterRule: filterRules.id,
        });
        FilterNode.FilterLeaf({
          parent: filter,
          filterRule: filterRules.name,
        });

        const { query } = filterToQuery({
          baseFilter: filter,
          attributionFilter: emptyAttributionFilter,
          columns: [],
          pagination: basicPagination,
        });

        expect(query).toMatch(
          new RegExp(
            prepareForRegex(`
cultivars(where: { _or: [
  { id: { _gt: $v000 } },
  { name: { _ilike: $v000 } }
] }`).replaceAll('$v000', '$v\\d+'),
          ),
        );
      });

      it('should return: outer _or, inner _and (nested)', () => {
        const filter = FilterNode.FilterRoot({
          childrensConjunction: FilterConjunction.Or,
          baseTable: BaseTable.Cultivars,
        });
        FilterNode.FilterLeaf({
          parent: filter,
          filterRule: new FilterRule({
            column: filterRules.created.column,
            operator: new FilterRuleOperator({
              value: FilterOperatorValue.Greater,
            }),
            term: new FilterRuleTerm({ value: '2021-01-01' }),
          }),
        });
        const child = FilterNode.FilterNode({
          childrensConjunction: FilterConjunction.And,
          parent: filter,
        });
        FilterNode.FilterLeaf({
          parent: child,
          filterRule: filterRules.id,
        });
        FilterNode.FilterLeaf({
          parent: child,
          filterRule: filterRules.name,
        });

        const { query } = filterToQuery({
          baseFilter: filter,
          attributionFilter: emptyAttributionFilter,
          columns: [],
          pagination: basicPagination,
        });

        expect(query).toMatch(
          new RegExp(
            prepareForRegex(`
  cultivars(where: { _or: [
    { created: { _gt: $v000 } },
    { _and: [
      { id: { _gt: $v000 } },
      { name: { _ilike: $v000 } }
    ] }
  ] }`).replaceAll('$v000', '$v\\d+'),
          ),
        );
      });

      it('should return: outer _and, inner _or (nested)', () => {
        const filter = FilterNode.FilterRoot({
          childrensConjunction: FilterConjunction.And,
          baseTable: BaseTable.Cultivars,
        });
        FilterNode.FilterLeaf({
          parent: filter,
          filterRule: new FilterRule({
            column: filterRules.created.column,
            operator: new FilterRuleOperator({
              value: FilterOperatorValue.Greater,
            }),
            term: new FilterRuleTerm({ value: '2021-01-01' }),
          }),
        });
        const child = FilterNode.FilterNode({
          childrensConjunction: FilterConjunction.Or,
          parent: filter,
        });
        FilterNode.FilterLeaf({
          parent: child,
          filterRule: filterRules.id,
        });
        FilterNode.FilterLeaf({
          parent: child,
          filterRule: filterRules.name,
        });

        const { query } = filterToQuery({
          baseFilter: filter,
          attributionFilter: emptyAttributionFilter,
          columns: [],
          pagination: basicPagination,
        });

        expect(query).toMatch(
          new RegExp(
            prepareForRegex(`
  cultivars(where: { _and: [
    { created: { _gt: $v000 } },
    { _or: [
      { id: { _gt: $v000 } },
      { name: { _ilike: $v000 } }
    ] }
  ] }`).replaceAll('$v000', '$v\\d+'),
          ),
        );
      });
    });

    describe('field', () => {
      describe('attribution', () => {
        describe('attributionValueCondition', () => {
          it('should value null', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: new FilterRuleColumn({
                  tableName: 'attributes',
                  tableColumnName: '123',
                  tableLabel: 'Attributions',
                  tableColumnLabel: 'String',
                  schema: {
                    allowEmpty: true,
                    type: ColumnTypes.String,
                    validation: {
                      maxLen: 255,
                      pattern: null,
                    },
                  },
                }),
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Empty,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(
                  'cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { _or: [ { text_value: { _is_null: true } }, { text_value: { _eq: $v000 } } ] } ] } } ] }',
                ).replaceAll('$v000', '$v\\d+'),
              ),
            );
            expect(Object.values(variables)[0]).toBe('');
          });

          it('should value empty string', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: new FilterRuleColumn({
                  tableName: 'attributes',
                  tableColumnName: '123',
                  tableLabel: 'Attributions',
                  tableColumnLabel: 'String',
                  schema: {
                    allowEmpty: true,
                    type: ColumnTypes.String,
                    validation: {
                      maxLen: 255,
                      pattern: null,
                    },
                  },
                }),
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Equal,
                }),
                term: new FilterRuleTerm({ value: '' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(
                  'cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { _or: [ { text_value: { _is_null: true } }, { text_value: { _eq: $v000 } } ] } ] } } ] }',
                ).replaceAll('$v000', '$v\\d+'),
              ),
            );
            expect(Object.values(variables)[0]).toBe('');
          });

          it('should value string', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: new FilterRuleColumn({
                  tableName: 'attributes',
                  tableColumnName: '123',
                  tableLabel: 'Attributions',
                  tableColumnLabel: 'String',
                  schema: {
                    allowEmpty: false,
                    type: ColumnTypes.String,
                    validation: {
                      maxLen: 255,
                      pattern: null,
                    },
                  },
                }),
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Equal,
                }),
                term: new FilterRuleTerm({ value: 'asdf' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(
                  'cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { text_value: { _eq: $v000 } } ] } } ] }',
                ).replaceAll('$v000', '$v\\d+'),
              ),
            );
            expect(Object.values(variables)[0]).toBe('asdf');
          });

          it('should value integers', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: new FilterRuleColumn({
                  tableName: 'attributes',
                  tableColumnName: '123',
                  tableLabel: 'Attributions',
                  tableColumnLabel: 'Integer',
                  schema: {
                    allowEmpty: false,
                    type: ColumnTypes.Integer,
                    validation: {
                      min: 1,
                      max: 9,
                      step: 1,
                    },
                  },
                }),
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Equal,
                }),
                term: new FilterRuleTerm({ value: '9' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(
                  'cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { integer_value: { _eq: $v000 } } ] } } ] }',
                ).replaceAll('$v000', '$v\\d+'),
              ),
            );
            expect(Object.values(variables)[0]).toBe(9);
          });

          it('should value ratings', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: new FilterRuleColumn({
                  tableName: 'attributes',
                  tableColumnName: '123',
                  tableLabel: 'Attributions',
                  tableColumnLabel: 'Rating',
                  schema: {
                    allowEmpty: false,
                    type: ColumnTypes.Rating,
                    validation: {
                      min: 1,
                      max: 9,
                      step: 1,
                    },
                  },
                }),
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Equal,
                }),
                term: new FilterRuleTerm({ value: '9' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(
                  'cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { integer_value: { _eq: $v000 } } ] } } ] }',
                ).replaceAll('$v000', '$v\\d+'),
              ),
            );
            expect(Object.values(variables)[0]).toBe(9);
          });

          it('should value floats', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: new FilterRuleColumn({
                  tableName: 'attributes',
                  tableColumnName: '123',
                  tableLabel: 'Attributions',
                  tableColumnLabel: 'Float',
                  schema: {
                    allowEmpty: false,
                    type: ColumnTypes.Float,
                    validation: {
                      min: 0,
                      max: 1,
                      step: 0.1,
                    },
                  },
                }),
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Equal,
                }),
                term: new FilterRuleTerm({ value: '0.5' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(
                  'cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { float_value: { _eq: $v000 } } ] } } ] }',
                ).replaceAll('$v000', '$v\\d+'),
              ),
            );
            expect(Object.values(variables)[0]).toBe(0.5);
          });

          it('should value booleans', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: new FilterRuleColumn({
                  tableName: 'attributes',
                  tableColumnName: '123',
                  tableLabel: 'Attributions',
                  tableColumnLabel: 'Boolean',
                  schema: {
                    allowEmpty: false,
                    type: ColumnTypes.Boolean,
                  },
                }),
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.True,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(
                  'cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { boolean_value: { _eq: $v000 } } ] } } ] }',
                ).replaceAll('$v000', '$v\\d+'),
              ),
            );
            expect(Object.values(variables)[0]).toBe(true);
          });

          it('should value dates', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: new FilterRuleColumn({
                  tableName: 'attributes',
                  tableColumnName: '123',
                  tableLabel: 'Attributions',
                  tableColumnLabel: 'Date',
                  schema: {
                    allowEmpty: false,
                    type: ColumnTypes.Date,
                  },
                }),
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Equal,
                }),
                term: new FilterRuleTerm({ value: '2024-06-07' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(
                  'cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { date_value: { _eq: $v000 } } ] } } ] }',
                ).replaceAll('$v000', '$v\\d+'),
              ),
            );
            expect(Object.values(variables)[0]).toBe('2024-06-07');
          });
        });

        it('should includeEntitiesWithoutAttributions', () => {
          const filter = FilterNode.FilterRoot(filterRootArgs);
          FilterNode.FilterLeaf({
            parent: filter,
            filterRule: new FilterRule({
              column: filterRules.attribute.column,
              operator: filterRules.attribute.operator,
              term: filterRules.attribute.term,
              includeEntitiesWithoutAttributions: true,
            }),
          });

          const { query, variables } = filterToQuery({
            baseFilter: filter,
            attributionFilter: emptyAttributionFilter,
            columns: [],
            pagination: basicPagination,
          });

          expect(query).toMatch(
            new RegExp(
              prepareForRegex(`
cultivars(where: { _and: [ { _or: [
  { attributions_views: { _and: [
    { attribute_id: { _eq: 123 } },
    { integer_value: { _eq: $v000 } }
  ] } },
  { attributions_views_aggregate: {
    count: {
      predicate: { _eq: 0 },
      filter: { attribute_id: { _eq: 123 } }
    }
  } }
] } ] }`).replaceAll('$v000', '$v\\d+'),
            ),
          );
          expect(Object.values(variables)[0]).toBeTypeOf('number');
        });

        it('should not includeEntitiesWithoutAttributions', () => {
          const filter = FilterNode.FilterRoot(filterRootArgs);
          FilterNode.FilterLeaf({
            parent: filter,
            filterRule: new FilterRule({
              column: filterRules.attribute.column,
              operator: filterRules.attribute.operator,
              term: filterRules.attribute.term,
              includeEntitiesWithoutAttributions: false,
            }),
          });

          const { query, variables } = filterToQuery({
            baseFilter: filter,
            attributionFilter: emptyAttributionFilter,
            columns: [],
            pagination: basicPagination,
          });

          expect(query).toMatch(
            new RegExp(
              prepareForRegex(`
cultivars(where: { _and: [ { attributions_views: { _and: [ { attribute_id: { _eq: 123 } }, { integer_value: { _eq: $v000 } } ] } } ] }`).replaceAll(
                '$v000',
                '$v\\d+',
              ),
            ),
          );
          expect(Object.values(variables)[0]).toBeTypeOf('number');
        });
      });

      describe('baseTable', () => {
        it('should not contain the base table', () => {
          const filter = FilterNode.FilterRoot(filterRootArgs);
          FilterNode.FilterLeaf({
            parent: filter,
            filterRule: new FilterRule({
              column: filterRules.id.column,
              operator: new FilterRuleOperator({
                value: FilterOperatorValue.Equal,
              }),
              term: new FilterRuleTerm({ value: '10' }),
            }),
          });

          const { query, variables } = filterToQuery({
            baseFilter: filter,
            attributionFilter: emptyAttributionFilter,
            columns: [],
            pagination: basicPagination,
          });

          expect(query).toMatch(
            new RegExp(
              prepareForRegex(`
cultivars(where: { _and: [ { id: { _eq: $v000 } } ] }`).replaceAll(
                '$v000',
                '$v\\d+',
              ),
            ),
          );
          expect(Object.values(variables)[0]).toBe(10);
        });

        describe('nested, with negation', () => {
          it('should return: Equal', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedIntegerAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Equal,
                }),
                term: new FilterRuleTerm({ value: '10' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { lot: { integer_allow_empty: { _eq: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(10);
          });

          it('should return: NotEqual', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedIntegerAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.NotEqual,
                }),
                term: new FilterRuleTerm({ value: '10' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { _not: { lot: { integer_allow_empty: { _eq: $v000 } } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(10);
          });

          it('should return: Less', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedIntegerAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Less,
                }),
                term: new FilterRuleTerm({ value: '10' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { lot: { integer_allow_empty: { _lt: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(10);
          });

          it('should return: LessOrEqual', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedIntegerAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.LessOrEqual,
                }),
                term: new FilterRuleTerm({ value: '10' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { lot: { integer_allow_empty: { _lte: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(10);
          });

          it('should return: Greater', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedIntegerAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Greater,
                }),
                term: new FilterRuleTerm({ value: '10' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { lot: { integer_allow_empty: { _gt: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(10);
          });

          it('should return: GreaterOrEqual', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedIntegerAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.GreaterOrEqual,
                }),
                term: new FilterRuleTerm({ value: '10' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { lot: { integer_allow_empty: { _gte: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(10);
          });

          it('should return: StartsWith', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.StartsWith,
                }),
                term: new FilterRuleTerm({ value: 'ab' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { lot: { string_allow_empty: { _ilike: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe('ab%');
          });

          it('should return: StartsNotWith', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.StartsNotWith,
                }),
                term: new FilterRuleTerm({ value: 'ab' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { _not: { lot: { string_allow_empty: { _ilike: $v000 } } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe('ab%');
          });

          it('should return: Contains', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Contains,
                }),
                term: new FilterRuleTerm({ value: 'ab' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { lot: { string_allow_empty: { _ilike: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe('%ab%');
          });

          it('should return: NotContains', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.NotContains,
                }),
                term: new FilterRuleTerm({ value: 'ab' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { _not: { lot: { string_allow_empty: { _ilike: $v000 } } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe('%ab%');
          });

          it('should return: EndsWith', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.EndsWith,
                }),
                term: new FilterRuleTerm({ value: 'ab' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { lot: { string_allow_empty: { _ilike: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe('%ab');
          });

          it('should return: NotEndsWith', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.NotEndsWith,
                }),
                term: new FilterRuleTerm({ value: 'ab' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { _not: { lot: { string_allow_empty: { _ilike: $v000 } } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe('%ab');
          });

          it('should return: Integer Empty nullable', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedIntegerAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Empty,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { _not: { lot: { integer_allow_empty: { _is_null: $v000 } } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(false);
          });

          it('should return: Rating Empty nullable', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedRatingAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Empty,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { _not: { lot: { rating_allow_empty: { _is_null: $v000 } } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(false);
          });

          it('should return: String === "" nullable', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Equal,
                }),
                term: new FilterRuleTerm({ value: '' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { lot: { _or: [ { string_allow_empty: { _is_null: true } }, { string_allow_empty: { _eq: "" } } ] } } ] }`),
              ),
            );
            expect(Object.values(variables).length).toBe(0);
          });

          it('should return: String Empty nullable', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.Empty,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
  cultivars(where: { _and: [ { _not: { lot: { _and: [ { string_allow_empty: { _is_null: false } }, { string_allow_empty: { _neq: "" } } ] } } } ] }`),
              ),
            );
            expect(Object.values(variables).length).toBe(0);
          });

          it('should return: Integer NotEmpty nullable', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedIntegerAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.NotEmpty,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { lot: { integer_allow_empty: { _is_null: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(false);
          });

          it('should return: Rating NotEmpty nullable', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedRatingAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.NotEmpty,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { lot: { rating_allow_empty: { _is_null: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(false);
          });

          it('should return: String !== "" nullable', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.NotEqual,
                }),
                term: new FilterRuleTerm({ value: '' }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { _not: { lot: { _or: [ { string_allow_empty: { _is_null: true } }, { string_allow_empty: { _eq: "" } } ] } } } ] }`),
              ),
            );
            expect(Object.values(variables).length).toBe(0);
          });

          it('should return: String NotEmpty nullable', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedStringAllowEmpty.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.NotEmpty,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { lot: { _and: [ { string_allow_empty: { _is_null: false } }, { string_allow_empty: { _neq: "" } } ] } } ] }`),
              ),
            );
            expect(Object.values(variables).length).toBe(0);
          });

          it('should return: True', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedBoolean.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.True,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { lot: { boolean: { _eq: $v000 } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(true);
          });

          it('should return: False', () => {
            const filter = FilterNode.FilterRoot(filterRootArgs);
            FilterNode.FilterLeaf({
              parent: filter,
              filterRule: new FilterRule({
                column: filterRules.nestedBoolean.column,
                operator: new FilterRuleOperator({
                  value: FilterOperatorValue.False,
                }),
              }),
            });

            const { query, variables } = filterToQuery({
              baseFilter: filter,
              attributionFilter: emptyAttributionFilter,
              columns: [],
              pagination: basicPagination,
            });

            expect(query).toMatch(
              new RegExp(
                prepareForRegex(`
    cultivars(where: { _and: [ { _not: { lot: { boolean: { _eq: $v000 } } } } ] }`).replaceAll(
                  '$v000',
                  '$v\\d+',
                ),
              ),
            );
            expect(Object.values(variables)[0]).toBe(true);
          });
        });
      });
    });

    describe('recursion', () => {
      it('should return condition for children', () => {
        const filter = FilterNode.FilterRoot(filterRootArgs);
        const child = FilterNode.FilterNode({
          childrensConjunction: FilterConjunction.Or,
          parent: filter,
        });
        FilterNode.FilterLeaf({
          parent: child,
          filterRule: filterRules.id,
        });
        FilterNode.FilterLeaf({
          parent: child,
          filterRule: filterRules.name,
        });
        FilterNode.FilterLeaf({
          parent: filter,
          filterRule: filterRules.created,
        });

        const { query } = filterToQuery({
          baseFilter: filter,
          attributionFilter: emptyAttributionFilter,
          columns: ['cultivars.id', 'cultivars.name', 'cultivars.created'],
          pagination: basicPagination,
        });

        expect(query).toMatch(
          new RegExp(
            prepareForRegex(`
cultivars(where: { _and: [
    { _or: [
      { id: { _gt: $v000 } },
      { name: { _ilike: $v000 } }
    ] },
    { _not: { created: { _eq: $v000 } } } ] }`).replaceAll('$v000', '$v\\d+'),
          ),
        );
      });
    });
  });

  describe('pagination', () => {
    it('should apply defaults: limit & offset', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: [],
        pagination: {},
      });

      expect(query).toMatch(new RegExp(prepareForRegex('limit: 100')));
      expect(query).toMatch(new RegExp(prepareForRegex('offset: 0')));
    });

    it('should apply default column: id', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: [],
        pagination: {},
      });

      expect(query).toMatch(
        new RegExp(prepareForRegex('order_by: { id: asc }')),
      );
    });

    it('should apply default column: name', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.name'],
        pagination: {},
      });

      expect(query).toMatch(
        new RegExp(prepareForRegex('order_by: [ { name: asc }, { id: asc } ]')),
      );
    });

    it('should return limit', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);
      const pagination = Object.assign({}, basicPagination, {
        rowsPerPage: 10,
        page: 10,
      });

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: [],
        pagination,
      });

      expect(query).toMatch(new RegExp(prepareForRegex('offset: 90')));
    });

    it('should return offset', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);
      const pagination = Object.assign({}, basicPagination, {
        rowsPerPage: 10,
      });

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: [],
        pagination,
      });

      expect(query).toMatch(new RegExp(prepareForRegex('limit: 10')));
    });

    it('should return orderBy asc', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);
      const pagination = Object.assign({}, basicPagination, {
        sortBy: 'cultivars.name',
        descending: false,
      });

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.name'],
        pagination,
      });

      expect(query).toMatch(
        new RegExp(prepareForRegex('order_by: [ { name: asc }, { id: asc } ]')),
      );
    });

    it('should return orderBy desc', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);
      const pagination = Object.assign({}, basicPagination, {
        sortBy: 'cultivars.name',
        descending: true,
      });

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.name'],
        pagination,
      });

      expect(query).toMatch(
        new RegExp(
          prepareForRegex('order_by: [ { name: desc }, { id: asc } ]'),
        ),
      );
    });

    it('should return orderBy nested field', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);
      const pagination = Object.assign({}, basicPagination, {
        sortBy: 'cultivars.lots.name',
      });

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.id', 'cultivars.lots.name'],
        pagination,
      });

      expect(query).toMatch(
        new RegExp(
          prepareForRegex('order_by: [ { lot: { name: asc } }, { id: asc } ]'),
        ),
      );
    });
  });

  describe('fields', () => {
    it('should return baseTable fields', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.name', 'cultivars.breeder'],
        pagination: basicPagination,
      });

      expect(query).toMatch(
        new RegExp(
          prepareForRegex(`cultivars(***) {
  id
  name
  breeder
}`).replace('\\*\\*\\*', '[^)]+'),
        ),
      );
    });

    it('should contain the id', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.name'],
        pagination: basicPagination,
      });

      expect(query).toMatch(
        new RegExp(
          prepareForRegex(`cultivars(***) {
  id
  name
}`).replace('\\*\\*\\*', '[^)]+'),
        ),
      );
    });

    it('should contain the id only once', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.id'],
        pagination: basicPagination,
      });

      expect(query).toMatch(
        new RegExp(
          prepareForRegex(`cultivars(***) {
  id
}`).replace('\\*\\*\\*', '[^)]+'),
        ),
      );
    });

    it('should return nested baseTable fields', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.id', 'cultivars.lots.name'],
        pagination: basicPagination,
      });

      expect(query).toMatch(
        new RegExp(prepareForRegex('cultivars__lots__name: lot { id name }')),
      );
    });

    it('should return attribution fields', () => {
      const filter = FilterNode.FilterRoot(filterRootArgs);

      const { query } = filterToQuery({
        baseFilter: filter,
        attributionFilter: emptyAttributionFilter,
        columns: ['cultivars.id', 'attributes.1', 'attributes.255'],
        pagination: basicPagination,
      });

      expect(query).toMatch(
        new RegExp(
          prepareForRegex(`
attributes__1: attributions_views(where: { _and: [ { attribute_id: { _eq: 1 } } ] }, order_by: { date_attributed: desc }) {
  ...AttributionFragment
}
attributes__255: attributions_views(where: { _and: [ { attribute_id: { _eq: 255 } } ] }, order_by: { date_attributed: desc }) {
  ...AttributionFragment
}`),
        ),
      );
    });
  });

  it('should return the filtered attribution fields', () => {
    const filter = FilterNode.FilterRoot(filterRootArgs);
    const attributionFilter = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Attributions,
    });
    FilterNode.FilterLeaf({
      parent: attributionFilter,
      filterRule: new FilterRule({
        column: new FilterRuleColumn({
          tableName: 'attributions_views',
          tableColumnName: 'author',
          tableLabel: 'Attributions',
          tableColumnLabel: 'Author',
          schema: {
            allowEmpty: false,
            type: ColumnTypes.String,
            validation: {
              maxLen: 255,
              pattern: null,
            },
          },
        }),
        operator: new FilterRuleOperator({
          value: FilterOperatorValue.Equal,
        }),
        term: new FilterRuleTerm({ value: 'Hugo' }),
      }),
    });

    const { query } = filterToQuery({
      baseFilter: filter,
      attributionFilter,
      columns: ['cultivars.id', 'attributes.1', 'attributes.255'],
      pagination: basicPagination,
    });

    expect(query).toMatch(
      new RegExp(
        prepareForRegex(`
attributes__1: attributions_views(where: { _and: [ { attribute_id: { _eq: 1 } }, { _and: [ { author: { _eq: $v000 } } ] } ] }, order_by: { date_attributed: desc }) {
...AttributionFragment
}
attributes__255: attributions_views(where: { _and: [ { attribute_id: { _eq: 255 } }, { _and: [ { author: { _eq: $v000 } } ] } ] }, order_by: { date_attributed: desc }) {
...AttributionFragment
}`).replaceAll('$v000', '$v\\d+'),
      ),
    );
  });

  it('should contain aggregation query', () => {
    const filter = FilterNode.FilterRoot(filterRootArgs);
    FilterNode.FilterLeaf({
      parent: filter,
      filterRule: filterRules.id,
    });

    const { query } = filterToQuery({
      baseFilter: filter,
      attributionFilter: emptyAttributionFilter,
      columns: ['cultivars.id', 'cultivars.name'],
      pagination: basicPagination,
    });

    expect(query).toMatch(
      new RegExp(
        prepareForRegex(`
cultivars_aggregate(where: { _and: [ { id: { _gt: $v000 } } ] }) {
  aggregate {
    count
  }
}`).replaceAll('$v000', '$v\\d+'),
      ),
    );
  });

  it('should contain attribution fragment', () => {
    const filter = FilterNode.FilterRoot(filterRootArgs);

    const { query } = filterToQuery({
      baseFilter: filter,
      attributionFilter: emptyAttributionFilter,
      columns: ['cultivars.id', 'cultivars.name'],
      pagination: basicPagination,
    });

    expect(query).toMatch(
      new RegExp(
        prepareForRegex(`
fragment AttributionFragment on attributions_view {
  id
  integer_value
  float_value
  text_value
  boolean_value
  date_value
  plant_id
  cultivar_id
  lot_id
  data_type
}`),
      ),
    );
  });

  it('should not contain attribution variables if there are no attribution columns', () => {
    const filter = FilterNode.FilterRoot(filterRootArgs);
    const attributionFilter = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Attributions,
    });
    FilterNode.FilterLeaf({
      parent: attributionFilter,
      filterRule: new FilterRule({
        column: new FilterRuleColumn({
          tableName: 'attributions_views',
          tableColumnName: 'author',
          tableLabel: 'Attributions',
          tableColumnLabel: 'Author',
          schema: {
            allowEmpty: false,
            type: ColumnTypes.String,
            validation: {
              maxLen: 255,
              pattern: null,
            },
          },
        }),
        operator: new FilterRuleOperator({
          value: FilterOperatorValue.Equal,
        }),
        term: new FilterRuleTerm({ value: 'Hugo' }),
      }),
    });

    const { variables } = filterToQuery({
      baseFilter: filter,
      attributionFilter: attributionFilter,
      columns: ['cultivars.id'],
      pagination: basicPagination,
    });

    expect(Object.keys(variables).length).toBe(0);
  });

  it('should contain attribution variables if there are attribution columns', () => {
    const filter = FilterNode.FilterRoot(filterRootArgs);
    const attributionFilter = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Attributions,
    });
    FilterNode.FilterLeaf({
      parent: attributionFilter,
      filterRule: new FilterRule({
        column: new FilterRuleColumn({
          tableName: 'attributions_views',
          tableColumnName: 'author',
          tableLabel: 'Attributions',
          tableColumnLabel: 'Author',
          schema: {
            allowEmpty: false,
            type: ColumnTypes.String,
            validation: {
              maxLen: 255,
              pattern: null,
            },
          },
        }),
        operator: new FilterRuleOperator({
          value: FilterOperatorValue.Equal,
        }),
        term: new FilterRuleTerm({ value: 'Hugo' }),
      }),
    });

    const { variables } = filterToQuery({
      baseFilter: filter,
      attributionFilter: attributionFilter,
      columns: ['cultivars.id', 'attributes.1'],
      pagination: basicPagination,
    });

    expect(Object.values(variables)[0]).toBe('Hugo');
  });
});
