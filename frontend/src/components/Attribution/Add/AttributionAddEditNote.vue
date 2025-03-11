<template>
  <q-banner class="bg-warning q-mb-md">
    <template #avatar>
      <q-icon name="info" />
    </template>
    {{ t('attributions.add.editNote.info') }}
    <template #action>
      <EntityButtonDelete
        size="sm"
        :label="t('attributions.add.editNote.delete')"
        :message="
          t('base.deleteConfirmation', {
            entity: t('base.entityName.attribution'),
          })
        "
        :error="error"
        :fetching="deleting"
        @delete="deleteAttribution"
        @reset-errors="error = undefined"
      />
      <q-btn
        color="primary"
        size="sm"
        flat
        :label="t('attributions.add.editNote.cancel')"
        @click="$emit('cancel')"
      />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { graphql } from 'src/graphql';
import { useMutation } from '@urql/vue';
import { useQuasar } from 'quasar';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';

export interface AttributionAddEditNoteProps {
  attributionId: number;
}

const props = defineProps<AttributionAddEditNoteProps>();

const emit = defineEmits<{
  cancel: [];
  deleted: [];
}>();

const mutation = graphql(`
  mutation DeleteAttribution($id: Int!) {
    delete_attribution_values(where: { attribution_id: { _eq: $id } }) {
      affected_rows
    }
    delete_attributions_by_pk(id: $id) {
      id
    }
  }
`);

const { fetching: deleting, error, ...urql } = useMutation(mutation);

const $q = useQuasar();

async function deleteAttribution() {
  await urql.executeMutation(
    { id: props.attributionId },
    {
      additionalTypenames: [
        'attributions',
        'attribution_values',
        'attributions_view',
      ],
    },
  );

  $q.notify({
    type: 'positive',
    message: t('attributions.add.editNote.deleted'),
    color: 'positive',
    timeout: 3000,
    position: 'top',
  });

  emit('deleted');
}

const { t } = useI18n();
</script>
