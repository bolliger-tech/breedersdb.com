export const lots = {
  title: 'Los | Lose',
  fields: {
    dateSowed: 'Datum Aussaat',
    numbSeedsSowed: 'Anzahl ausgesähter Samen',
    numbSeedlingsGrown: 'Anzahl gesprossener Sämlinge',
    seedTray: 'Saatschale',
    datePlanted: 'Pflanzdatum',
    numbSeedlingsPlanted: 'Anzahl gepflanzter Sämlinge',
    plot: 'Beet',
    crossing: 'Kreuzung',
    orchard: 'Standort',
    lotId: 'Los-ID',
  },
  validation: {
    invalidNameSegmentFormat:
      'Der Name muss aus zwei Ziffern bestehen, gefolgt von einem Grossbuchstaben. Beispiel: 24A. Tipp: Nimm die Jahrzahl für die ersten zwei Ziffern.',
    nameNotUniqueWithCrossing:
      'Dieser Name wird bereits für verwendet (in Kombination mit der ausgewählten Kreuzung). Nächster freier Name: {name}',
  },
  segmentNameHint:
    'Format: zweistellige Nummer gefolgt von einem Grossbuchstaben. Beispiel: {example}',
  explainer: {
    examples: 'Beispiele:',
    1: {
      base: 'Folgt dem {pattern} {placeholder}, wobei {crossing} der Kreuzungsname und {lotPlaceholder} eine zweistellige Zahl ist, gefolgt von einem Grossbuchstaben.',
      pattern: 'Format',
    },
    2: {
      base: '{hint}: Verwende die aktuelle Jahrzahl als Ziffern und fortlaufende Buchstaben für Lose der gleichen Kreuzung.',
      hint: 'Tipp',
    },
  },
};
