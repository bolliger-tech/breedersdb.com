import { graphql, type ResultOf } from 'src/graphql';

// The parent IDs of the next level tell whether a node can be expanded.
export const pedigreeCultivarFragment = graphql(`
  fragment pedigreeCultivarFragment on cultivars @_unmask {
    id
    display_name
    lot {
      crossing {
        mother_cultivar_id
        father_cultivar_id
      }
    }
  }
`);

type PedigreeCultivar = ResultOf<typeof pedigreeCultivarFragment>;

export type PedigreeCrossing = {
  mother_cultivar: PedigreeCultivar | null;
  father_cultivar: PedigreeCultivar | null;
};

export type PedigreeNode = {
  key: string;
  // undefined for the root node
  parent?: 'mother' | 'father';
  // null for an unknown parent
  cultivarId: number | null;
  label: string;
  lazy?: boolean;
  children?: PedigreeNode[];
};

export function toPedigreeNodes(
  crossing: PedigreeCrossing,
  parentKey: string,
): PedigreeNode[] {
  return [
    toPedigreeNode(crossing.mother_cultivar, 'mother', parentKey),
    toPedigreeNode(crossing.father_cultivar, 'father', parentKey),
  ];
}

function toPedigreeNode(
  cultivar: PedigreeCultivar | null,
  parent: 'mother' | 'father',
  parentKey: string,
): PedigreeNode {
  // Keyed by path, as a repeated ancestor (inbreeding) appears more than once.
  const key = `${parentKey}/${parent}`;

  if (!cultivar) {
    return { key, parent, cultivarId: null, label: '' };
  }

  const { mother_cultivar_id, father_cultivar_id } = cultivar.lot.crossing;
  return {
    key,
    parent,
    cultivarId: cultivar.id,
    label: cultivar.display_name,
    lazy: mother_cultivar_id !== null || father_cultivar_id !== null,
  };
}
