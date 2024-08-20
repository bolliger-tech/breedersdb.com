export const plants = {
  title: 'Plant | Plants',

  searchPlaceholder: 'Search by label ID or cultivar name',
  selectSearchNoOption: 'Type to search by label ID',

  fields: {
    labelId: 'Label ID',
    cultivarName: 'Cultivar',
    groupName: 'Group',
    serialInPlantRow: 'Number in row',
    distancePlantRowStart: 'Distance to row start',
    dateGrafted: 'Date grafted',
    datePlanted: 'Date planted',
    dateEliminated: 'Date eliminated',
    dateLabeled: 'Date labeled',
    plantGroup: 'Group',
    plantRow: 'Row',
    grafting: 'Grafting',
    rootstock: 'Rootstock',
  },

  errors: {
    labelId:
      'Label ID can only be numbers (max 8 digits). If the plant was eliminated, the label ID must be prefixed with a #',
    distancePlantRowStart: 'Distance to row start must be a positive number',
    labelIdQueryError: 'Failed to check if label ID is unique',
    labelIdNextFree:
      'Label ID is already in use. Next free label ID is {labelId}',
    labelIdNotUnique:
      'Label ID is already in use. Next free label ID is unknown.',
    labelIdinvalid: 'Invalid label ID',
    eliminatedNotAllowed: "Eliminated plants can't be used here",
    labelIdNotFound: 'Plant {labelId} not found',
  },

  hints: {
    labelId:
      'Required. Number (max 8 digits). Prefixed with a # if plant was eliminated',
    labelIdOmitZeros: 'You can omit leading zeros',
    distancePlantRowStart: 'Meters',
    dateEliminatedTrue:
      'Adding an elimination date will disable this plant and prefix the label id with a #',
    dateEliminatedFalse:
      'Removing the elimination date will enable this plant and remove the # prefix from the label id',
  },

  eliminate: 'Eliminate',
  eliminateConfirmation:
    'Eliminating will move this plant to the list of disbled plants, it will make it impossible to add any further attributions and it will prefix the label id with a #. Are you sure you want to eliminate this plant?',

  scanQrCode: 'Scan QR code',
  enterLabelId: 'Enter label ID',

  plantSelect: 'Plant (label ID)',
};
