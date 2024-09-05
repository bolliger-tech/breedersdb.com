<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="attributionForm"
    sprite-icon="form"
    :title="attributionForm.name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow :label="t('entity.commonColumns.name')">
          {{ attributionForm.name }}
        </EntityViewTableRow>
        <EntityViewTableRow v-if="attributionForm.description">
          <strong>{{ t('attributionForms.columns.description') }}</strong>
          <br />
          <span style="white-space: pre-line">{{
            attributionForm.description
          }}</span>
        </EntityViewTableRow>
        <EntityTableViewTimestampRows
          :created="attributionForm.created"
          :modified="attributionForm.modified"
        />
      </EntityViewTable>

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
          () => router.push({ path: '/attribution-forms', query: route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalContent>

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import AttributionFormButtonDelete from 'src/components/AttributionForm/AttributionFormButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import {
  AttributionFormFragment,
  attributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import AttributionFormPreview from 'src/components/AttributionForm/AttributionFormPreview.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

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
});

const attributionForm = computed(
  () =>
    (data.value?.attribution_forms_by_pk ||
      null) as AttributionFormFragment | null,
);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/attribution-forms/${props.entityId}/edit`,
    query: route.query,
  });
}

const formFields = computed(() => {
  const fields = (attributionForm.value?.attribution_form_fields ||
    []) as AttributionFormFragment['attribution_form_fields'];
  return fields.map((f) => ({ ...f, exceptional: false }));
});
</script>
