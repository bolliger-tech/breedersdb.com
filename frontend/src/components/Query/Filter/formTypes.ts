// enum AttributionFormFieldType {
//   Integer = 'INTEGER',
//   Float = 'FLOAT',
//   Boolean = 'BOOLEAN',
//   Date = 'DATE',
//   String = 'VARCHAR',
//   Photo = 'PHOTO',
// }

// type AttributionFormFieldNumberConstraint = null | {
//   min: number;
//   max: number;
//   step: number;
// };
// type AttributionValueValue = string | boolean | number | Date | File;

// export interface Attribute {
//   // TODO: check. e.g. validation_rule is missing
//   id: number;
//   name: string;
//   number_constraints: AttributionFormFieldNumberConstraint;
//   field_type: AttributionFormFieldType;
//   note: string | null;
//   attribute_type_id: number;
//   created: string | null;
//   modified: string | null;
//   // attribute_type?: AttributeType
// }

// export interface AttributionForm {
//   id: number;
//   name: string;
//   description: string | null;
//   created: string | null;
//   modified: string | null;
//   attributes?: Attribute[] | null;
// }

// interface AttributionValue {
//   id?: number;
//   value: AttributionValueValue;
//   exceptional_attribution: boolean;
//   attribute_id: number;
//   attribution_id?: number;
//   created?: string | null;
//   modified?: string | null;
//   attribution_form?: AttributionForm;
//   attribute?: Attribute;
// }

// export interface Attribution {
//   id?: number;
//   date: Date | null;
//   author: string | null;
//   attribution_form_id: number;
//   tree_id: number | null;
//   variety_id: number | null;
//   batch_id: number | null;
//   created?: string | null;
//   modified?: string | null;
//   attribution_form?: AttributionForm;
//   tree?: unknown; // TODO: Tree;
//   // variety?: Variety
//   // batch?: Batch
//   attribution_values?: AttributionValue[];
// }
