export enum ColumnTypes {
  String = 'string',
  Citext = 'citext',
  Integer = 'integer',
  Float = 'double',
  Boolean = 'boolean',
  Enum = 'enum',
  Date = 'date',
  DateTime = 'datetime',
  Time = 'time',
  // photos and attachments: the column value is a stored file's name
  File = 'file',
  Rating = 'rating',
}
