export const analyze = {
  title: false,
  header: {
    new: false,
    more: false,
    duplicate: false,
    showExplanation: false,
    hideExplanation: false,
    filter: false,
    addName: false,
    leaveConfirmation: false
  },
  filter: {
    attributionFilter: false,
    baseFilter: false,
    attribute: false,
    noFilter: false,
    simplifiable: false,
    simplify: false,
    invalid: false,
    valid: false,
    cultivarAndSubentities: false,
    explainer: {
      title: false,
      attributeWithNoAttributions: false,
      attribute: false,
      entity: false,
      invalidRule: false
    },
    error: {
      column: false,
      operator: false,
      term: false
    },
    column: false,
    operator: false,
    term: false,
    withNoAttributions: false,
    operators: {
      equals: false,
      notEquals: false,
      less: false,
      lessOrEqual: false,
      greater: false,
      greaterOrEqual: false,
      startsWith: false,
      startsNotWith: false,
      contains: false,
      notContains: false,
      endsWith: false,
      notEndsWith: false,
      empty: false,
      notEmpty: false,
      hasPhoto: false,
      isTrue: false,
      isFalse: false,
      add: false,
      andFilter: false,
      orFilter: false,
      and: false,
      or: false
    }
  },
  result: {
    title: false,
    aggregations: {
      count: false,
      max: false,
      min: false,
      mean: false,
      median: false,
      stdDev: false,
      theCount: false,
      theMax: false,
      theMin: false,
      theMean: false,
      theMedian: false,
      theStdDev: false
    },
    aggTitle: false,
    altPhoto: false,
    photo: false,
    downloadPhoto: false,
    lastRefresh: false
  }
};