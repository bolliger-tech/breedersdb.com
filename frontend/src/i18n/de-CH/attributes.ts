export const attributes = {
  title: 'Attribut | Attribute',
  columns: {
    dataType: 'Datentyp',
    description: 'Beschreibung',
    attributeType: 'Attributtyp',
    defaultValue: 'Standardwert',
    legend: 'Legende',
    cardinality: 'Wiederholung',
  },
  dataTypes: {
    text: 'Text',
    integer: 'Ganzzahl',
    float: 'Dezimalzahl',
    boolean: 'Boolescher Wert',
    date: 'Datum',
    photo: 'Foto',
    rating: 'Bewertung',
    enum: 'Auswahl',
  },
  attributeTypes: {
    observation: 'Beobachtung',
    sample: 'Muster',
    treatment: 'Behandlung',
    other: 'Sonstiges',
  },
  cardinalities: {
    repeatable: 'Wiederholbar',
    uniqueBlock: 'Nur einmal – blockieren',
    uniqueReplace: 'Nur einmal – ersetzen',
  },
  cardinalityHint:
    'Ob ein Objekt mehr als einen Wert dieses Attributs haben kann',
  cardinalityCaptions: {
    repeatable: 'Ein Objekt kann beliebig viele Werte haben.',
    uniqueBlock:
      'Höchstens ein Wert pro Objekt. Weitere Werte werden abgelehnt.',
    uniqueReplace:
      'Höchstens ein Wert pro Objekt. Ein neuer Wert ersetzt den bestehenden (inklusive seiner Bemerkungen).',
  },
  enumOptions: {
    label: 'Optionen',
    addOption: 'Option hinzufügen',
    optionPlaceholder: 'Option',
    preSelected: 'Vorausgewählt',
    disabled: 'Deaktiviert',
    disabledExplainer:
      'Deaktivierte Optionen können für neue Attributionen nicht ausgewählt werden, bleiben aber bei bestehenden erhalten.',
    deleteUsedNotAllowed:
      'Diese Option wird verwendet und kann nicht gelöscht werden. Deaktiviere sie stattdessen, um sie für neue Auswahlen auszublenden.',
    noOptions: 'Füge mindestens eine Option hinzu.',
    duplicateLabel: 'Optionsbezeichnungen müssen eindeutig sein.',
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
  cardinalityChangeNotAllowed:
    'Dieses Attribut kann nicht auf nur einmal beschränkt werden: {count} Objekt hat mehr als einen Wert davon. Entferne zuerst die Duplikate. | Dieses Attribut kann nicht auf nur einmal beschränkt werden: {count} Objekte haben mehr als einen Wert davon. Entferne zuerst die Duplikate.',
  invalidRatingConfig:
    'Ungültige Konfiguration. Bitte überprüfe die Minimal- und Maximalwerte.',
};
