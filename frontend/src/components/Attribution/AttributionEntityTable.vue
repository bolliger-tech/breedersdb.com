<template>
  <div class="row bg-black rounded-borders justify-center q-mb-md">
    <EntityViewAttributionImage
      v-if="attribution.data_type === 'PHOTO' && attribution.text_value"
      :file-name="attribution.text_value"
      :attribution="attribution"
      preview
      :preview-size="imageSizes.h400"
    />
  </div>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('attributions.columns.value')" multiline>
      {{ getValue(attribution) }}
    </EntityViewTableRow>

    <EntityViewTableRow :label="t('attributes.title', 1)">
      <RouterLink
        :to="`/attributes/${attribution.attribute_id}`"
        class="undecorated-link"
      >
        {{ attribution.attribute_name }}
      </RouterLink>
    </EntityViewTableRow>

    <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
      {{ attribution.text_note }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="attribution.photo_note"
      :label="t('attributions.columns.photoNote')"
      render-empty
    >
      <EntityViewAttributionImage
        :file-name="attribution.photo_note"
        :attribution="attribution"
      />
    </EntityViewTableRow>

    <EntityViewTableRow :label="entityName" render-empty>
      <EntityLink :entity="attribution" />
    </EntityViewTableRow>

    <EntityViewTableRow
      v-if="attribution.plant && attribution.plant_group"
      :label="t('plantGroups.title', 1)"
      render-empty
    >
      <EntityLink :entity="{ plant_group: attribution.plant_group }" />
    </EntityViewTableRow>

    <EntityViewTableRow :label="t('attributions.columns.dateAttributed')">
      {{ d(attribution.date_attributed, 'Ymd') }}
    </EntityViewTableRow>

    <EntityViewTableRow :label="t('attributions.columns.author')">
      {{ attribution.author }}
    </EntityViewTableRow>

    <EntityViewTableRow
      :label="t('attributions.columns.exceptionalAttribution')"
    >
      {{ attribution.exceptional_attribution ? '✓' : '' }}
    </EntityViewTableRow>

    <EntityViewTableRow :label="t('attributionForms.title', 1)">
      <RouterLink
        v-if="attribution.attribution_form"
        :to="`/attribution-forms/${attribution.attribution_form.id}`"
        class="undecorated-link"
      >
        {{ attribution.attribution_form.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableMetaData
      v-if="attribution.created && attribution.modified"
      :id="attribution.id"
      :created="attribution.created"
      :modified="attribution.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { AttributionFormFragment } from 'src/components/AttributionForm/attributionFormFragment';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityViewTableMetaData from 'src/components/Entity/View/EntityViewTableMetaData.vue';
import {
  formatResultColumnValue,
  dataTypeToColumnTypes,
  getAttributionValue,
} from 'src/utils/attributeUtils';
import EntityViewAttributionImage from 'src/components/Entity/View/EntityViewAttributionImage.vue';
import EntityLink from 'src/components/Entity/EntityLink.vue';
import { ColumnTypes } from 'src/utils/columnTypes';
import { computed } from 'vue';
import { imageSizes } from 'src/utils/imageSizes';

export interface AttributionEntityTableProps {
  attribution: CachedAttributionsFragment & {
    attribution_form: AttributionFormFragment;
  };
  dense?: boolean | undefined;
}

const props = defineProps<AttributionEntityTableProps>();

const { t, d, n } = useI18n();

function getValue(row: NonNullable<typeof props.attribution>) {
  const type = dataTypeToColumnTypes(row.data_type);
  const value = getAttributionValue(row);

  if (type === ColumnTypes.Photo) {
    // photo is handled in the template
    return '';
  }

  return formatResultColumnValue({ value, type, d, n });
}

const entityName = computed(() => {
  if (props.attribution.plant) {
    return t('plants.title', 1);
  } else if (props.attribution.plant_group) {
    return t('plantGroups.title', 1);
  } else if (props.attribution.cultivar) {
    return t('cultivars.title', 1);
  } else if (props.attribution.lot) {
    return t('lots.title', 1);
  }

  throw new Error('Unknown entity type');
});
</script>
