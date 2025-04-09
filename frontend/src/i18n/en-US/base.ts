export const base = {
  loading: 'Loading...',
  suspenseWithError: {
    reload: 'Reload page',
    title: 'Error',
  },

  entityName: {
    crossing: 'crossing | crossings',
    lot: 'lot | lots',
    cultivar: 'cultivar | cultivars',
    plant: 'plant | plants',
    plantGroup: 'group | groups',
    attribution: 'attribution | attributions',
    orchard: 'orchard | orchards',
    rootstock: 'rootstock | rootstocks',
    grafting: 'grafting | graftings',
    plantRow: 'row | rows',
    pollen: 'pollen | pollen',
    motherPlant: 'mother plant | mother plants',
  },

  timespan: {
    second: 'second | seconds',
    minute: 'minute | minutes',
    hour: 'hour | hours',
    day: 'day | days',
    never: 'never',
    error: 'Failed to parse date',
  },

  show: 'Show',
  download: 'Download',
  close: 'Close',
  delete: 'Delete',
  disable: 'Disable',
  edit: 'Edit',
  new: 'New',
  save: 'Save',
  saveThenPrint: 'Save & Print',
  saveThenNewFromTemplate: 'Save & New Copy',
  saveThenPrintThenNewFromTemplate: 'Save, Print & New Copy',
  cancel: 'Cancel',
  ok: 'OK',
  continue: 'Continue',
  back: 'Back',
  rename: 'Rename',
  export: 'Export',
  print: 'Print',

  error: 'Error',
  required: 'Required',
  savedButPrintingFailed: 'Successfully saved data, but failed to print label.',
  detailsInConsole: 'See console for details.',

  validation: {
    xIsRequired: '{x} is required',
    invalidFields:
      'Invalid form fields. Please check the form fields for errors and try again.',
    maxLen: 'The maximum length is {x}.',
    min: 'The minimum value is {x}.',
    max: 'The maximum value is {x}.',
    integer: 'Must be an integer.',
    integerBetween:
      'Must be an integer between {min} and {max} with a step of {step}.',
    dateBetween: 'Must be a date between {min} and {max}.',
    nameNotUnique: 'This name is already in use.',
    xMustBeGreaterThanZero: '{x} must be greater than zero.',
    noNewLinesMaxLength:
      'Invalid characters or length. No new lines allowed. It must be between 1 and {max} characters long.',
    noSpecialCharsMaxLength:
      'Invalid characters or length. Allowed are only numbers and letters, hyphens and underscores (no spaces or special characters). It must be between 1 and {max} characters long.',
    noDotsOrNewLines: 'Dots and line breaks are not allowed.',
  },

  noResults: 'No results',
  noData: 'No data',

  qr: {
    title: 'QR scanner',
    permissionRequest: 'Failed to access camera. Please allow camera use.',
    permissionHintMac:
      'On MacOS: Make sure the browser is allowed camera access in "System Settings" -> "Privacy & Security" -> "Camera".',
    loading: 'Loading QR code scanner…',
    enablePermanently: 'Enable permanently',
    permanantlyEnableCameraOnIOS: 'Enable camera permanently on iOS',
  },

  notAvailable: 'N/A',
  deleteConfirmation: 'Are you sure you want to delete this {entity}?',
  disableConfirmation: 'Are you sure you want to disable this {entity}?',

  locales: {
    'en-US': 'English',
    'de-CH': 'Deutsch',
  },

  yes: 'yes',
  no: 'no',

  networkError: {
    title: 'Network error',
    message: 'Are you connected to the internet?',
  },

  wip: {
    title: 'Just planted, still growing…',
    message: 'This feature will soon be available.',
  },
};
