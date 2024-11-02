export const cultivars = {
  title: 'Cultivar | Cultivare',
  searchPlaceholder: {
    subset: 'Suche {subset} nach Name oder Kürzel',
    all: 'Suche nach Name oder Kürzel'
  },
  fields: {
    acronym: 'Kürzel',
    breeder: 'Züchter/in',
    lot: 'Los'
  },
  validation: {
    nameNotUniqueWithLot: 'Dieser Name wird bereits verwendet (in Kombination mit dem ausgewählten Los)',
    nameSegmentFormat: 'Ungültiges Format. Muss eine dreistellige Zahl sein. Beispiel: 012'
  },
  breedersCultivar: 'Zuchtnummer | Zuchtnummern',
  variety: 'Sorte | Sorten',
  type: 'Typ',
  nameOverrideHint: 'Der gebräuchliche Name',
  segmentNameHint: 'Format: dreistellige Nummer. Beispiel: {example}',
  explainer: {
    examples: 'Beispiele:',
    1: {
      base: 'Folgt dem {pattern} {placeholder}, wobei {lot} der Name und {cultivarPlaceholder} eine dreistellige Zahl ist.',
      pattern: 'Format'
    },
    2: {
      base: '{hint}: Verwende den Auto-Ausfüllen-Button.',
      hint: 'Tipp'
    }
  }
};