export const analyze = {
  title: 'Analyze {entity}',
  header: {
    new: 'New Analysis',
    more: 'More',
    duplicate: 'Duplicate',
    showExplanation: 'Explain filters',
    hideExplanation: 'Hide explanations',
    filter: 'filter',
    addName: 'Save as …',
    leaveConfirmation: 'You have unsaved changes! Do you really want to leave?'
  },
  filter: {
    attributionFilter: 'Filter criteria to select the attributions (cell values)',
    baseFilter: 'Filter criteria to select the {entityName} (rows)',
    attribute: 'Attribute',
    noFilter: 'No filter defined. All {entity} will be shown. Click the plus button below to add some filter criteria.',
    simplifiable: 'Unnecessary complexity detected.',
    simplify: 'Simplify filter',
    invalid: 'Invalid filter rules. Rectify or delete them.',
    valid: 'Congrats, all rules are valid.',
    cultivarAndSubentities: 'cultivar, its groups or plants',
    explainer: {
      title: 'Explanation:',
      attributeWithNoAttributions: 'The {entity} have either no {column} attribution or at least one which satisfies: {column} {operator} {term}',
      attribute: 'The {entity} has at least one attribution which satisfies: {column} {operator} {term}',
      entity: 'The {entity} where {column} {operator} {term}',
      invalidRule: 'Invalid rule. Either complete, correct or delete it.'
    },
    error: {
      column: 'Please select a column.',
      operator: 'Please select a operator.',
      term: 'Please enter a valid term.'
    },
    column: 'Column',
    operator: 'Operator',
    term: 'Value',
    withNoAttributions: 'Include {entities} without {attributeName} attributions.',
    operators: {
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
      or: 'or'
    }
  },
  result: {
    title: 'Results',
    aggregations: {
      count: 'Count',
      max: 'Max',
      min: 'Min',
      mean: 'Mean',
      median: 'Median',
      stdDev: 'SD',
      theCount: 'the count',
      theMax: 'the max',
      theMin: 'the min',
      theMean: 'the mean',
      theMedian: 'the median',
      theStdDev: 'the standard deviation'
    },
    aggTitle: '{value} is {theAggregation} of:',
    altPhoto: 'Photo taken {date} by {author}',
    photo: 'Photo',
    downloadPhoto: 'Download photo',
    lastRefresh: 'Last data refresh: {date}'
  }
};