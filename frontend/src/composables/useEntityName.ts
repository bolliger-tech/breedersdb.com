import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import { useI18n } from './useI18n';
import { BaseTable } from 'src/components/Query/Filter/filterNode';

export function useEntityName() {
  const { t } = useI18n();

  function getEntityName({
    table,
    plural = false,
    capitalize = false,
  }: {
    table: BaseTable;
    plural?: boolean;
    capitalize?: boolean;
  }) {
    const count = plural ? 2 : 1;
    let entityName = '';
    switch (table) {
      case BaseTable.Cultivars:
        entityName = t('base.entityName.cultivar', count);
        break;
      case BaseTable.Lots:
        entityName = t('base.entityName.lot', count);
        break;
      case BaseTable.Plants:
        entityName = t('base.entityName.plant', count);
        break;
      case BaseTable.Attributions:
        entityName = t('base.entityName.attribution', count);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
    return capitalize ? uppercaseFirstLetter(entityName) : entityName;
  }

  return {
    getEntityName,
  };
}
