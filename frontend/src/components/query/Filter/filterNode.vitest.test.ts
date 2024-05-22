import { describe, expect, it } from 'vitest';
import { FilterConjunction, FilterNode, FilterType } from './filterNode';
import {
  FilterRule,
  FilterRuleType,
  type FilterRuleTypeSchema,
} from './filterRule';
import { FilterRuleColumn } from './filterRuleColumn';
import { FilterOperatorValue, FilterRuleOperator } from './filterRuleOperator';
import { FilterRuleTerm } from './filterRuleTerm';

describe('FilterNode', () => {
  describe('constructor', () => {
    it('should construct a FilterRoot', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });

      expect(root.getId()).toBeGreaterThanOrEqual(0);
      expect(root.getFilterType()).toBe(FilterType.Base);
      expect(root.getLevel()).toBe(0);
      expect(root.getParent()).toBeNull();
      expect(root.getChildren()).toEqual([]);
      expect(root.getChildCount()).toBe(0);
      expect(root.hasChildren()).toBe(false);
      expect(root.getChildrensConjunction()).toBe(FilterConjunction.And);
      expect(root.getFilterRule()).toBeNull();
      expect(root.isRoot()).toBe(true);
      expect(root.isLeaf()).toBe(false);
      expect(root.isOnlyChild()).toBe(false);
      expect(root.isValid()).toBe(true);
      expect(root.isDescendantOf(root)).toBe(false);
      expect(root.isSimplifiable()).toBe(false);
    });

    it('should construct a FilterNode', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });

      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });

      expect(node.getId()).toBeGreaterThan(root.getId());
      expect(node.getFilterType()).toBe(root.getFilterType());
      expect(node.getLevel()).toBe(1);
      expect(node.getParent()).toBe(root);
      expect(node.getChildren()).toEqual([]);
      expect(node.getParent()?.getChildren()).toEqual([node]);
      expect(node.getChildCount()).toBe(0);
      expect(node.getParent()?.getChildCount()).toBe(1);
      expect(node.hasChildren()).toBe(false);
      expect(node.getParent()?.hasChildren()).toBe(true);
      expect(node.getChildrensConjunction()).toBe(FilterConjunction.And);
      expect(node.getFilterRule()).toBeNull();
      expect(node.isRoot()).toBe(false);
      expect(node.isLeaf()).toBe(false);
      expect(node.isOnlyChild()).toBe(true);
      expect(node.isValid()).toBe(true);
      expect(node.isDescendantOf(root)).toBe(true);
      expect(node.isSimplifiable()).toBe(true);
      expect(node.getParent()?.isSimplifiable()).toBe(true);
    });

    it('should construct a FilterLeaf', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const rule = new FilterRule();

      const leaf = FilterNode.FilterLeaf({
        parent: node,
        filterRule: rule,
      });

      expect(leaf.getId()).toBeGreaterThan(node.getId());
      expect(leaf.getFilterType()).toBe(leaf.getFilterType());
      expect(leaf.getLevel()).toBe(2);
      expect(leaf.getParent()).toBe(node);
      expect(leaf.getChildren()).toEqual([]);
      expect(leaf.getParent()?.getChildren()).toEqual([leaf]);
      expect(leaf.getChildCount()).toBe(0);
      expect(leaf.getParent()?.getChildCount()).toBe(1);
      expect(leaf.hasChildren()).toBe(false);
      expect(leaf.getParent()?.hasChildren()).toBe(true);
      expect(leaf.getChildrensConjunction()).toBeNull();
      expect(leaf.getFilterRule()).toBe(rule);
      expect(leaf.isRoot()).toBe(false);
      expect(leaf.isLeaf()).toBe(true);
      expect(leaf.isOnlyChild()).toBe(true);
      expect(leaf.isValid()).toBe(false);
      expect(leaf.isDescendantOf(root)).toBe(true);
      expect(leaf.isDescendantOf(node)).toBe(true);
      expect(leaf.isSimplifiable()).toBe(true);
      expect(leaf.getParent()?.isSimplifiable()).toBe(true);
    });
  });

  describe('setParent', () => {
    it('should remove the parent if null', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });

      node.setParent(null);

      expect(node.getParent()).toBeNull();
      expect(node.getLevel()).toBe(0);
      expect(root.getChildren()).toEqual([]);
    });

    it('should correctly attach new parent', () => {
      const root1 = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const root2 = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root1,
        childrensConjunction: FilterConjunction.And,
      });

      node.setParent(root2);

      expect(node.getParent()).toBe(root2);
      expect(node.getLevel()).toBe(1);
      expect(root2.getChildren()).toEqual([node]);
      expect(root2.getChildCount()).toBe(1);
      expect(root1.getChildren()).toEqual([]);
      expect(root1.getChildCount()).toBe(0);
    });

    it('should correctly set the level', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node1 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const node2 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });

      node2.setParent(node1);

      expect(node2.getLevel()).toBe(2);
    });
  });

  describe('setChildren', () => {
    it('should attach children', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf = FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });

      root.setChildren([leaf]);

      expect(root.getChildren()).toEqual([leaf]);
      expect(root.getChildCount()).toBe(1);
      expect(root.hasChildren()).toBe(true);

      expect(leaf.getParent()).toBe(root);

      expect(node.getChildren()).toEqual([]);
      expect(node.getChildCount()).toBe(0);
      expect(node.hasChildren()).toBe(false);
    });
  });

  describe('appendChild', () => {
    it('should append a child', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf = FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });

      root.appendChild(leaf);

      expect(root.getChildren()).toEqual([node, leaf]);
      expect(root.getChildCount()).toBe(2);
      expect(root.hasChildren()).toBe(true);

      expect(leaf.getParent()).toBe(root);

      expect(node.getChildren()).toEqual([]);
      expect(node.getChildCount()).toBe(0);
      expect(node.hasChildren()).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should be valid if all leafs are valid', () => {
      const schema: FilterRuleTypeSchema = {
        type: FilterRuleType.String,
        allowEmpty: true,
        validation: { maxLen: null, pattern: null },
      };
      const validRule = new FilterRule();
      validRule.column = new FilterRuleColumn({
        tableName: 'table',
        tableColumnName: 'column',
        tableLabel: 'Table',
        tableColumnLabel: 'Column',
        schema,
      });
      validRule.operator = new FilterRuleOperator({
        label: 'Equal',
        value: FilterOperatorValue.Equal,
        suitableRuleTypes: [FilterRuleType.String],
        schema,
      });
      validRule.term = new FilterRuleTerm({ value: 'value', schema });

      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: root,
        filterRule: validRule,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: validRule,
      });

      expect(root.isValid()).toBe(true);
    });

    it('should be invalid if any leafs are invalid', () => {
      const schema: FilterRuleTypeSchema = {
        type: FilterRuleType.String,
        allowEmpty: false,
        validation: { maxLen: null, pattern: null },
      };
      const validRule = new FilterRule();
      validRule.column = new FilterRuleColumn({
        tableName: 'table',
        tableColumnName: 'column',
        tableLabel: 'Table',
        tableColumnLabel: 'Column',
        schema,
      });
      validRule.operator = new FilterRuleOperator({
        label: 'Equal',
        value: FilterOperatorValue.Equal,
        suitableRuleTypes: [FilterRuleType.String],
        schema,
      });
      validRule.term = new FilterRuleTerm({ value: 'value', schema });
      const invalidRule = Object.assign({}, validRule);
      invalidRule.term = new FilterRuleTerm({ value: '', schema });

      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: root,
        filterRule: validRule,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: invalidRule,
      });

      expect(root.isValid()).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove the node from the parent', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });

      node.remove();

      expect(node.getParent()).toBeNull();
      expect(root.getChildren()).toEqual([]);
      expect(root.getChildCount()).toBe(0);
    });

    it('should remove dangling intermediate nodes', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf = FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });

      leaf.remove();

      expect(leaf.getParent()).toBeNull();

      expect(node.getParent()).toBeNull();

      expect(root.getChildren()).toEqual([]);
      expect(root.getChildCount()).toBe(0);
    });
  });

  describe('isDescendantOf', () => {
    it('should return true if the node is a direct descendant', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });

      expect(node.isDescendantOf(root)).toBe(true);
    });

    it('should return true if the node is a distant descendant', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf = FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });

      expect(leaf.isDescendantOf(root)).toBe(true);
    });

    it('should return false if the node is from a different branch', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node1 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf1 = FilterNode.FilterLeaf({
        parent: node1,
        filterRule: new FilterRule(),
      });
      const node2 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });

      expect(leaf1.isDescendantOf(node2)).toBe(false);
    });

    it('should return false for itself', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });

      expect(root.isDescendantOf(root)).toBe(false);
    });
  });

  describe('isSimplifiable', () => {
    it("should return false if it's the root", () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });

      expect(root.isSimplifiable()).toBe(false);
    });

    it('should return false if it has only one child', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: root,
        filterRule: new FilterRule(),
      });

      expect(root.isSimplifiable()).toBe(false);
    });

    it('should return true if the child is unnecessarily nested', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });

      expect(root.isSimplifiable()).toBe(true);
    });

    it('should return true if all nested children have the same conjunction operator', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: root,
        filterRule: new FilterRule(),
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });

      expect(root.isSimplifiable()).toBe(true);
    });

    it('should return false if nested children have different conjunction operator', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: root,
        filterRule: new FilterRule(),
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.Or,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });

      expect(root.isSimplifiable()).toBe(false);
    });

    it('should return false if parent has different conjunction operator', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.Or,
      });
      const node1 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const node2 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: node1,
        filterRule: new FilterRule(),
      });
      FilterNode.FilterLeaf({
        parent: node1,
        filterRule: new FilterRule(),
      });
      FilterNode.FilterLeaf({
        parent: node2,
        filterRule: new FilterRule(),
      });
      FilterNode.FilterLeaf({
        parent: node2,
        filterRule: new FilterRule(),
      });

      expect(root.isSimplifiable()).toBe(false);
    });
  });

  describe('simplify', () => {
    it('should remove unnecessary intermediate nodes', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf = FilterNode.FilterLeaf({
        parent: node,
        filterRule: new FilterRule(),
      });

      root.simplify();

      expect(root.getChildren()).toEqual([leaf]);
    });

    it('should remove unnecessary intermediate nodes recursively', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node1 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const node2 = FilterNode.FilterNode({
        parent: node1,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf = FilterNode.FilterLeaf({
        parent: node2,
        filterRule: new FilterRule(),
      });

      root.simplify();

      expect(root.getChildren()).toEqual([leaf]);
    });

    it('should merge children with the same conjunction operator', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node1 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf1 = FilterNode.FilterLeaf({
        parent: node1,
        filterRule: new FilterRule(),
      });
      const node2 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf2 = FilterNode.FilterLeaf({
        parent: node2,
        filterRule: new FilterRule(),
      });

      root.simplify();

      expect(root.getChildren()).toEqual([leaf1, leaf2]);
    });

    it('should merge children with different conjunction operators if only child', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.Or,
      });
      const node1 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.Or,
      });
      const leaf1 = FilterNode.FilterLeaf({
        parent: node1,
        filterRule: new FilterRule(),
      });
      const node2 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf2 = FilterNode.FilterLeaf({
        parent: node2,
        filterRule: new FilterRule(),
      });

      root.simplify();

      expect(root.getChildren()).toEqual([leaf1, leaf2]);
    });

    it('should not merge children with different conjunction operators if multiple children', () => {
      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const leaf1 = FilterNode.FilterLeaf({
        parent: root,
        filterRule: new FilterRule(),
      });
      const node1 = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.Or,
      });
      const leaf2 = FilterNode.FilterLeaf({
        parent: node1,
        filterRule: new FilterRule(),
      });
      const leaf3 = FilterNode.FilterLeaf({
        parent: node1,
        filterRule: new FilterRule(),
      });

      root.simplify();

      expect(root.getChildren()).toEqual([leaf1, node1]);
      expect(node1.getChildren()).toEqual([leaf2, leaf3]);
    });
  });

  describe('toJSON', () => {
    it('should serialize the tree to JSON', () => {
      const schema: FilterRuleTypeSchema = {
        type: FilterRuleType.String,
        allowEmpty: true,
        validation: { maxLen: 55, pattern: '[a-z]+' },
      };
      const baseTableRule = new FilterRule();
      baseTableRule.column = new FilterRuleColumn({
        tableName: 'table',
        tableColumnName: 'column',
        tableLabel: 'Table',
        tableColumnLabel: 'Column',
        schema,
      });
      baseTableRule.operator = new FilterRuleOperator({
        label: 'Equal',
        value: FilterOperatorValue.Equal,
        suitableRuleTypes: [FilterRuleType.String],
        schema,
      });
      baseTableRule.term = new FilterRuleTerm({ value: 'value', schema });
      const attributionRule = new FilterRule();
      attributionRule.column = new FilterRuleColumn({
        tableName: 'attributes',
        tableColumnName: 'column',
        tableLabel: 'Attributes',
        tableColumnLabel: 'Column',
        schema,
      });
      attributionRule.operator = new FilterRuleOperator({
        label: 'Equal',
        value: FilterOperatorValue.Equal,
        suitableRuleTypes: [FilterRuleType.String],
        schema,
      });
      attributionRule.term = new FilterRuleTerm({ value: 'value', schema });
      const emptyRule = new FilterRule();

      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: baseTableRule,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: attributionRule,
      });
      FilterNode.FilterLeaf({
        parent: root,
        filterRule: emptyRule,
      });

      const json = JSON.stringify(root);

      expect(JSON.parse(json)).toEqual({
        children: [
          {
            children: [
              {
                filterRule: {
                  column: {
                    tableName: 'table',
                    tableColumnName: 'column',
                    tableLabel: 'Table',
                    tableColumnLabel: 'Column',
                  },
                  operator: {
                    label: 'Equal',
                    value: FilterOperatorValue.Equal,
                    suitableRuleTypes: [FilterRuleType.String],
                  },
                  term: {
                    value: 'value',
                  },
                },
              },
              {
                filterRule: {
                  column: {
                    tableName: 'attributes',
                    tableColumnName: 'column',
                    tableLabel: 'Attributes',
                    tableColumnLabel: 'Column',
                  },
                  operator: {
                    label: 'Equal',
                    value: FilterOperatorValue.Equal,
                    suitableRuleTypes: [FilterRuleType.String],
                  },
                  term: {
                    value: 'value',
                  },
                  includeEntitiesWithoutAttributions: false,
                },
              },
            ],
            childrensConjunction: FilterConjunction.And,
          },
          {
            filterRule: {},
          },
        ],
        childrensConjunction: FilterConjunction.And,
        filterType: FilterType.Base,
      });
    });
  });

  describe('fromJSON', () => {
    it('should construct the tree from JSON', () => {
      const schema: FilterRuleTypeSchema = {
        type: FilterRuleType.String,
        allowEmpty: true,
        validation: { maxLen: 55, pattern: '[a-z]+' },
      };
      const baseTableRule = new FilterRule();
      baseTableRule.column = new FilterRuleColumn({
        tableName: 'table',
        tableColumnName: 'column',
        tableLabel: 'Table',
        tableColumnLabel: 'Column',
        schema,
      });
      baseTableRule.operator = new FilterRuleOperator({
        label: 'Equal',
        value: FilterOperatorValue.Equal,
        suitableRuleTypes: [FilterRuleType.String],
        schema,
      });
      baseTableRule.term = new FilterRuleTerm({ value: 'value', schema });
      const attributionRule = new FilterRule();
      attributionRule.column = new FilterRuleColumn({
        tableName: 'attributes',
        tableColumnName: 'column',
        tableLabel: 'Attributes',
        tableColumnLabel: 'Column',
        schema,
      });
      attributionRule.operator = new FilterRuleOperator({
        label: 'Equal',
        value: FilterOperatorValue.Equal,
        suitableRuleTypes: [FilterRuleType.String],
        schema,
      });
      attributionRule.term = new FilterRuleTerm({ value: 'value', schema });
      const emptyRule = new FilterRule();

      const root = FilterNode.FilterRoot({
        filterType: FilterType.Base,
        childrensConjunction: FilterConjunction.And,
      });
      const node = FilterNode.FilterNode({
        parent: root,
        childrensConjunction: FilterConjunction.And,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: baseTableRule,
      });
      FilterNode.FilterLeaf({
        parent: node,
        filterRule: attributionRule,
      });
      FilterNode.FilterLeaf({
        parent: root,
        filterRule: emptyRule,
      });

      // @ts-expect-error nextId is private
      FilterNode.nextId = root.getId() - 1;

      const json = JSON.stringify(root);
      const deserialized = FilterNode.FromJSON(json, null, [
        baseTableRule.column,
        attributionRule.column,
      ]);

      expect(deserialized).toEqual(root);
    });
  });
});
