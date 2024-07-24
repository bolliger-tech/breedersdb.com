export const attributes = {
  title: 'Attribute | Attributes',

  columns: {
    dataType: 'Data type',
    description: 'Description',
    attributeType: 'Attribute type',
    defaultValue: 'Default value',
    legend: 'Legend',
  },

  dataTypes: {
    text: 'Text',
    integer: 'Integer',
    float: 'Decimal',
    boolean: 'Boolean',
    date: 'Date',
    photo: 'Photo',
    rating: 'Rating',
  },

  attributeTypes: {
    observation: 'Observation',
    sample: 'Sample',
    treatment: 'Treatment',
    other: 'Other',
  },

  disableConfirmation:
    'Disabling will hide this attribute in existing forms and make it impossible to add it to forms. Do you really want to disable it?',
  deleteConfirmation:
    "This attribute wasn't used yet and will therefore be permanently deleted. Are you sure?",

  preview: 'Preview',

  min: 'Min',
  max: 'Max',
  step: 'Step',
};
