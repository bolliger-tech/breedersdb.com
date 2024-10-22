export const analyze = {
  title: "{entity} analysieren",
  header: {
    new: "Neue Analyse",
    more: "Mehr",
    duplicate: "Duplizieren",
    showExplanation: "Filter erklären",
    hideExplanation: "Erklärungen ausblenden",
    analysis: 'analysis',
    addName: "Speichern als …",
    leaveConfirmation: "Du hast ungespeicherte Änderungen! Möchtest du die Seite wirklich verlassen?"
  },
  filter: {
    attributionFilter: "Kriterien filtern, um die Attribute (Zellenwerte) auszuwählen",
    baseFilter: "Kriterien filtern, um die {entityName} (Zeilen) auszuwählen",
    attribute: "Attribut",
    noFilter: "Kein Filter definiert. Alle {entity} werden angezeigt. Klicke auf den Plus-Button, um Filterkriterien hinzuzufügen.",
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