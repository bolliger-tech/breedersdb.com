// enum AttributeSchemaOptionType {
//   String = 'string',
//   Integer = 'integer',
//   Float = 'double',
//   Boolean = 'boolean',
//   Enum = 'enum',
//   Date = 'date',
//   Datetime = 'datetime',
//   Time = 'time',
//   Photo = 'photo',
// }

// interface AttributeSchemaStringOptions {
//   type: AttributeSchemaOptionType.String;
//   validation: {
//     maxLen: number | null;
//     pattern: string | null;
//   };
// }

// interface AttributeSchemaIntegerOptions {
//   type: AttributeSchemaOptionType.Integer;
//   validation: {
//     min: number;
//     max: number;
//     step: number;
//   };
// }

// interface AttributeSchemaDoubleOptions {
//   type: AttributeSchemaOptionType.Float;
//   validation: {
//     min: number;
//     max: number;
//     step: number;
//   };
// }

// interface AttributeSchemaBooleanOptions {
//   type: AttributeSchemaOptionType.Boolean;
// }

// interface AttributeSchemaEnumOptions {
//   type: AttributeSchemaOptionType.Enum;
//   validation: {
//     options: string[];
//   };
// }

// interface AttributeSchemaDateOptions {
//   type: AttributeSchemaOptionType.Date;
// }

// interface AttributeSchemaDatetimeOptions {
//   type: AttributeSchemaOptionType.Datetime;
// }

// interface AttributeSchemaTimeOptions {
//   type: AttributeSchemaOptionType.Time;
// }

// interface AttributeSchemaPhotoOptions {
//   type: AttributeSchemaOptionType.Photo;
// }

// interface AttributeSchemaEmptyOption {
//   allowEmpty: boolean;
// }

// type AttributeSchemaOptions = AttributeSchemaEmptyOption &
//   (
//     | AttributeSchemaStringOptions
//     | AttributeSchemaIntegerOptions
//     | AttributeSchemaDoubleOptions
//     | AttributeSchemaEnumOptions
//     | AttributeSchemaBooleanOptions
//     | AttributeSchemaDateOptions
//     | AttributeSchemaDatetimeOptions
//     | AttributeSchemaTimeOptions
//     | AttributeSchemaPhotoOptions
//   );

// export interface AttributeSchema {
//   name: string; // e.g. TreesView.publicid
//   label: string; // e.g. Tree -> Publicid
//   options: AttributeSchemaOptions;
// }
