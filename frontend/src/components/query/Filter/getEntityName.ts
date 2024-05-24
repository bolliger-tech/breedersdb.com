import type { TFunc } from 'src/composables/useI18n';
import { BaseTable } from './queryTypes';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';

export function getEntityName({
  t,
  table,
  plural = false,
  capitalize = false,
}: {
  t: TFunc;
  table: BaseTable;
  plural?: boolean;
  capitalize?: boolean;
}) {
  const count = plural ? 2 : 1;
  let entityName = '';
  switch (table) {
    case BaseTable.Cultivars:
      entityName = t('filter.entityName.cultivar', count);
      break;
    case BaseTable.Crossings:
      entityName = t('filter.entityName.crossing', count);
      break;
    case BaseTable.Lots:
      entityName = t('filter.entityName.lot', count);
      break;
    case BaseTable.Trees:
      entityName = t('filter.entityName.tree', count);
      break;
    default:
      throw new Error(`Unknown table: ${table}`);
  }

  return capitalize ? uppercaseFirstLetter(entityName) : entityName;
}
