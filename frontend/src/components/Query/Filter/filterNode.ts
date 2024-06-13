import { FilterRule, type FilterRuleJson } from './filterRule';
import type { FilterRuleColumn } from './filterRuleColumn';

export enum FilterConjunction {
  And = 'and',
  Or = 'or',
}

export enum BaseTable {
  Lots = 'lots',
  Cultivars = 'cultivars',
  Plants = 'plants',
  Attributions = 'attributions',
}

type FilterNodeJson = {
  children?: FilterNodeJson[];
  childrensConjunction?: FilterConjunction | null;
  filterRule?: FilterRuleJson | null;
  baseTable?: BaseTable;
};

export class FilterNode {
  private readonly id: number;
  private level = 0;
  private parent: FilterNode | null = null;
  private children: FilterNode[] = [];
  private childrensConjunction: FilterConjunction | null;
  private readonly baseTable: BaseTable;
  private filterRule: FilterRule | null;
  private readonly root: FilterNode;
  private static nextId = 0;

  private constructor({
    baseTable,
    parent,
    childrensConjunction,
    filterRule,
    root,
  }: {
    baseTable: BaseTable;
    parent: FilterNode | null;
    childrensConjunction: FilterConjunction | null;
    filterRule: FilterRule | null;
    root: FilterNode | null;
  }) {
    this.id = ++FilterNode.nextId;
    this.setParent(parent);

    this.root = root || this;

    this.baseTable = baseTable;
    this.childrensConjunction = childrensConjunction;
    this.filterRule = filterRule;
  }

  static FilterRoot({
    childrensConjunction,
    baseTable,
  }: {
    childrensConjunction: FilterConjunction;
    baseTable: BaseTable;
  }) {
    return new FilterNode({
      baseTable,
      parent: null,
      childrensConjunction,
      filterRule: null,
      root: null,
    });
  }

  static FilterNode({
    childrensConjunction,
    parent,
  }: {
    childrensConjunction: FilterConjunction;
    parent: FilterNode;
  }) {
    return new FilterNode({
      baseTable: parent.baseTable,
      parent,
      childrensConjunction,
      filterRule: null,
      root: parent.root,
    });
  }

  static FilterLeaf({
    parent,
    filterRule,
  }: {
    parent: FilterNode;
    filterRule: FilterRule;
  }) {
    return new FilterNode({
      baseTable: parent.baseTable,
      parent,
      childrensConjunction: null,
      filterRule,
      root: parent.root,
    });
  }

  getId() {
    return this.id;
  }

  getBaseTable() {
    return this.baseTable;
  }

  getLevel() {
    return this.level;
  }

  private setLevel(level: number | null = null) {
    if (null !== level) {
      this.level = level;
    } else if (this.isRoot()) {
      this.level = 0;
    } else {
      const parent = this.getParent();
      this.level = parent ? parent.level + 1 : 0;
    }

    this.children.forEach((child) => child.setLevel(this.level + 1));
  }

  getParent(): FilterNode | null {
    return this.parent;
  }

  setParent(parent: FilterNode | null) {
    if (this.parent) {
      // remove this node from the old parent
      this.parent.setChildren(
        this.parent.getChildren().filter((child) => child !== this),
      );
    }

    if (null === parent) {
      this.parent = null;
      this.setLevel(0);
      return;
    }

    this.parent = parent;
    this.setLevel(parent.getLevel() + 1);
    if (!this.parent.getChildren().find((child) => child === this)) {
      // attach this node to the new parent
      this.parent.appendChild(this);
    }
  }

  getChildren() {
    return this.children;
  }

  getChildCount() {
    return this.children.length;
  }

  hasChildren() {
    return this.getChildCount() > 0;
  }

  setChildren(children: FilterNode[]) {
    if (this.isLeaf()) {
      throw Error(
        'Can not add children to filter leaf. Delete FilterRule first.',
      );
    }

    this.children = children;
    this.children.forEach((child) => {
      if (child.getParent() !== this) child.setParent(this);
    });
  }

  appendChild(child: FilterNode) {
    const children = this.getChildren();
    children.push(child);
    this.setChildren(children);
  }

  getChildrensConjunction() {
    return this.childrensConjunction;
  }

  setChildrensConjunction(conjunction: FilterConjunction) {
    this.childrensConjunction = conjunction;
  }

  getFilterRule() {
    return this.filterRule;
  }

  setFilterRule(filterRule: FilterRule) {
    if (this.hasChildren()) {
      throw Error(
        'Can not set filter rule on non leaf node. Remove children first.',
      );
    }

    this.filterRule = filterRule;
  }

  isRoot() {
    return null === this.parent;
  }

  isLeaf() {
    return null !== this.filterRule;
  }

  isOnlyChild() {
    return this.getParent()?.getChildCount() === 1;
  }

  isValid() {
    if (this.isLeaf()) {
      return this.getFilterRule()?.isValid || false;
    }

    for (const child of this.getChildren()) {
      if (!child.isValid()) {
        return false;
      }
    }

    return true;
  }

  remove() {
    if (this.isRoot()) {
      throw Error('Can not remove root node.');
    }

    const parent = this.getParent();

    if (!parent) {
      throw Error('Can not remove node. Parent node not found.');
    }

    // remove this node
    parent.setChildren(parent.getChildren().filter((child) => child !== this));

    this.setParent(null);

    // remove parent node, if it isn't the root and
    // hasn't any children anymore
    if (!parent.isRoot() && !parent.hasChildren()) {
      parent.remove();
    }
  }

  isDescendantOf(candidate: FilterNode): boolean {
    const parent = this.getParent();
    if (!parent) {
      return false;
    }

    if (parent === candidate) {
      return true;
    }

    return parent.isDescendantOf(candidate);
  }

