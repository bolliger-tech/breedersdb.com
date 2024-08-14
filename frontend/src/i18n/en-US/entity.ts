export const entity = {
  commonColumns: {
    id: 'ID',
    name: 'Name',
    note: 'Notes',
    created: 'Created',
    modified: 'Last updated',
    displayName: 'Name',
    explicitDisplayName: 'Display name',
    nameOverride: 'Common name',
    nameSegment: 'Name segment',
    fullName: 'Breeding name',
    disabled: 'Disabled',
    dateDisabled: 'Date disabled',
  },

  add: 'Add new',
  search: 'Search list',
  searchPlaceholderName: 'Search by name',

  tabs: {
    active: 'Active',
    disabled: 'Disabled',
    all: 'All',
  },

  list: {
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    addColumn: 'Add Column',

    dataIsNotFresh:
      'Data may not be accurate because some filter rules are invalid.',
    noColumnError: 'No columns selected. Add a column to see data.',

    noData: 'No data.',
  },

  basics: 'Basics',
  noImages: 'No images available',
  failedToLoadImage: 'Failed to load image',
  noData: 'No data available',

  nameExplainerIntro: {
    base: 'This is the {structuredName} (required). If you prefer a different name, you can override it with a {freeFormName}.',
    structuredName: 'structured breeding name',
    freeFormName: 'free form display name',
  },
};
