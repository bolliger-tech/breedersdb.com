<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <AttributionFormModalEdit
      v-if="attributionForm"
      :attribution-form="attributionForm"
      :title="t('base.new')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import AttributionFormModalEdit, {
  type AttributionFormInsertInput,
} from 'src/components/AttributionForm/AttributionFormModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import {
  attributionFormFragment,
  type AttributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyAttributionForm: AttributionFormInsertInput = {
  name: '',
  description: null,
  disabled: false,
  attribution_form_fields: [],
};

const query = graphql(
  `
    query AttributionForm($id: Int!) {
      attribution_forms_by_pk(id: $id) {
        ...attributionFormFragment
      }
    }
  `,
  [attributionFormFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: { additionalTypenames: ['attribution_forms'] },
  pause: !props.templateId,
});

const attributionForm = computed(() => {
  if (props.templateId) {
    if (!data.value?.attribution_forms_by_pk) {
      return;
    }
    const existing = data.value
      .attribution_forms_by_pk as AttributionFormFragment;
    return {
      ...emptyAttributionForm,
      description: existing.description,
      disabled: existing.disabled,
      attribution_form_fields: existing.attribution_form_fields,
    };
  } else {
    return emptyAttributionForm;
  }
});

const { t } = useI18n();
</script>
