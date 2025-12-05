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

  disableExplainer:
    'Disabling will hide this attribute in existing forms and make it impossible to add it to forms.',
  disableConfirmation: 'Do you really want to disable it?',
  deleteConfirmation:
    "This attribute wasn't used yet and will therefore be permanently deleted. Are you sure?",

  preview: 'Preview',
  disabledPreviewMsg:
    "This attribute is disabled and can't be used or previewed. Enable it to see the preview.",

  min: 'Min',
  minLong: 'Minimum value',
  max: 'Max',
  maxLong: 'Maximum value',
  step: 'Step',
  stepExplainerFloat:
    'The precision of the value. For example, 0.1 will allow 0.1, 0.2, 0.3, etc. 0.01, will allow 0.01, 0.02, 0.03, etc.',
  stepExplainerInteger:
    'The distance between the values. For example, 2 will allow 2, 4, 6, etc. (assuming the minimum value is 0).',

  noDefaultValue: '(no default value)',

  dataTypeChangeNotAllowed:
    'Because this attribute was already used for some attributions, changing the data type is not allowed. Either delete the attributions first or create a new attribute with the desired data type.',

  invalidRatingConfig:
    'Invalid rating configuration. Please check the attributes minimum and maximum value.',
};
