import { FilterRuleColumn, FilterRuleColumnJson } from './filterRuleColumn';
import {
  FilterOperatorValue,
  FilterRuleOperator,
  type FilterRuleOperatorJson,
} from './filterRuleOperator';
import { FilterRuleTerm, FilterRuleTermJson } from './filterRuleTerm';

export enum FilterRuleType {
  String = 'string',
  Integer = 'integer',
  Float = 'double',
  Boolean = 'boolean',
  Enum = 'enum',
  Date = 'date',
  DateTime = 'datetime',
  Time = 'time',
  Photo = 'photo',
}

export type FilterRuleTypeSchema =
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
    if (!this.type) return false;

    switch (this.type) {
      case FilterRuleType.Time:
      case FilterRuleType.Date:
      case FilterRuleType.DateTime:
      case FilterRuleType.Integer:
      case FilterRuleType.Float:
      case FilterRuleType.Enum:
        return true;
      case FilterRuleType.String:
        return (
          this.operator?.value !== FilterOperatorValue.Empty &&
          this.operator?.value !== FilterOperatorValue.NotEmpty
        );
      case FilterRuleType.Boolean:
      case FilterRuleType.Photo:
        return false;
      default:
        throw new Error(`Unknown filter rule type: ${this.type}`);
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
  type: FilterRuleType.String;
  validation: {
    maxLen: number | null;
    pattern: string | null;
  };
}

interface IntegerSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Integer;
  validation: {
    min: number;
    max: number;
    step: number;
  };
}

interface FloatSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Float;
  validation: {
    min: number;
    max: number;
    step: number;
  };
}

interface BooleanSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Boolean;
}

interface EnumSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Enum;
  validation: {
    options: string[];
  };
}

interface DateSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Date;
}

interface DateTimeSchema {
  allowEmpty: boolean;
  type: FilterRuleType.DateTime;
}

interface TimeSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Time;
}

interface PhotoSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Photo;
}
