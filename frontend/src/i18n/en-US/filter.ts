export const filter = {
  attribute: 'Attribute',
  attributionFilter: 'Filter criteria to select the attributions',
  id: 'ID',
  commonName: 'Common Name',
  acronym: 'Acronym',
  breeder: 'Breeder',
  registration: 'Registration',
  note: 'Note',
  created: 'Created',

  noFilter:
    'No filter criteria defined. All {entity} will be selected. Click the plus button below to add filter criteria.',

  simplifiable: 'Unnecessary complexity detected.',
  simplify: 'Simplify filter',
  invalid: 'Invalid filter rules. Rectify or delete them.',
  valid: 'Congrats, all rules are valid.',

  marks: 'marks',
  crossings: 'crossings',
  lots: 'lots',
  cultivars: 'cultivars',
  trees: 'trees',

  crossing: 'crossing',
  lot: 'lot',
  cultivar: 'cultivar',
  tree: 'tree',
  cultivarAndSubentities: 'cultivar or its groups or trees',

  explainer: {
    title: 'Explanation:',
    attributeWithNoAttributions:
      'The {entity} have either no {column} attribution or at least one which satisfies: {column} {operator} {term}',
    attribute:
      'The {entity} has at least one attribution which satisfies: {column} {operator} {term}',
    entity: 'The {entity} where {column} {operator} {term}',
  },

  error: {
    column: 'Please select a column.',
    operator: 'Please select a operator.',
    term: 'Please enter a valid term.',
  },

  column: 'Column',
  operator: 'Operator',
  term: 'Term',

  withNoAttributions:
    'Include {entities} without {attributeName} attributions.',

  noResults: 'No results.',

  operands: {
    equals: 'equals',
    notEquals: 'not equals',
    less: 'less than',
    lessOrEqual: 'less or equals',
    greater: 'greater than',
    greaterOrEqual: 'greater or equals',
    startsWith: 'starts with',
    startsNotWith: 'starts not with',
    contains: 'contains',
    notContains: 'contains not',
    endsWith: 'ends with',
    notEndsWith: 'ends not with',
    empty: 'is empty',
    notEmpty: 'is not empty',
    hasPhoto: 'has photo',
    isTrue: 'is true',
    isFalse: 'is false',

    add: 'Add',
    andFilter: 'and criterion',
    orFilter: 'or criterion',

    and: 'and',
    or: 'or',
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const oldQueries = {
//   title: 'Queries',
//   add: 'Add query',
//   unsaved: 'Unsaved query',
//   group: 'Group',
//   editGroups: 'Edit Groups',
//   queryGroupSaveFailed: 'Failed to save. Try another name.',
//   addQueryGroup: 'Add group',
//   queryGroupName: 'Group name',
//   selectQueryGroup: 'Select group',
//   description: 'Description',

//   titleNotUnique: 'This name is already in use.',
//   duplicate: 'Duplicate',

//   query: 'Query',

//   baseTable: 'Base',

//   crossings: 'crossings',
//   batches: 'batches',
//   varieties: 'varieties',
//   trees: 'trees',
//   motherTrees: 'mother trees',
//   scionsBundles: 'scions bundles',

//   marks: 'marks',
//   Marks: 'Marks',

//   defaultFilter: 'Filter criteria',
//   batchFilter: 'Filter criteria to select the batches',
//   varietyFilter: 'Filter criteria to select the varieties',
//   treeFilter: 'Filter criteria to select the trees',
//   markFilter: 'Filter criteria to select the marks',

//   noFilter:
//     'No filter criteria defined. All {entity} will be selected. Click the plus button below to add filter criteria.',

//   simplifiable: 'Unnecessary complexity detected.',
//   simplify: 'Simplify filter',
//   invalid: 'Invalid filter rules. Rectify or delete them.',
//   valid: 'Congrats, all rules are valid.',

//   invalidNoResults:
//     'Invalid filter rules. Rectify or delete them to get results.',
//   results: 'Results',
//   addColumn: 'Add Column',
//   showRowsWithoutMarks: 'Show rows without marks',

//   debugShow: 'Show debug info',
//   debugHide: 'Hide debug info',

//   altPhoto: 'Photo taken {date} by {author}',
//   photo: 'Photo',
//   downloadPhoto: 'Download photo',

//   countSuffix: 'count',
//   maxSuffix: 'max',
//   minSuffix: 'min',
//   meanSuffix: 'mean',
//   medianSuffix: 'median',
//   stdDevSuffix: 'std. deviation',

//   yes: 'yes',
//   no: 'no',

//   download: 'Download',
// };
