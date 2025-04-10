<template>
  <q-btn
    flat
    :label="t('plants.eliminate')"
    color="negative"
    @click="confirm = true"
  />

  <q-dialog v-model="confirm">
    <q-card>
      <q-card-section>
        <BaseMessage
          type="warning"
          icon-size="xl"
          :message="t('plants.eliminateConfirmation')"
        />
      </q-card-section>

      <template v-if="error">
        <q-separator />
        <q-card-section v-if="error">
          <BaseGraphqlError :error="error" />
        </q-card-section>
        <q-separator />
      </template>

      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('base.cancel')" color="primary" />
        <q-btn
          v-if="!error"
          flat
          :label="t('plants.eliminate')"
          :loading="fetching"
          color="negative"
          @click="eliminate"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import { useI18n } from 'src/composables/useI18n';
import { graphql } from 'src/graphql';
import { ref } from 'vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import BaseMessage from '../Base/BaseMessage.vue';

export interface PlantButtonEliminateProps {
  plantId: number;
}

const props = defineProps<PlantButtonEliminateProps>();

const { t } = useI18n();

const confirm = ref(false);

const { error, fetching, ...urql } = useMutation(
  graphql(`
    mutation EliminatePlant($id: Int!) {
      update_plants_by_pk(
        pk_columns: { id: $id }
        _set: { date_eliminated: "now()" }
      ) {
        id
      }
    }
  `),
);

async function eliminate() {
  await urql.executeMutation({ id: props.plantId }).then(() => {
    confirm.value = !!error.value;
  });
}
</script>
