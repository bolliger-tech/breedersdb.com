export const crossings = {
  title: 'Kreuzung | Kreuzungen',
  fields: {
    motherCultivar: 'Mutter-Cultivar',
    fatherCultivar: 'Vater-Cultivar',
  },
  nameExplainer:
    'Typischerweise setzt sich der Name aus den Kürzeln der Mutter und des Vaters zusammen. Die Einhaltung dieser Konvention verhindert zudem doppeltes Erfassen von Kreuzungen.',
  autoFillName: 'Auto-Ausfüllen',
  acronymsLoadError:
    'Cultivar-Daten konnten nicht geladen werden. Auto-Ausfüllen nicht verfügbar.',
  validation: {
    parentDescendsFromCrossing:
      'Dieses Cultivar stammt von dieser Kreuzung ab und kann darum nicht ihr Elternteil sein.',
  },
  hints: {
    readonlyCultivar:
      'Es beziehen sich Mutterpflanzen auf diese Kreuzung, dieser Wert kann darum nicht geändert werden.',
  },
};
