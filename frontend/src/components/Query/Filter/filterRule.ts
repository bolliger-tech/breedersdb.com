import { FilterRuleColumn, FilterRuleColumnJson } from './filterRuleColumn';
import {
  FilterOperatorValue,
  FilterRuleOperator,
  type FilterRuleOperatorJson,
} from './filterRuleOperator';
import { FilterRuleTerm, FilterRuleTermJson } from './filterRuleTerm';
import { ColumnTypes } from 'src/utils/columnTypes';

export type FilterRuleSchema =
  | StringSchema
  | IntegerSchema
  | FloatSchema
  | BooleanSchema
  | EnumSchema
  | DateSchema
  | DateTimeSchema
  | TimeSchema
  | PhotoSchema;

export type FilterRuleJson = {
  column: FilterRuleColumnJson | undefined;
  operator: FilterRuleOperatorJson | undefined;
  term: FilterRuleTermJson | undefined;
  includeEntitiesWithoutAttributions?: boolean;
};

export class FilterRule {
  private _column: FilterRuleColumn | undefined;
  private _operator: FilterRuleOperator | undefined;
  private _term: FilterRuleTerm | undefined;
  private _includeEntitiesWithoutAttributions = false;

  constructor({
    column,
    operator,
    term,
    includeEntitiesWithoutAttributions,
  }: {
    column?: FilterRuleColumn;
    operator?: FilterRuleOperator;
    term?: FilterRuleTerm;
    includeEntitiesWithoutAttributions?: boolean;
  } = {}) {
    this.column = column;
    this.operator = operator;
    this.term = term;
    if (typeof includeEntitiesWithoutAttributions !== 'undefined') {
      this.includeEntitiesWithoutAttributions =
        includeEntitiesWithoutAttributions;
    }
  }

  get column() {
    return this._column;
  }

  set column(value: FilterRuleColumn | undefined) {
    this._column = value;
    if (this._operator) {
      this._operator.schema = value?.schema;
    }
    if (this._term) {
      this._term.schema = value?.schema;
    }
  }

  get operator() {
    return this._operator;
  }

  set operator(value: FilterRuleOperator | undefined) {
    if (value) {
      value.schema = this._column?.schema;
    }
    this._operator = value;
  }

  get term() {
    return this._term;
  }

  set term(value: FilterRuleTerm | undefined) {
    if (value) {
      value.schema = this._column?.schema;
    }
    this._term = value;
  }

  get isAttribute() {
    return this.column?.isAttribute;
  }

  get type() {
    return this.column?.type;
  }

  get tableName() {
    return this.column?.tableName;
  }

  get columnName() {
    return this.column?.tableColumnName;
  }

  get allowEmptyTerm() {
    return this.column?.allowEmptyTerm;
  }

  get canBeNullOrEmpty() {
    return (
      this.allowEmptyTerm &&
      this.type === ColumnTypes.String &&
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
    if (!this.type) return false;

    switch (this.type) {
      case ColumnTypes.Time:
      case ColumnTypes.Date:
      case ColumnTypes.DateTime:
      case ColumnTypes.Integer:
      case ColumnTypes.Float:
      case ColumnTypes.Enum:
      case ColumnTypes.String:
        return (
          this.operator?.value !== FilterOperatorValue.Empty &&
          this.operator?.value !== FilterOperatorValue.NotEmpty
        );
      case ColumnTypes.Boolean:
      case ColumnTypes.Photo:
        return false;
      default:
        throw new Error(`Unknown column type: ${this.type}`);
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

  toJSON(): FilterRuleJson {
    return {
      column: this.column,
      operator: this.operator,
      term: this.term,
      ...(this.isAttribute
        ? {
            includeEntitiesWithoutAttributions:
              this.includeEntitiesWithoutAttributions,
          }
        : {}),
    };
  }

  static FromJSON(json: string | FilterRuleJson, columns: FilterRuleColumn[]) {
    const data: FilterRuleJson =
      'string' === typeof json ? JSON.parse(json) : json;

    const columnDefinition = columns.find(
      (col) =>
        col.tableName === data.column?.tableName &&
        col.tableColumnName === data.column?.tableColumnName,
    );

    const rule = new FilterRule({
      column: data.column
        ? FilterRuleColumn.FromJSON(data.column, columnDefinition)
        : undefined,
      operator: data.operator
        ? FilterRuleOperator.FromJSON(data.operator)
        : undefined,
      term: data.term ? FilterRuleTerm.FromJSON(data.term) : undefined,
      includeEntitiesWithoutAttributions:
        typeof data.includeEntitiesWithoutAttributions !== 'undefined'
          ? data.includeEntitiesWithoutAttributions
          : undefined,
    });

    return rule;
  }
}

interface StringSchema {
  allowEmpty: boolean;
  type: ColumnTypes.String;
  validation: {
    maxLen: number | null;
    pattern: string | null;
  };
}

interface IntegerSchema {
  allowEmpty: boolean;
  type: ColumnTypes.Integer;
  validation: {
    min: number;
    max: number;
    step: number;
  };
}

interface FloatSchema {
  allowEmpty: boolean;
  type: ColumnTypes.Float;
  validation: {
    min: number;
    max: number;
    step: number;
  };
}

interface BooleanSchema {
  allowEmpty: boolean;
  type: ColumnTypes.Boolean;
}

interface EnumSchema {
  allowEmpty: boolean;
  type: ColumnTypes.Enum;
  validation: {
    options: string[];
  };
}

interface DateSchema {
  allowEmpty: boolean;
  type: ColumnTypes.Date;
}

interface DateTimeSchema {
  allowEmpty: boolean;
  type: ColumnTypes.DateTime;
}

interface TimeSchema {
  allowEmpty: boolean;
  type: ColumnTypes.Time;
}

interface PhotoSchema {
  allowEmpty: boolean;
  type: ColumnTypes.Photo;
}
