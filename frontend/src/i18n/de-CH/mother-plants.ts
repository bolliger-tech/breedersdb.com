export const motherPlants = {
  title: 'Mother Plant | Mother Plants',
  searchPlaceholder: 'Search by name, crossing name or plant label ID',
  fields: {
    dateImpregnated: 'Date impregnated',
    dateFruitsHarvested: 'Date fruits harvested',
    numbFlowers: 'Number of flowers',
    numbFruits: 'Number of fruits',
    numbSeeds: 'Number of seeds',
    plant: 'Plant',
    pollen: 'Pollen',
    crossing: 'Crossing'
  },
  hints: {
    crossing: 'Mother cultivar: {motherCultivar}, father cultivar: {fatherCultivar}',
    plantCultivar: 'Cultivar of the selected plant: {cultivar}',
    pollenCultivar: 'Cultivar of the selected pollen: {cultivar}'
  },
  crossingPlantCultivarMismatch: 'The cultivar of the selected plant ({plantCultivar}) does not match the mother cultivar of the crossing ({crossingMotherPlantCultivar}).',
  crossingPollenCultivarMismatch: 'The cultivar of the selected pollen ({pollenCultivar}) does not match the father cultivar of the crossing ({crossingFatherPlantCultivar}).'
};