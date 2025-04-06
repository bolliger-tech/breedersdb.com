export const motherPlants = {
  title: 'Mutterpflanze | Mutterpflanzen',
  searchPlaceholder: 'Suche nach Name, Kreuzungsname oder Label-ID der Pflanze',
  fields: {
    dateImpregnated: 'Datum Befruchtung',
    dateFruitsHarvested: 'Erntedatum der Früchte',
    numbFlowers: 'Anzahl Blühten',
    numbFruits: 'Anzahl Früchte',
    numbSeeds: 'Anzahl Samen',
    plant: 'Pflanze',
    pollen: 'Pollen',
    crossing: 'Kreuzung',
  },
  hints: {
    crossing:
      'Mutter-Cultivar: {motherCultivar}, Vater-Cultivar: {fatherCultivar}',
    plantCultivar: 'Cultivar der ausgewählten Pflanze: {cultivar}',
    pollenCultivar: 'Cultivar der ausgewählten Pollen: {cultivar}',
  },
  crossingPlantCultivarMismatch:
    'Das Cultivar der ausgewählten Pflanze ({plantCultivar}) entspricht nicht dem Mutter-Cultivar der Kreuzung ({crossingMotherPlantCultivar}).',
  crossingPollenCultivarMismatch:
    'Das Cultivar der ausgewählten Pollen ({pollenCultivar}) entspricht nicht dem Vater-Cultivar der Kreuzung ({crossingFatherPlantCultivar}).',
};
