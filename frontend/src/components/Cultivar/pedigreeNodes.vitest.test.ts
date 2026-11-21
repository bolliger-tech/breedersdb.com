import { describe, it, expect } from 'vitest';
import { toPedigreeNodes } from './pedigreeNodes';

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
        label: 'Cultivar 1',
        lazy: false,
      },
      {
        key: 'root/father',
        parent: 'father',
        cultivarId: 2,
        label: 'Cultivar 2',
        lazy: false,
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
      label: '',
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

  it('sets the lazy flag only on parents whose crossing has parents', () => {
    const nodes = toPedigreeNodes(
      { mother_cultivar: cultivar(1, [3, null]), father_cultivar: cultivar(2) },
      'root',
    );
    expect(nodes[0]?.lazy).toBe(true);
    expect(nodes[1]?.lazy).toBe(false);

    const fatherOnly = toPedigreeNodes(
      { mother_cultivar: cultivar(1, [null, 4]), father_cultivar: null },
      'root',
    );
    expect(fatherOnly[0]?.lazy).toBe(true);
    expect(fatherOnly[1]?.lazy).toBeUndefined();
  });
});
