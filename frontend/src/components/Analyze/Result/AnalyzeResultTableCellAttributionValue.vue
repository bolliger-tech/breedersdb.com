<template>
  <AnalyzeResultTableCellAttribution
    :plant="!!attribution.plant_id"
    :plant-group="!!attribution.plant_group_id"
    :cultivar="!!attribution.cultivar_id"
    :lot="!!attribution.lot_id"
  >
    <template #label>
      <AttributionAttachmentLink
        v-if="attribution.data_type === 'ATTACHMENT' && attribution.text_value"
        :file-name="attribution.text_value"
        :attribute-name="attribution.attribute_name"
        :entity-name="getAttributedEntityName(attribution)"
        :date-attributed="attribution.date_attributed"
      />
      <template v-else>{{ n2semicolon(label) }}</template>
    </template>
    <template #[`overlay-title`]>
      <RouterLink :to="`/attributions/${attribution.id}`" class="entity-link">
        <p
          :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-8'"
          class="text-overline q-my-none"
        >
          {{ attribution.attribute_name }}
        </p>
        <h3 class="q-mt-none q-mb-md pre-line">{{ label }}</h3>
      </RouterLink>
    </template>
    <template #[`overlay-body`]>
      <AnalyzeResultTableCellAttributionOverlay :id="attribution.id" />
    </template>
  </AnalyzeResultTableCellAttribution>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { AnalyzeCachedAttributionsFields } from './filterToQuery';
import { useI18n } from 'src/composables/useI18n';
import {
  formatResultColumnValue,
  getAttributionValue,
  getAttributedEntityName,
} from 'src/utils/attributeUtils';
import { getAttachmentFileName } from 'src/utils/attachmentUtils';
import AttributionAttachmentLink from 'src/components/Attribution/AttributionAttachmentLink.vue';
import { ColumnTypes } from 'src/utils/columnTypes';
import AnalyzeResultTableCellAttributionOverlay from './AnalyzeResultTableCellAttributionOverlay.vue';
import AnalyzeResultTableCellAttribution from './AnalyzeResultTableCellAttribution.vue';
import { dataTypeToColumnTypes } from 'src/utils/attributeUtils';
import { n2semicolon } from 'src/utils/stringUtils';

export interface AnalyzeResultTableCellAttributionValueProps {
  attribution: AnalyzeCachedAttributionsFields;
}

const props = defineProps<AnalyzeResultTableCellAttributionValueProps>();

const { t, d, n } = useI18n();

const label = computed(() => {
  const type = dataTypeToColumnTypes(props.attribution.data_type);

  if (type === ColumnTypes.Photo) return t('analyze.result.photo');
  if (type === ColumnTypes.Attachment)
    return getAttachmentFileName({
      fileName: props.attribution.text_value ?? '',
      attributeName: props.attribution.attribute_name,
      entityName: getAttributedEntityName(props.attribution),
      dateAttributed: props.attribution.date_attributed,
    });

  const value = getAttributionValue(props.attribution);
  return formatResultColumnValue({ value, type, d, n });
});
</script>

<style lang="scss" scoped>
.entity-link {
  color: unset;
  text-decoration: none;

  &:hover,
  &:focus {
    color: var(--q-link-color-hover);
  }
}
</style>
