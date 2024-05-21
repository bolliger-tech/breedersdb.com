import { FilterNode, FilterConjunction } from './filterNode';
import { FilterRule } from './filterRule';

export default function useFilterNodeActions() {
  function addLeaf(parent: FilterNode, conjunction: FilterConjunction) {
    const rule = new FilterRule();

    if (parent.getChildCount() <= 1) {
      parent.setChildrensConjunction(conjunction);
    }

    if (parent.getChildrensConjunction() === conjunction) {
      const leaf = FilterNode.FilterLeaf({ parent, filterRule: rule });
      parent.appendChild(leaf);

      return;
    }

    const parentsConjunction = parent.getChildrensConjunction();
    if (!parentsConjunction) {
      throw Error(
        'Failed to add leaf: Missing childrensConjunction on parent node.',
      );
    }

    const leaf = FilterNode.FilterLeaf({ parent, filterRule: rule });
    const intermediateNode = FilterNode.FilterNode({
      childrensConjunction: parentsConjunction,
      parent,
    });

    intermediateNode.setChildren(parent.getChildren());
    parent.setChildren([intermediateNode, leaf]);
    parent.setChildrensConjunction(conjunction);

    return;
  }

  function moveNode(
    subject: FilterNode,
    target: FilterNode,
    position: 'before' | 'after',
  ) {
    if (target.isDescendantOf(subject)) {
      throw Error(
        "Failed to move node. Target can't be descendant of subject.",
      );
    }

    const targetParent = target.getParent();
    const subjectParent = subject.getParent();

    if (!targetParent || !subjectParent) {
      const what = !targetParent ? 'Target' : 'Subject';
      throw Error(`Failed to move node: ${what} node has no parent.`);
    }

    subject.remove();

    const targetParentsChildren = targetParent.getChildren();
    const targetIdx = targetParentsChildren.indexOf(target);
    const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;
    targetParentsChildren.splice(insertIdx, 0, subject);
    targetParent.setChildren(targetParentsChildren);
  }

  return {
    addLeaf,
    moveNode,
  };
}
