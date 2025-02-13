<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="attribute"
      sprite-icon="form"
      :title="attribute.name"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <EntityViewTable>
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
          <EntityViewTableRow
            :label="t('attributes.columns.defaultValue')"
            multiline
          >
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
          <EntityTableViewTimestampRows
            :created="attribute.created"
            :modified="attribute.modified"
          />
        </EntityViewTable>

        <h3 class="q-my-md">{{ t('attributes.preview') }}</h3>
        <AttributePreview :attribute="attribute" />
      </template>

      <template #action-left>
        <AttributeButtonDelete
          v-if="!attribute.disabled"
          :attribute-id="attribute.id"
          @deleted="
            () => router.push({ path: '/attributes', query: route.query })
          "
        />
        <div v-else></div>
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import AttributeButtonDelete from 'src/components/Attribute/AttributeButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import {
  AttributeFragment,
  attributeFragment,
} from 'src/components/Attribute/attributeFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import {
  dataTypeToLabel,
  attributeTypeToLabel,
  dataTypeToColumnTypes,
  formatResultColumnValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import AttributePreview from 'src/components/Attribute/AttributePreview.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Attribute($id: Int!) {
      attributes_by_pk(id: $id) {
        ...attributeFragment
      }
    }
  `,
  [attributeFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['attributes'] },
});

const attribute = computed(
  () => (data.value?.attributes_by_pk || null) as AttributeFragment | null,
);

const { t, d, n } = useI18n();

const defaultValue = computed(() => {
  const type =
    attribute.value && dataTypeToColumnTypes(attribute.value?.data_type);

  if (!type || type === ColumnTypes.Photo) {
    return '';
  }
  return formatResultColumnValue({
    value: attribute.value?.default_value,
    type,
    d,
    n,
  });
});

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/attributes/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
