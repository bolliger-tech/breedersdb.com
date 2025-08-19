export const entity = {
  commonColumns: {
    id: 'ID',
    name: 'Name',
    note: 'Bemerkungen',
    created: 'Erstellt',
    modified: 'Aktualisiert',
    displayName: 'Name',
    explicitDisplayName: 'Anzeigename',
    nameSegment: 'Namenssegment',
    fullName: 'Zuchtname',
    disabled: 'Deaktiviert',
    dateDisabled: 'Datum deaktiviert',
  },
  add: 'Hinzufügen',
  search: 'Liste durchsuchen',
  searchPlaceholderName: 'Nach Namen suchen',
  tabs: {
    active: 'Aktiv',
    disabled: 'Deaktiviert',
    all: 'Alle',
  },
  list: {
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild verlassen',
    addColumn: 'Spalte hinzufügen',
    dataIsNotFresh:
      'Daten sind möglicherweise nicht korrekt, da Filterregeln ungültig sind.',
    noColumnError:
      'Keine Spalten ausgewählt. Füge Spalten hinzu, um Daten zu sehen.',
    noData: 'Keine Daten.',
  },
  basics: 'Basisdaten',
  noImages: 'Keine Bilder vorhanden',
  failedToLoadImage: 'Fehler beim Laden des Bildes',
  noData: 'Keine Daten vorhanden',
  nameExplainerIntro: {
    base: 'Dies ist der {structuredName} (erforderlich). Wenn du einen anderen Namen bevorzugst, kannst du diesen mit dem Feld {displayName} überschreiben.',
    structuredName: 'strukturierter Zuchtname',
    displayName: 'Anzeigename',
  },
  nameOverrideHint: {
    onNameSegment:
      'Fülle unten das Feld Anzeigename aus, wenn du möchtest, dass das System einen anderen Namen anzeigt.',
    onNameOverride:
      'So wird die/das {entity} angezeigt. Wenn du dieses Feld nicht ausfüllst, wird der Zuchtname angezeigt.',
  },
  autoFillNextSegment: 'Auto-Ausfüllen',
  nameSegmentDataError:
    'Fehler beim Laden der Daten. Auto-Ausfüllen nicht verfügbar und nur begrenzte Validierung möglich.',
  labelIdOmitZeros: 'Du kannst führende Nullen weglassen',
  picker: {
    inputMethod: '{entity} auswählen mit',
    scanQrCode: 'QR-code',
    plantLabelId: 'Etiketten-ID (Pflanze)',
    plantGroupLabelId: 'Etiketten-ID (Gruppe)',
    plantGroupSelect: 'Gruppen-Name',
    cultivarName: 'Cultivar-Name',
    lotName: 'Los-Name',
  },
};
