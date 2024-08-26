export const plantRows = {
  title: 'Row | Rows',

  fields: {
    orchard: 'Orchard',
    dateCreated: 'Date created',
    dateEliminated: 'Date disabled',
  },

  hints: {
    dateEliminatedTrue: 'Adding an disabled date will disable this row',
    dateEliminatedFalse: 'Removing the disabled date will enable this row',
  },

  disableConfirmation:
    'Disabling will make it impossible to add plants to this row. Do you really want to disable it?',
  deleteConfirmation:
    "This row doesn't have any plants and will therefore be permanently deleted. Are you sure?",
};
