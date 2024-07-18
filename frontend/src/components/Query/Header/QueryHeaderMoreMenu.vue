<template>
  <q-fab
    v-model="showMore"
    :disable="saving || deleting"
    :flat="!showMore"
    :title="t('analyze.header.more')"
    direction="down"
    icon="more_vert"
    padding="sm"
    vertical-actions-align="right"
    color="grey-7"
    :text-color="!showMore ? 'primary' : 'white'"
  >
    <q-fab-action
      :label="
        store.explain
          ? t('analyze.header.hideExplanation')
          : t('analyze.header.showExplanation')
      "
      icon="info"
      label-position="left"
      color="grey-7"
      @click="store.explain = !store.explain"
    />
    <q-fab-action
      :label="t('base.rename')"
      icon="edit"
      label-position="left"
      color="grey-7"
      @click="$emit('rename')"
    />
    <q-fab-action
      :label="t('analyze.header.duplicate')"
      icon="content_copy"
      label-position="left"
      color="grey-7"
      @click="$emit('duplicate')"
    />
    <q-fab-action
      v-if="analyzeId !== 'new'"
      :label="t('base.delete')"
      icon="delete_outline"
      label-position="left"
      color="grey-7"
      text-color="negative"
      @click="showDeleteDialog = true"
    />
  </q-fab>

  <q-dialog v-model="showDeleteDialog" @hide="resetErrors">
    <q-card>
      <q-card-section class="row items-center">
        <q-icon name="warning" color="warning" size="50px" />
        <span class="q-ml-sm">{{
          t('base.deleteConfirmation', { entity: t('analyze.header.filter') })
        }}</span>
      </q-card-section>

      <template v-if="error">
        <q-separator />
        <q-card-section>
          <BaseGraphqlError :error="error" />
        </q-card-section>
        <q-separator />
      </template>

      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('base.cancel')" color="primary" />
        <q-btn
          v-if="!error"
          flat
          :label="t('base.delete')"
          :loading="deleting"
          color="negative"
          @click="deleteFilter"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import { useQueryStore } from '../useQueryStore';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';

const props = defineProps<{
  saving: boolean;
  analyzeId: number | 'new';
}>();

const emit = defineEmits<{
  rename: [];
  duplicate: [];
  deleted: [];
}>();

const store = useQueryStore();
const showMore = ref(false);
const showDeleteDialog = ref(false);

function resetErrors() {
  error.value = undefined;
}

const {
  error,
  executeMutation: executeDeleteFilter,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteAnalyzeFilter($id: Int!) {
      delete_analyze_filters_by_pk(id: $id) {
        id
      }
    }
  `),
);

function deleteFilter() {
  if (props.analyzeId === 'new') {
    // this should never happen
    throw new Error("Can't delete an unsaved filter");
  }

  executeDeleteFilter({ id: props.analyzeId }).then((result) => {
    // in case no analyze_filter is found (which shouldn't happen) we don't get an error
    // currently the error is not displayed as creating a
    // GraphQL error is cumbersome
    if (!result.data?.delete_analyze_filters_by_pk) {
      console.error(`Failed to delete analyze filter ${props.analyzeId}`);
    }
    emit('deleted');
  });
}

const { t } = useI18n();
</script>
