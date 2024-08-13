export const lots = {
  title: 'Lot | Lots',

  fields: {
    dateSowed: 'Date sowed',
    numbSeedsSowed: 'Number of seeds sowed',
    numbSeedlingsGrown: 'Number of seedlings grown',
    seedTray: 'Seed tray',
    datePlanted: 'Date planted',
    numbSeedlingsPlanted: 'Number of seedlings planted',
    plot: 'Plot',
    crossing: 'Crossing',
    orchard: 'Orchard',
  },

  validation: {
    invalidNameSegmentFormat:
      'The name must be two digits followed by a capital letter. Example: 24A. Hint: Use the year as the first two digits.',
    nameNotUniqueWithCrossing:
      'This name is already in use for the selected crossing',
    invalidNameOverrideFormat: 'Dots or newlines are not allowed.',
  },
};
