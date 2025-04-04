import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';

export function useAttributableEntityName({
  entityType,
}: {
  entityType: AttributableEntities;
}) {
  const { t } = useI18n();
  const entity = computed(() => {
    switch (entityType) {
      case AttributableEntities.Plant:
        return t('plants.title', 1);
      case AttributableEntities.PlantGroup:
        return t('plantGroups.title', 1);
      case AttributableEntities.Cultivar:
        return t('cultivars.title', 1);
      case AttributableEntities.Lot:
        return t('lots.title', 1);
    }
    // @ts-expect-error don't move into switch so ts complains if we add a new entity type
    throw new Error('Unknown entity type');
  });
  return { entity };
}
