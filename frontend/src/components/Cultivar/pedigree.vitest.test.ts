import { describe, it, expect } from 'vitest';
import {
  layoutPedigree,
  PEDIGREE_SLOT,
  toPedigreeNodes,
  type PedigreeTree,
} from './pedigree';

const cultivar = (
  id: number,
  parentIds: [number | null, number | null] = [null, null],
) => ({
  id,
  display_name: `Cultivar ${id}`,
  lot: {
    crossing: {
      mother_cultivar_id: parentIds[0],
      father_cultivar_id: parentIds[1],
    },
  },
});

describe('toPedigreeNodes', () => {
  it('maps both known parents', () => {
    const nodes = toPedigreeNodes(
      { mother_cultivar: cultivar(1), father_cultivar: cultivar(2) },
      'root',
    );
    expect(nodes).toEqual([
      {
        key: 'root/mother',
        parent: 'mother',
        cultivarId: 1,
        name: 'Cultivar 1',
        expandable: false,
      },
      {
        key: 'root/father',
        parent: 'father',
        cultivarId: 2,
        name: 'Cultivar 2',
        expandable: false,
      },
    ]);
  });

  it('maps one unknown parent', () => {
    const nodes = toPedigreeNodes(
      { mother_cultivar: null, father_cultivar: cultivar(2) },
      'root/mother',
    );
    expect(nodes[0]).toEqual({
      key: 'root/mother/mother',
      parent: 'mother',
      cultivarId: null,
      name: '',
      expandable: false,
    });
    expect(nodes[1]).toMatchObject({
      key: 'root/mother/father',
      cultivarId: 2,
    });
  });

  it('maps both unknown parents', () => {
    const nodes = toPedigreeNodes(
      { mother_cultivar: null, father_cultivar: null },
      'root',
    );
    expect(nodes.map((node) => node.cultivarId)).toEqual([null, null]);
  });

  it('makes only parents with at least one known parent expandable', () => {
    const nodes = toPedigreeNodes(
      { mother_cultivar: cultivar(1, [3, null]), father_cultivar: cultivar(2) },
      'root',
    );
    expect(nodes[0].expandable).toBe(true);
    expect(nodes[1].expandable).toBe(false);

    const fatherOnly = toPedigreeNodes(
      { mother_cultivar: cultivar(1, [null, 4]), father_cultivar: null },
      'root',
    );
    expect(fatherOnly[0].expandable).toBe(true);
    expect(fatherOnly[1].expandable).toBe(false);
  });
});

const leaf = (key: string): PedigreeTree => ({
  key,
  cultivarId: 1,
  name: key,
  expandable: true,
});

const withParents = (
  key: string,
  mother: PedigreeTree,
  father: PedigreeTree,
): PedigreeTree => ({ ...leaf(key), parents: [mother, father] });

describe('layoutPedigree', () => {
  it('lays out a single card', () => {
    expect(layoutPedigree(leaf('root'))).toEqual({
      height: PEDIGREE_SLOT,
      center: PEDIGREE_SLOT / 2,
    });
  });

  it('centers a card between its shown parents', () => {
    const tree = withParents(
      'root',
      withParents('m', leaf('mm'), leaf('mf')),
      withParents('f', leaf('fm'), leaf('ff')),
    );
    const layout = layoutPedigree(tree);

    expect(layout.height).toBe(4 * PEDIGREE_SLOT);
    expect(layout.center).toBe(2 * PEDIGREE_SLOT);
    expect(layout.parents?.[0]).toMatchObject({
      height: 2 * PEDIGREE_SLOT,
      center: PEDIGREE_SLOT,
    });
    expect(layout.parents?.[1]).toMatchObject({
      height: 2 * PEDIGREE_SLOT,
      center: PEDIGREE_SLOT,
    });
  });

  it('keeps a card at the midpoint of its parents if only one side is expanded', () => {
    const tree = withParents(
      'root',
      withParents('m', leaf('mm'), leaf('mf')),
      leaf('f'),
    );
    const layout = layoutPedigree(tree);
    const [mother, father] = layout.parents!;

    expect(layout.height).toBe(3 * PEDIGREE_SLOT);
    expect(mother.center).toBe(PEDIGREE_SLOT);
    // relative to the root's subtree
    const fatherCenter = mother.height + father.center;
    expect(fatherCenter).toBe(2.5 * PEDIGREE_SLOT);
    expect(layout.center).toBe((mother.center + fatherCenter) / 2);
    expect(layout.center).toBe(1.75 * PEDIGREE_SLOT);
  });
});
