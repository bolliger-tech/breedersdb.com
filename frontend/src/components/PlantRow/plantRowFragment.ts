import { graphql, type FragmentOf } from 'src/graphql';

export type PlantRowFragment = FragmentOf<typeof plantRowFragment>;

export const plantRowFragment = graphql(`
  fragment plantRowFragment on plant_rows @_unmask {
    id
    name
    disabled
    date_eliminated
    orchard {
      id
      name
    }
    created
    modified
  }
`);
