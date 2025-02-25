<template>
  <q-btn
    color="primary"
    class="full-width"
    flat
    @click="
      () => {
        formId = null;
        open = !open;
      }
    "
    >{{ t('analyze.result.addColumnsFromForm') }}</q-btn
  >
  <q-separator />

  <q-dialog v-model="open">
    <q-card style="width: clamp(310px, 90dvw, 600px); max-width: unset">
      <q-card-section>
        <h3 class="q-ma-none nowrap-elipsis">
          {{ t('analyze.result.addColumnsFromForm') }}
        </h3>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-none">
        <AttributionFormSelect
          v-model="formId"
          :loading="fetching"
          :hint="t('analyze.result.addColumnsFromFormHint')"
          @select="onSelect"
        />
        <BaseGraphqlError v-if="error" :error="error" />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          flat
          :label="t('base.cancel')"
          :disabled="fetching"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import AttributionFormSelect from 'src/components/AttributionForm/AttributionFormSelect.vue';
import { useI18n } from 'src/composables/useI18n';
import { ref, computed } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import { useQuasar } from 'quasar';

const visibleColumns = defineModel<string[]>('visibleColumns', {
  required: true,
});

const open = ref(false);
const formId = ref<number | null>(null);

const query = graphql(`
  query AttributionForms($formId: Int!) {
    attribution_forms_by_pk(id: $formId) {
      id
      attribution_form_fields(order_by: { priority: asc }) {
        attribute_id
      }
    }
  }
`);

const variables = computed(() => ({ formId: formId.value }));

const { error, fetching, executeQuery } = useQuery({
  query,
  context: { additionalTypenames: ['attribution_forms'] },
  requestPolicy: 'network-only', // so it can be unmounted right away
  variables,
  pause: true,
});

async function onSelect() {
  const { data } = await executeQuery();
  if (data.value?.attribution_forms_by_pk) {
    const columns =
      data.value.attribution_forms_by_pk.attribution_form_fields.map(
        (field) => `attributes.${field.attribute_id}`,
      );

    addColumns(columns);

    open.value = false;
  }
}

const $q = useQuasar();

function addColumns(columns: string[]) {
  const countBefore = visibleColumns.value.length;
  const newColumns = Array.from(new Set([...visibleColumns.value, ...columns]));
  const countAfter = newColumns.length;

  visibleColumns.value = newColumns;

  const added = countAfter - countBefore;
  if (added > 0) {
    $q.notify({
      message: t('analyze.result.columnsAdded', added),
      color: 'positive',
    });
  } else {
    $q.notify({
      message: t('analyze.result.columnsAlreadyAdded'),
      color: 'warning',
    });
  }
}

const { t } = useI18n();
</script>
