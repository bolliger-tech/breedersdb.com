export const attributes = {
  title: 'Attribut | Attribute',
  columns: {
    dataType: 'Datentyp',
    description: 'Beschreibung',
    attributeType: 'Attributtyp',
    defaultValue: 'Standardwert',
    legend: 'Legende',
  },
  dataTypes: {
    text: 'Text',
    integer: 'Ganzzahl',
    float: 'Dezimalzahl',
    boolean: 'Boolescher Wert',
    date: 'Datum',
    photo: 'Foto',
    rating: 'Bewertung',
  },
  attributeTypes: {
    observation: 'Beobachtung',
    sample: 'Muster',
    treatment: 'Behandlung',
    other: 'Sonstiges',
  },
  disableExplainer:
    'Wenn du dieses Attribut deaktivierst, wird es in bestehenden Formularen versteckt und du kannst es nicht mehr zu neuen Formularen hinzufügen.',
  disableConfirmation: 'Möchtest du es wirklich deaktivieren?',
  deleteConfirmation:
    'Dieses Attribut wurde noch nicht verwendet und wird daher dauerhaft gelöscht. Löschen?',
  preview: 'Vorschau',
  disabledPreviewMsg:
    'Dieses Attribut ist deaktiviert und kann nicht verwendet oder in der Vorschau angezeigt werden. Aktiviere es, um die Vorschau zu sehen.',
  min: 'Min',
  minLong: 'Minimalwert',
  max: 'Max',
  maxLong: 'Maximalwert',
  step: 'Schritt',
  stepExplainerFloat:
    'Die Präzision des Wertes. Zum Beispiel 0.1 ermöglicht die Werte 0.1, 0.2, 0.3 etc. 0.01 ermöglicht 0.01, 0.02, 0.03 etc.',
  stepExplainerInteger:
    'Der Abstand zwischen den Werten. Zum Beispiel erlaubt 2 die Werte 2, 4, 6, etc. (angenommen der Minimalwert sei 0).',
  noDefaultValue: '(kein Standardwert)',
  dataTypeChangeNotAllowed:
    'Da dieses Attribut bereits verwendet wurde, ist eine Änderung des Datentyps nicht mehr möglich. Lösche zuerst die Attributionen oder erstelle ein neues Attribut mit dem gewünschten Datentyp.',
  invalidRatingConfig:
    'Ungültige Konfiguration. Bitte überprüfe die Minimal- und Maximalwerte.',
};
