export const plantGroups = {
  title: 'Group | Groups',

  fields: {
    labelId: 'Label ID',
    cultivar: 'Cultivar',
  },

  labelIdAutoGenerated: 'Auto-generated',

  searchPlaceholderName: 'Search by name or label ID',

  disableConfirmation:
    'Disabling will make it impossible to add further plants or attributions to this group. Do you really want to disable it?',
  deleteConfirmation:
    "This group doesn't have any plants and will therefore be permanently deleted. Are you sure?",
  disableExplainer:
    'Disabling will make it impossible to add further plants or attributions to this group. Do you really want to disable it?',

  labelIdHint: 'Automatically generated. Cannot be changed.',

  validation: {
    nameNotUniqueWithCultivar:
      'This name is already in use for the selected cultivar.',
  },

  explainer: {
    examples: 'Examples:',
    1: {
      base: 'Follows the {pattern} {placeholder}, where {cultivar} is the cultivar name and {plantGroupPlaceholder} is an the plant group name. Allowed are letters, digits, hyphens and underscores, max. 25 characters.',
      pattern: 'pattern',
    },
    2: {
      base: '{hint}: Use a name that identifies the stage and, in case of multiple groups per cultivar, the location.',
      hint: 'Hint',
    },
  },

  errors: {
    labelIdinvalid: 'Invalid label ID',
    disabledNotAllowed: "Disabled plant groups can't be used here",
    labelIdNotFound: 'Plant group {labelId} not found',
  },

  autocreate: {
    fetchFailed: 'Failed to load plant groups',
    nothingFound:
      "No lot matched the search criteria. If you haven't created the lot yet, do it first.",
    noDot: 'Please be more specific. Keep typing…',
    create: 'Create',
    nextFree: '{num} is the next free number',
  },
};
