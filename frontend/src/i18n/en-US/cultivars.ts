export const cultivars = {
  title: 'Cultivar | Cultivars',

  searchPlaceholder: {
    subset: 'Search {subset} by name, acronym or ID',
    all: 'Search by name, acronym or ID',
  },

  fields: {
    acronym: 'Acronym',
    breeder: 'Breeder',
    lot: 'Lot',
    isVariety: 'is variety',
    cultivarId: 'Cultivar ID',
  },

  acronymExplainer:
    'When creating a new crossing, the acronym is typically used as part of the crossings name. If an acronym is specified, it must be unique.',

  validation: {
    nameNotUniqueWithLot:
      'This name is already in use in combination with the selected lot',
    nameSegmentFormat:
      'Invalid format. Must be a three-digit number. Example: 012',
  },

  breedersCultivar: 'breeders cultivar | breeders cultivars',
  variety: 'variety | varieties',

  type: 'Type',

  nameOverrideHint: 'The common name',

  segmentNameHint: 'Format: three-digit number. Example: {example}',

  explainer: {
    examples: 'Examples:',
    1: {
      base: 'Follows the {pattern} {placeholder}, where {lot} is the lot name and {cultivarPlaceholder} is a three-digit number.',
      pattern: 'pattern',
    },
    2: {
      base: '{hint}: Use the auto-fill button.',
      hint: 'Hint',
    },
  },
};