  isSimplifiable() {
    if (this.mergeableIntoParent()) {
      return true;
    }

    for (const child of this.getChildren()) {
      if (child.isSimplifiable()) {
        return true;
      }
    }

    return false;
  }

  simplify() {
    for (const child of this.getChildren()) {
      if (child.isSimplifiable()) {
        child.simplify();
      }
    }

    if (this.mergeableIntoParent()) {
      this.mergeIntoParent();
    }
  }

  private mergeableIntoParent() {
    return this.hasSameConjunctionAsParent() || this.isMergeableOnlyChild();
  }

  private hasSameConjunctionAsParent() {
    return (
      this.getChildrensConjunction() ===
      this.getParent()?.getChildrensConjunction()
    );
  }

  private isMergeableOnlyChild() {
    return (
      !this.isRoot() &&
      this.isOnlyChild() &&
      ((this.isLeaf() && !this.getParent()?.isRoot()) || // mergeOnlyChildIntoGrandParent
        !this.isLeaf()) // mergeOnlyChildsChildrenIntoParent
    );
  }

  private mergeIntoParentWithSameConjunction() {
    const parent = this.getParent();

    if (!parent) {
      throw Error(
        "Can not merge node with it's parent, as it hasn't got a parent.",
      );
    }

    const conjunction = this.getChildrensConjunction();

    if (this.isOnlyChild() && conjunction) {
      parent.setChildrensConjunction(conjunction);
    }

    const parentsChildren = parent.getChildren();
    const nodeIdx = parentsChildren.indexOf(this);

    if (nodeIdx === -1) {
      parentsChildren.push(...this.getChildren());
    } else {
      parentsChildren.splice(nodeIdx, 1, ...this.getChildren());
      parent.setChildren(parentsChildren);
    }
  }

  private mergeIntoParent() {
    if (this.hasSameConjunctionAsParent()) {
      this.mergeIntoParentWithSameConjunction();
    } else if (this.isMergeableOnlyChild()) {
      if (!this.isLeaf()) {
        this.mergeOnlyChildsChildrenIntoParent();
      } else {
        this.mergeOnlyChildIntoGrandParent();
      }
    }
  }

  private mergeOnlyChildsChildrenIntoParent() {
    if (!this.isOnlyChild() || this.isLeaf() || this.isRoot()) {
      throw Error(
        "Can not merge only child's children into parent: Invalid only child.",
      );
    }

    const parent = this.getParent();
    if (!parent) {
      throw Error(
        "Can not merge only child's children into parent as there is no parent.",
      );
    }

    const conjunction = this.getChildrensConjunction();
    if (!conjunction) {
      throw Error(
        "Can not merge only child's children into parent as only child is missing the childrensConjunction.",
      );
    }

    parent.setChildren(this.getChildren());
    parent.setChildrensConjunction(conjunction);
  }

  private mergeOnlyChildIntoGrandParent() {
    if (!this.isOnlyChild() || !this.isLeaf() || this.isRoot()) {
      throw Error(
        'Can not merge only child into grand parent: Invalid only child.',
      );
    }

    const parent = this.getParent();
    const grandParent = parent?.getParent();
    if (!parent || !grandParent) {
      throw Error(
        'Can not merge only child into grand parent as there is no grand parent.',
      );
    }

    const gradParentsChildren = grandParent.getChildren();
    const parentIdx = gradParentsChildren.indexOf(parent);

    gradParentsChildren.splice(parentIdx, 1, this);
    grandParent.setChildren(gradParentsChildren);
  }

  toJSON(): FilterNodeJson {
    return {
      ...(!this.isLeaf()
        ? { children: this.getChildren() as unknown as FilterNodeJson[] }
        : {}),
      ...(!this.isLeaf()
        ? { childrensConjunction: this.getChildrensConjunction() }
        : {}),
      ...(this.isLeaf() ? { filterRule: this.getFilterRule() } : {}),
      ...(this.isRoot() ? { baseTable: this.getBaseTable() } : {}),
    };
  }

  static FromJSON(
    json: string | FilterNodeJson,
    parent: FilterNode | null = null,
    columns: FilterRuleColumn[],
  ) {
    const data: FilterNodeJson =
      'string' === typeof json ? JSON.parse(json) : json;

    // Leaf
    if (parent && typeof data.filterRule !== 'undefined') {
      if (!data.filterRule) {
        throw Error(
          'Failed to deserialize FilterNodeJSON: Missing filterRule on leaf node.',
        );
      }
      const filterRule = FilterRule.FromJSON(data.filterRule, columns);

      return FilterNode.FilterLeaf({
        parent,
        filterRule,
      });
    }

    if (!data.childrensConjunction) {
      throw Error(
        'Failed to deserialize FilterNodeJSON: Missing childrensConjunction.',
      );
    }
    if (!data.children) {
      throw Error(
        'Failed to deserialize FilterNodeJSON: Missing children on non-leaf node.',
      );
    }

    let node: FilterNode;

    if (parent) {
      // Node
      node = FilterNode.FilterNode({
        childrensConjunction: data.childrensConjunction,
        parent,
      });
    } else {
      // Root
      if (!data.baseTable) {
        throw Error(
          'Failed to deserialize FilterNodeJSON: Missing baseTable on root node.',
        );
      }
      node = FilterNode.FilterRoot({
        childrensConjunction: data.childrensConjunction,
        baseTable: data.baseTable,
      });
    }

    data.children.forEach((child) => {
      FilterNode.FromJSON(child, node, columns);
    });

    return node;
  }
}
