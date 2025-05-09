export const plantGroups = {
  title: 'Gruppe | Gruppen',
  fields: {
    labelId: 'Etiketten-ID',
    cultivar: 'Cultivar',
  },
  labelIdAutoGenerated: 'Automatisch generiert',
  searchPlaceholderName: 'Suche nach Name oder Etiketten-ID',
  disableConfirmation:
    'Disabling will make it impossible to add plants to this group. Do you really want to disable it?',
  deleteConfirmation:
    'Diese Gruppe hat keine Pflanzen und wird daher dauerhaft gelöscht. Löschen?',
  disableExplainer:
    'Wenn du diese Gruppe deaktivierst, kann du keine Pflanzen oder Attributierungen mehr zu dieser Gruppe hinzufügen. Wirklich deaktivieren?',
  labelIdHint: 'Automatisch generiert. Kann nicht geändert werden.',
  validation: {
    nameNotUniqueWithCultivar:
      'Dieser Name wird bereits verwendet (in Kombination mit dem ausgewählten Cultivar).',
  },
  explainer: {
    examples: 'Beispiele:',
    1: {
      base: 'Folgt dem {pattern} {placeholder}, wobei {cultivar} der Name des Cultivars und {plantGroupPlaceholder} der Name der Gruppe ist. Erlaubt sind Buchstaben, Ziffern, Bindestriche und Unterstriche, maximal 25 Zeichen.',
      pattern: 'Format',
    },
    2: {
      base: '{hint}: Verwende einen Namen, der die Zuchtstufe und, im Falle von mehreren Gruppen pro Cultivar, den Standort identifiziert.',
      hint: 'Tipp',
    },
  },
  errors: {
    labelIdinvalid: 'Ungültige Etiketten-ID',
    disabledNotAllowed:
      'Deaktivierte Gruppen können hier nicht verwendet werden',
    labelIdNotFound: 'Die Gruppe {labelId} wurde nicht gefunden',
  },
  autocreate: {
    fetchFailed: 'Fehler beim Laden der Gruppen',
    nothingFound:
      'Kein passendes Los gefunden. Erstelle zuerst das Los, falls dieses noch nicht existiert.',
    noDot: 'Zuwenig spezifisch. Bitte weiter ausfüllen…',
    create: 'Erstellen',
    nextFree: '{num} ist die nächste freie Nummer',
  },
};
