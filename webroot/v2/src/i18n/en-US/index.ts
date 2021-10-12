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
    }
  }
};
