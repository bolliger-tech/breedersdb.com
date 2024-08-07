import { graphql, type FragmentOf } from 'src/graphql';
import { plantFragment } from '../Plant/plantFragment';
import { pollenFragment } from '../Pollen/pollenFragment';
import { crossingFragment } from '../Crossing/crossingFragment';

export type MotherPlantFragment = FragmentOf<typeof motherPlantFragment>;

export const motherPlantFragment = graphql(
  `
    fragment motherPlantFragment on mother_plants @_unmask {
      id
      name
      date_impregnated
      date_fruits_harvested
      numb_flowers
      numb_fruits
      numb_seeds
      note
      created
      modified
      plant_id
      plant @include(if: $withPlant) {
        ...plantFragment
      }
      pollen_id
      pollen @include(if: $withPollen) {
        ...pollenFragment
      }
      crossing_id
      crossing @include(if: $withCrossing) {
        ...crossingFragment
      }
    }
  `,
  [plantFragment, pollenFragment, crossingFragment],
);
