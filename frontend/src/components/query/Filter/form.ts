export enum MarkFormFieldType {
  Integer = 'INTEGER',
  Float = 'FLOAT',
  Boolean = 'BOOLEAN',
  Date = 'DATE',
  String = 'VARCHAR',
  Photo = 'PHOTO',
}

export type MarkFormFieldNumberConstraint = null | {
  min: number;
  max: number;
  step: number;
};
export type MarkValueValue = string | boolean | number | Date | File;

export interface Attribute {
  id: number;
  name: string;
  number_constraints: MarkFormFieldNumberConstraint;
  field_type: MarkFormFieldType;
  note: string | null;
  attribute_type_id: number;
  created: string | null;
  modified: string | null;
  tree_property: boolean;
  variety_property: boolean;
  batch_property: boolean;
  // attribute_type?: AttributeType
}

export interface MarkForm {
  id: number;
  name: string;
  description: string | null;
  created: string | null;
  modified: string | null;
  attributes?: Attribute[] | null;
}

export interface MarkValue {
  id?: number;
  value: MarkValueValue;
  exceptional_mark: boolean;
  attribute_id: number;
  mark_id?: number;
  created?: string | null;
  modified?: string | null;
  mark_form?: MarkForm;
  attribute?: Attribute;
}

export interface Mark {
  id?: number;
  date: Date | null;
  author: string | null;
  mark_form_id: number;
  tree_id: number | null;
  variety_id: number | null;
  batch_id: number | null;
  created?: string | null;
  modified?: string | null;
  mark_form?: MarkForm;
  tree?: unknown; // TODO: Tree;
  // variety?: Variety
  // batch?: Batch
  mark_values?: MarkValue[];
}
