export const attributions = {
  title: 'Attribution | Attributions',

  searchPlaceholder: {
    all: 'Search by attribute',
    plants: 'Search by attribute, label ID or group name',
    plantGroups: 'Search by attribute or group name',
    cultivars: 'Search by attribute or cultivar name',
    lots: 'Search by attribute or lot name',
  },

  exportPrefix: 'Attribution',
  columns: {
    exceptionalAttribution: 'Exceptional attribution',
    author: 'Author',
    dateAttributed: 'Date',
    value: 'Value',
    textNote: 'Note',
    textNoteLong: 'Note on value',
    photoNote: 'Photo',
    photoNoteLong: 'Photo on value',
    attributeName: 'Attribute',
    entity: 'Entity',
    entityType: 'Entity type',
    id: 'ID',
    attributedObjectType: 'Attributed object',
    attributedObjectName: 'Attributed object name',
    attributionFormId: 'Form ID',
    attributeId: 'Attribute ID',
    dateCreated: 'Created',
  },

  observations: 'Observations',
  treatments: 'Treatments',
  samples: 'Samples',
  others: 'Other attributions',

  photos: 'Photos',

  add: {
    attributeEntity: 'Attribute {entity}',

    form: 'Form',
    selectForm: 'Select form',
    addMeta: 'Meta data',

    setAuthor: 'Who collects the data?',
    setDate: 'When is/was the data collected?',

    repeat: 'Repeat',
    shouldRepeat:
      'Should the same object be attributed multiple times (statistical rating).',
    repeatCount: 'Number of attributions per object',
    repeatHint:
      'The number of times you aim to attribute the same object. Less is possible.',
    valueCount: '{count} attributions',

    selectEntity: 'Select {entity}',
    noEntitySelected: 'No {entity} selected.',
    noFormSelected: 'No form selected.',
    missingMetadata: 'Missing metadata.',
    addMetadata: 'Add metadata',

    alreadyAttributed:
      "You've already attributed this {entity} on this device with this form {timeAgo}.",

    counter: {
      description:
        "During the last 24h, you've added {count} marks with this form to this {entity} (target {total}).",
      reset: 'Reset counter',
      title: 'Count',
    },

    sameAgainWarning: 'This form contains this attribute multiple times.',

    notes: 'Notes',
    addTextNote: 'Add note',
    addPhotoNote: 'Add photo',

    invalidNumber:
      'Invalid number. Valid values are between {min} and {max} with a step of {step}.',
    invalidPhoto: 'Invalid or unsupported image.',
    invalidInput: 'Some inputs are invalid. Please check the form.',
    notCurrentYearMonth:
      'The selected date is outside the current year or month.',

    textPlaceholder: 'Enter some text…',
    numberPlaceholder: 'Enter a number…',

    clearAttribute:
      'Clearing this value will remove the comments for this attribute as well. Do you want to delete the comments?',
    notesMustHaveValue:
      'Add a value or remove the note / photo for this attribute.',

    saved: 'Attribution saved.',
    uploading: 'Saving… {percentage}%',

    noValues:
      'Nothing to save. Add some values or select a different {entity}.',
    changeEntity: 'Change {entity}',

    addAttribute: 'Add attribute',
  },

  noValueOnEdit: 'Please enter a value or delete the attribution.',
};
