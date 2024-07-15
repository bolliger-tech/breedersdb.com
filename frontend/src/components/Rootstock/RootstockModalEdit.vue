<template>
  <EntityModalContent
    :loading="savingEdit || savingInsert"
    :save-error="saveError"
    :validation-error="validationError"
    sprite-icon="rootstock"
    :title="t('base.edit')"
    :subtitle="t('rootstocks.title', 1)"
    @cancel="cancel"
    @save="save"
    @reset-errors="resetErrors"
  >
    <template #default>
      <RootstockEntityForm
        ref="formRef"
        :rootstock="rootstock"
        @change="onFormChange"
      />
    </template>

    <template #action-left>
      <RootstockButtonDelete
        v-if="'id' in rootstock"
        :rootstock-id="rootstock.id"
        @deleted="
          () => $router.push({ path: '/rootstock', query: $route.query })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalContent>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import {
  RootstockFragment,
  rootstockFragment,
} from 'src/components/Rootstock/rootstockFragment';
import { VariablesOf, graphql } from 'src/graphql';
import { computed, ref, nextTick } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import RootstockButtonDelete from 'src/components/Rootstock/RootstockButtonDelete.vue';
import RootstockEntityForm from 'src/components/Rootstock/RootstockEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { useCancel } from 'src/composables/useCancel';

export type RootstockEditInput = Omit<
  RootstockFragment,
  'created' | 'modified'
>;
export type RootstockInsertInput = Omit<RootstockEditInput, 'id'>;

export interface RootstockModalEditProps {
  rootstock: RootstockEditInput | RootstockInsertInput;
}

const props = defineProps<RootstockModalEditProps>();

const { cancel } = useCancel({ path: '/rootstock' });

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const formRef = ref<InstanceType<typeof RootstockEntityForm> | null>(null);

const insertMutation = graphql(
  `
    mutation InsertRootstock($rootstock: rootstocks_insert_input!) {
      insert_rootstocks_one(object: $rootstock) {
        ...rootstockFragment
      }
    }
  `,
  [rootstockFragment],
);
const insertData = ref<VariablesOf<typeof insertMutation>['rootstock']>();
const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);

const editMutation = graphql(
  `
    mutation UpdateRootstock($id: Int!, $rootstock: rootstocks_set_input!) {
      update_rootstocks_by_pk(pk_columns: { id: $id }, _set: $rootstock) {
        ...rootstockFragment
      }
    }
  `,
  [rootstockFragment],
);
const editedData = ref<VariablesOf<typeof editMutation>['rootstock']>();
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

function onFormChange(data: typeof editedData.value | typeof insertData.value) {
  if (!data) {
    return;
  } else if ('id' in props.rootstock) {
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

  if ('id' in props.rootstock) {
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
    rootstock: insertData.value,
  });
}

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  if (!('id' in props.rootstock)) {
    // this should never happen
    throw new Error('Rootstock ID is missing');
  }

  return executeEditMutation({
    id: props.rootstock.id,
    rootstock: editedData.value,
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
