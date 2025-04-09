<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ attribute.name }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('attributes.columns.dataType')">
      {{ dataTypeToLabel(attribute.data_type, t) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('attributes.minLong')">
      {{ attribute.validation_rule?.min }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('attributes.maxLong')">
      {{ attribute.validation_rule?.max }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('attributes.step')">
      {{ attribute.validation_rule?.step }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('attributes.columns.defaultValue')" multiline>
      <template v-if="defaultValue !== ''">
        {{ defaultValue }}
      </template>
      <span v-else class="text-body2 text-italic">{{
        t('base.notAvailable')
      }}</span>
    </EntityViewTableRow>
    <template v-if="attribute.data_type === 'RATING' && attribute.legend">
      <EntityViewTableRow
        v-for="(label, idx) in attribute.legend"
        :key="idx"
        :label="
          t('attributes.columns.legend') +
          ` ${idx + attribute.validation_rule.min}`
        "
      >
        {{ label }}
      </EntityViewTableRow>
    </template>
    <EntityViewTableRow
      v-if="attribute.description"
      :label="t('attributes.columns.description')"
      multiline
    >
      {{ attribute.description }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('attributes.columns.attributeType')">
      {{ attributeTypeToLabel(attribute.attribute_type, t) }}
    </EntityViewTableRow>
    <EntityViewTableMetaData
      :id="attribute.id"
      :created="attribute.created"
      :modified="attribute.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type AttributeFragment } from './attributeFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityViewTableMetaData from 'src/components/Entity/View/EntityViewTableMetaData.vue';
import {
  dataTypeToLabel,
  attributeTypeToLabel,
  dataTypeToColumnTypes,
  formatResultColumnValue,
} from 'src/utils/attributeUtils';
import { computed } from 'vue';
import { ColumnTypes } from 'src/utils/columnTypes';

export interface AttributeEntityTableProps {
  attribute: AttributeFragment;
  dense?: boolean | undefined;
}

const props = defineProps<AttributeEntityTableProps>();

const defaultValue = computed(() => {
  const type =
    props.attribute && dataTypeToColumnTypes(props.attribute.data_type);

  if (!type || type === ColumnTypes.Photo) {
    return '';
  }
  return formatResultColumnValue({
    value: props.attribute.default_value,
    type,
    d,
    n,
  });
});

const { t, d, n } = useI18n();
</script>
