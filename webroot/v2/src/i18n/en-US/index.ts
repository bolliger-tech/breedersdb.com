export default {
  marks: {
    title: 'Marks',

    selectForm: {
      title: 'Select Form',
      tab: 'Form',
    },

    setMeta: {
      title: 'Set Meta Data',
      tab: 'Meta',
      author: 'Author',
      authorHint: 'The name of the person who does the rating.',
      date: 'Date',
      dateHint: 'The date of the rating.'
    },

    selectTree: {
      title: 'Select Tree',
      tab: 'Tree',
      scanQrCode: 'scan QR-code',
      manualEntry: 'enter publicid'
    },

    markTree: {
      title: 'Mark Tree',
      tab: 'Mark',
      missingDataError: 'Missing data.',
      setMeta: 'Add meta data',
      selectTree: 'Select tree',
      selectForm: 'Select form',
      saved: 'Marks saved.',
      addProperty: 'Add property',
      selectProperty: 'Select Property',
      propertyAlreadyExists: 'Property {property} can not be added a second time.',
    },
  },


  trees: {
    publicid: 'Publicid'
  },


  queries: {
    title: 'Queries',

    query: 'Query',

    baseTable: 'Base',

    crossings: 'crossings',
    batches: 'batches',
    varieties: 'varieties',
    trees: 'trees',
    motherTrees: 'mother trees',
    scionsBundles: 'scions bundles',

    marks: 'marks',
    Marks: 'Marks',

    defaultFilter: 'Filter criteria',
    batchFilter: 'Filter criteria to select the batches',
    varietyFilter: 'Filter criteria to select the varieties',
    treeFilter: 'Filter criteria to select the trees',
    markFilter: 'Filter criteria to select the marks',

    noFilter: 'No filter criteria defined. All {entity} will be selected. Click the plus button below to add filter criteria.',

    simplifiable: 'Unnecessary complexity detected.',
    simplify: 'Simplify filter',

    filter: {
      column: 'Column',
      comparator: 'Comparator',
      criteria: 'Criteria',

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
      andFilter: 'and criteria',
      orFilter: 'or criteria',

      and: 'and',
      or: 'or',

      noResults: 'No results.',
    },

    results: 'Results',
  },

  general: {
    search: 'Search',
    loading: 'Loading...',
    retry: 'Retry',
    failedToLoadData: 'Failed to load data.',
    failedToSaveData: 'Failed to save data.',
    refreshList: 'Refresh list',
    next: 'Next',
    dismiss: 'Dismiss',
    navigation: 'Navigation',
    selected: 'selected',

    form: {
      required: 'Field is required',
      max255chars: 'Max. 255 characters allowed',
      save: 'Save',
    },
  },


  components: {
    util: {
      errorBanner: {
        dismiss: 'dismiss'
      },
      treeCard: {
        scanBtnLabel: 'Scan',
        tree: 'Tree',
        printBtnLabel: 'Print',
        printTitle: 'Print tree label',
        printDesc: 'Select regular to print a label with the publicid and the convar or anonymous to hide the convar.',
        printRegular: 'Regular',
        printAnonymous: 'Anonymous',
        windowError: 'Failed to open window for printing. Are you blocking popups?',
        noTree: 'Please Scan Tree'
      },
      codeScanner: {
        permissionRequest: 'Unable to access video stream. Please confirm permission request.',
        loadingMessage: '⌛ Loading video...',
      },
      list: {
        listMetaFiltered: 'Filtered list. Showing {showing} out of {total} items.',
        listMetaUnfiltered: '{total} items',
        nothingFound: 'Nothing found'
      }
    },
  },


  navigation: {
    markTrees: {
      title: 'Mark Trees',
      caption: 'Scan trees and rate them.'
    },
    trees: {
      title: 'Trees',
      caption: 'List of all trees.'
    },
    queries: {
      title: 'Queries',
      caption: 'Search the database.'
    },
  }
};
