export const entity = {
  commonColumns: {
    id: 'ID',
    name: 'Name',
    note: 'Notes',
    created: 'Created',
    modified: 'Updated',
    displayName: 'Name',
    explicitDisplayName: 'Display name',
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
    base: 'This is the {structuredName} (required). If you prefer a different name, you can override it with the {displayName} field below.',
    structuredName: 'structured breeding name',
    displayName: 'display name',
  },

  nameOverrideHint: {
    onNameSegment:
      'If you wish the system to show a different name, fill in the display name field below.',
    onNameOverride:
      'This is how the {entity} will be displayed. If not overridden, it will show the breeding name.',
  },

  autoFillNextSegment: 'Auto-fill',
  nameSegmentDataError:
    'Failed to load data. Auto-fill not available, limited validation only.',

  labelIdOmitZeros: 'You can omit leading zeros',

  picker: {
    inputMethod: 'Select {entity} by',
    scanQrCode: 'QR code',
    plantLabelId: 'Plant label ID',
    plantGroupLabelId: 'Group label ID',
    cultivarName: 'Cultivar name',
    lotName: 'Lot name',
  },
};
