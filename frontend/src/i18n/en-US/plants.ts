export const plants = {
  title: 'Plant | Plants',

  searchPlaceholder: 'Search by label ID or cultivar name',

  fields: {
    labelId: 'Label ID',
    serialInPlantRow: 'Number in row',
    distancePlantRowStart: 'Offset',
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
  },

  eliminate: 'Eliminate',
  eliminateConfirmation: 'Are you sure you want to eliminate this plant?',
};
