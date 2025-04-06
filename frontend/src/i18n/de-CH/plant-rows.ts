export const plantRows = {
  title: 'Zeile | Zeilen',
  fields: {
    orchard: 'Standort',
    dateCreated: 'Erstellungsdatum',
    dateEliminated: 'Deaktivierungsdatum',
  },
  hints: {
    dateEliminatedTrue:
      'Das Hinzufügen eines Deaktivierungsdatums wird diese Zeile deaktivieren',
    dateEliminatedFalse:
      'Entfernen des Deaktivierungsdatums aktiviert diese Zeile',
  },
  disableConfirmation:
    'Wenn du diese Zeile deaktivierst, kann du keine Pflanzen mehr zu dieser Zeile hinzufügen. Wirklich deaktivieren?',
  deleteConfirmation:
    'Diese Zeile hat keine Pflanzen und wird daher dauerhaft gelöscht. Löschen?',
  eliminatedPlants: 'Eliminierte Pflanzen',
  activePlants: 'Aktive Pflanzen',
};
