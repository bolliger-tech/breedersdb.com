export enum AttributionFormFieldType {
  Integer = 'INTEGER',
  Float = 'FLOAT',
  Boolean = 'BOOLEAN',
  Date = 'DATE',
  String = 'VARCHAR',
  Photo = 'PHOTO',
}

export type AttributionFormFieldNumberConstraint = null | {
  min: number;
  max: number;
  step: number;
};
export type AttributionValueValue = string | boolean | number | Date | File;

export interface Attribute {
  id: number;
  name: string;
  number_constraints: AttributionFormFieldNumberConstraint;
  field_type: AttributionFormFieldType;
  note: string | null;
  attribute_type_id: number;
  created: string | null;
  modified: string | null;
  tree_property: boolean;
  variety_property: boolean;
  batch_property: boolean;
  // attribute_type?: AttributeType
}

export interface AttributionForm {
  id: number;
  name: string;
  description: string | null;
  created: string | null;
  modified: string | null;
  attributes?: Attribute[] | null;
}

export interface AttributionValue {
  id?: number;
  value: AttributionValueValue;
  exceptional_mark: boolean;
  attribute_id: number;
  mark_id?: number;
  created?: string | null;
  modified?: string | null;
  attribution_form?: AttributionForm;
  attribute?: Attribute;
}

export interface Mark {
  id?: number;
  date: Date | null;
  author: string | null;
  attribution_form_id: number;
  tree_id: number | null;
  variety_id: number | null;
  batch_id: number | null;
  created?: string | null;
  modified?: string | null;
  attribution_form?: AttributionForm;
  tree?: unknown; // TODO: Tree;
  // variety?: Variety
  // batch?: Batch
  attribution_values?: AttributionValue[];
}
