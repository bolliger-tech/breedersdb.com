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
  name: string;
  // at least one of its parents is known
  expandable: boolean;
};

export type PedigreeTree = PedigreeNode & {
  // undefined until loaded
  parents?: [PedigreeTree, PedigreeTree];
  loading?: boolean;
};

export function hasKnownParent(crossing: {
  mother_cultivar_id: number | null;
  father_cultivar_id: number | null;
}) {
  return (
    crossing.mother_cultivar_id !== null || crossing.father_cultivar_id !== null
  );
}

export function toPedigreeNodes(
  crossing: PedigreeCrossing,
  parentKey: string,
): [PedigreeNode, PedigreeNode] {
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
    return { key, parent, cultivarId: null, name: '', expandable: false };
  }

  return {
    key,
    parent,
    cultivarId: cultivar.id,
    name: cultivar.display_name,
    expandable: hasKnownParent(cultivar.lot.crossing),
  };
}

export const PEDIGREE_CARD_HEIGHT = 36;
export const PEDIGREE_CARD_MARGIN = 4;
export const PEDIGREE_SLOT = PEDIGREE_CARD_HEIGHT + 2 * PEDIGREE_CARD_MARGIN;

export type PedigreeLayout = {
  height: number;
  // y of the card's center, relative to the top of the subtree
  center: number;
  parents?: [PedigreeLayout, PedigreeLayout];
};

// All cards have the same size, so the layout is computed, not measured.
// A card with shown parents is centered between their cards' centers, so
// every connector meets its card in the middle.
export function layoutPedigree(tree: PedigreeTree): PedigreeLayout {
  if (!tree.parents) {
    return { height: PEDIGREE_SLOT, center: PEDIGREE_SLOT / 2 };
  }

  const mother = layoutPedigree(tree.parents[0]);
  const father = layoutPedigree(tree.parents[1]);
  return {
    height: mother.height + father.height,
    center: (mother.center + mother.height + father.center) / 2,
    parents: [mother, father],
  };
}
