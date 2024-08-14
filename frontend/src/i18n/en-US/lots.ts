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

  segmentNameHint:
    'Format: two-digit number followed by an uppercase letter. Example: {example}',

  explainer: {
    examples: 'Examples:',
    1: {
      base: 'Follows the {pattern} {placeholder}, where {crossing} is the crossing name and {lotPlaceholder} is a two-digit number followed by an uppercase letter.',
      pattern: 'pattern',
    },
    2: {
      base: '{hint}: Use the current year as digits and ascending letters for lots of the same cross.',
      hint: 'Hint',
    },
    3: {
      base: 'Can be any {freeFormText} up to 25 characters.',
      freeFormText: 'free form text',
    },
  },

  autoGenerate: 'Auto-generate',
  nameSegmentDataError:
    'Failed to load data. Auto-generate not available, limited validation only.',
};
