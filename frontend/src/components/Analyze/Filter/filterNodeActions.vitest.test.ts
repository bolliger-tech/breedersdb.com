import { describe, expect, it } from 'vitest';
import { FilterConjunction, FilterNode, BaseTable } from './filterNode';
import { addLeaf, moveNode } from './filterNodeActions';
import { FilterRule } from './filterRule';

describe('addLeaf', () => {
  it('should attach child directly if no children', () => {
    const parent = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    });

    addLeaf(parent, FilterConjunction.Or);

    expect(parent.getChildrensConjunction()).toBe(FilterConjunction.Or);
    expect(parent.getChildCount()).toBe(1);
  });

  it('should attach child directly if one child but different conjunction', () => {
    const parent = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    });
    addLeaf(parent, FilterConjunction.And);

    addLeaf(parent, FilterConjunction.Or);

    expect(parent.getChildrensConjunction()).toBe(FilterConjunction.Or);
    expect(parent.getChildCount()).toBe(2);
  });

  it('should attach child directly if many children but same conjunction', () => {
    const parent = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    });
    addLeaf(parent, FilterConjunction.And);
    addLeaf(parent, FilterConjunction.And);

    addLeaf(parent, FilterConjunction.And);

    expect(parent.getChildrensConjunction()).toBe(FilterConjunction.And);
    expect(parent.getChildCount()).toBe(3);
  });

  it('should add intermediate node for existing children if many children but different conjunction', () => {
    const parent = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    });
    addLeaf(parent, FilterConjunction.And);
    addLeaf(parent, FilterConjunction.And);

    const leafsBefore = parent.getChildren();
    addLeaf(parent, FilterConjunction.Or);
    const intermediateNode = parent.getChildren()[0];

    expect(intermediateNode).toBeInstanceOf(FilterNode);

    expect(parent.getChildCount()).toBe(2);
    expect(parent.getChildrensConjunction()).toBe(FilterConjunction.Or);
    expect(intermediateNode!.getChildrensConjunction()).toBe(
      FilterConjunction.And,
    );
    expect(intermediateNode!.getChildCount()).toBe(2);
    expect(leafsBefore).toEqual(intermediateNode!.getChildren());
  });
});

describe('moveNode', () => {
  it('should throw if target is descendant of subject', () => {
    const root = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    });
    const child = FilterNode.FilterNode({
      childrensConjunction: FilterConjunction.And,
      parent: root,
    });
    const grandchild = FilterNode.FilterNode({
      childrensConjunction: FilterConjunction.And,
      parent: child,
    });

    expect(() => moveNode(child, grandchild, 'before')).toThrow(
      "Failed to move node. Target can't be descendant of subject.",
    );
  });

  it('should move subject before target', () => {
    const parent = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    });
    const target = FilterNode.FilterLeaf({
      parent,
      filterRule: new FilterRule(),
    });
    const subject = FilterNode.FilterLeaf({
      parent,
      filterRule: new FilterRule(),
    });

    moveNode(subject, target, 'before');

    expect(parent.getChildren()).toEqual([subject, target]);
  });

  it('should move subject after target', () => {
    const parent = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    });
    const subject = FilterNode.FilterLeaf({
      parent,
      filterRule: new FilterRule(),
    });
    const target = FilterNode.FilterLeaf({
      parent,
      filterRule: new FilterRule(),
    });

    moveNode(subject, target, 'after');

    expect(parent.getChildren()).toEqual([target, subject]);
  });

  it('should move subject to different branch', () => {
    const parent = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    });
    const node1 = FilterNode.FilterNode({
      childrensConjunction: FilterConjunction.And,
      parent,
    });
    const node2 = FilterNode.FilterNode({
      childrensConjunction: FilterConjunction.And,
      parent,
    });
    const target = FilterNode.FilterLeaf({
      parent: node1,
      filterRule: new FilterRule(),
    });
    const subject = FilterNode.FilterLeaf({
      parent: node2,
      filterRule: new FilterRule(),
    });

    moveNode(subject, target, 'after');

    expect(node1.getChildren()).toEqual([target, subject]);
    expect(node2.getChildren()).toEqual([]);
  });
});
