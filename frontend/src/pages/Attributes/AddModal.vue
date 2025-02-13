<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <AttributeModalEdit
      v-if="attribute"
      :attribute="attribute"
      :title="t('base.new')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import AttributeModalEdit, {
  AttributeInsertInput,
} from 'src/components/Attribute/AttributeModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import {
  attributeFragment,
  type AttributeFragment,
} from 'src/components/Attribute/attributeFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import type { DistributiveOmit } from 'src/utils/typescriptUtils';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyAttribute: AttributeInsertInput = {
  name: '',
  validation_rule: null,
  data_type: 'TEXT',
  description: null,
  attribute_type: 'OBSERVATION',
  disabled: false,
  legend: null,
  default_value: null,
};

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

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: { additionalTypenames: ['plant_groups'] },
  pause: !props.templateId,
});

const attribute = computed(() => {
  if (props.templateId) {
    if (!data.value?.attributes_by_pk) {
      return;
    }
    return {
      ...emptyAttribute,
      validation_rule: data.value.attributes_by_pk.validation_rule,
      description: data.value.attributes_by_pk.description,
      data_type: data.value.attributes_by_pk.data_type,
      attribute_type: data.value.attributes_by_pk.attribute_type,
      disabled: data.value.attributes_by_pk.disabled,
      default_value: data.value.attributes_by_pk.default_value,
      legend: data.value.attributes_by_pk.legend,
    } as DistributiveOmit<AttributeFragment, 'id' | 'created' | 'modified'>;
  } else {
    return emptyAttribute;
  }
});

const { t } = useI18n();
</script>
