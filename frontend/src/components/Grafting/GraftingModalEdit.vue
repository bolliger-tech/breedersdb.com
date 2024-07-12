<template>
  <EntityModalContent
    :loading="savingEdit || savingInsert"
    :save-error="saveError"
    :validation-error="validationError"
    sprite-icon="grafting"
    :title="t('base.edit')"
    :subtitle="t('graftings.title', 1)"
    @cancel="cancel"
    @save="save"
    @reset-errors="resetErrors"
  >
    <template #default>
      <GraftingEntityForm
        ref="formRef"
        :grafting="grafting"
        @change="onFormChange"
      />
    </template>

    <template #action-left>
      <GraftingButtonDelete
        v-if="'id' in grafting"
        :grafting-id="grafting.id"
        @deleted="() => router.push({ path: '/grafting', query: route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalContent>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import {
  GraftingFragment,
  graftingFragment,
} from 'src/components/Grafting/graftingFragment';
import { VariablesOf, graphql } from 'src/graphql';
import { computed, ref, nextTick } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import GraftingButtonDelete from 'src/components/Grafting/GraftingButtonDelete.vue';
import GraftingEntityForm from 'src/components/Grafting/GraftingEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { useCancel } from 'src/composables/useCancel';

export type GraftingEditInput = Omit<GraftingFragment, 'created' | 'modified'>;
export type GraftingInsertInput = Omit<GraftingEditInput, 'id'>;

export interface GraftingModalEditProps {
  grafting: GraftingEditInput | GraftingInsertInput;
}

const props = defineProps<GraftingModalEditProps>();

const router = useRouter();
const route = useRoute();
const { cancel } = useCancel({ path: '/grafting' });

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const formRef = ref<InstanceType<typeof GraftingEntityForm> | null>(null);

const insertMutation = graphql(
  `
    mutation InsertGrafting($grafting: graftings_insert_input!) {
      insert_graftings_one(object: $grafting) {
        ...graftingFragment
      }
    }
  `,
  [graftingFragment],
);
const insertData = ref<VariablesOf<typeof insertMutation>['grafting']>();
const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);

const editMutation = graphql(
  `
    mutation UpdateGrafting($id: Int!, $grafting: graftings_set_input!) {
      update_graftings_by_pk(pk_columns: { id: $id }, _set: $grafting) {
        ...graftingFragment
      }
    }
  `,
  [graftingFragment],
);
const editedData = ref<VariablesOf<typeof editMutation>['grafting']>();
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

function onFormChange(data: typeof editedData.value | typeof insertData.value) {
  if (!data) {
    return;
  } else if ('id' in props.grafting) {
    editedData.value = data;
  } else {
    insertData.value = data;
  }
}

async function save() {
  const isValid = await formRef.value?.validate();
  validationError.value = isValid ? null : t('base.validation.invalidFields');
  if (!isValid) {
    return;
  }

  if ('id' in props.grafting) {
    await saveEdit();
  } else {
    await saveInsert();
  }

  await nextTick();

  if (!saveError.value) {
    makeModalPersistent(false);
    closeModal();
  }
}

async function saveInsert() {
  if (!insertData.value) {
    closeModal();
    return;
  }

  return executeInsertMutation({
    grafting: insertData.value,
  });
}

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  if (!('id' in props.grafting)) {
    // this should never happen
    throw new Error('Grafting ID is missing');
  }

  return executeEditMutation({
    id: props.grafting.id,
    grafting: editedData.value,
  });
}

const saveError = computed(() => saveInsertError.value || saveEditError.value);

function resetErrors() {
  saveInsertError.value = undefined;
  saveEditError.value = undefined;
  validationError.value = null;
}

const { t } = useI18n();
</script>
