<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="attributionForm"
      sprite-icon="form"
      :title="attributionForm.name"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <AttributionFormEntityTable :attribution-form="attributionForm" />

        <h3 class="q-my-md">{{ t('attributionForms.columns.fields') }}</h3>
        <AttributionFormPreview
          :disabled="attributionForm.disabled"
          :form-fields="formFields"
        />
      </template>

      <template #action-left>
        <AttributionFormButtonDelete
          v-if="!attributionForm.disabled"
          :attribution-form-id="attributionForm.id"
          @deleted="
            () =>
              $router.push({ path: '/attribution-forms', query: route.query })
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
import AttributionFormButtonDelete from 'src/components/AttributionForm/AttributionFormButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import type { AttributionFormFragment } from 'src/components/AttributionForm/attributionFormFragment';
import { attributionFormFragment } from 'src/components/AttributionForm/attributionFormFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import AttributionFormPreview from 'src/components/AttributionForm/AttributionFormPreview.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import AttributionFormEntityTable from 'src/components/AttributionForm/AttributionFormEntityTable.vue';

const props = defineProps<{ entityId: number | string }>();

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

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['attribution_forms'] },
});

const attributionForm = computed(
  () =>
    (data.value?.attribution_forms_by_pk ||
      null) as AttributionFormFragment | null,
);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/attribution-forms/${props.entityId}/edit`,
    query: route.query,
  });
}

const formFields = computed(() => {
  const fields = attributionForm.value?.attribution_form_fields || [];
  return fields.map((f) => ({ ...f, exceptional: false }));
});
</script>
