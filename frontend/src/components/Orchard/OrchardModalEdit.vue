<template>
  <EntityModalContent
    :loading="savingEdit || savingInsert"
    :save-error="saveError"
    :validation-error="validationError"
    sprite-icon="orchard"
    :title="t('base.edit')"
    :subtitle="t('orchards.title', 1)"
    @cancel="cancel"
    @save="save"
    @reset-errors="resetErrors"
  >
    <template #default>
      <OrchardEntityForm
        ref="formRef"
        :orchard="orchard"
        @change="onFormChange"
      />
    </template>

    <template #action-left>
      <OrchardButtonDelete
        v-if="'id' in orchard"
        :orchard-id="orchard.id"
        @deleted="() => $router.push({ path: '/orchard', query: $route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalContent>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import {
  OrchardFragment,
  orchardFragment,
} from 'src/components/Orchard/orchardFragment';
import { VariablesOf, graphql } from 'src/graphql';
import { computed, ref, nextTick } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import OrchardButtonDelete from 'src/components/Orchard/OrchardButtonDelete.vue';
import OrchardEntityForm from 'src/components/Orchard/OrchardEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { useCancel } from 'src/composables/useCancel';

export type OrchardEditInput = Omit<OrchardFragment, 'created' | 'modified'>;
export type OrchardInsertInput = Omit<OrchardEditInput, 'id'>;

export interface OrchardModalEditProps {
  orchard: OrchardEditInput | OrchardInsertInput;
}

const props = defineProps<OrchardModalEditProps>();

const { cancel } = useCancel({ path: '/orchard' });

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const formRef = ref<InstanceType<typeof OrchardEntityForm> | null>(null);

const insertMutation = graphql(
  `
    mutation InsertOrchard(
      $orchard: orchards_insert_input!
      $withPlantRows: Boolean = false
      $withPlants: Boolean = false
    ) {
      insert_orchards_one(object: $orchard) {
        ...orchardFragment
      }
    }
  `,
  [orchardFragment],
);
const insertData = ref<VariablesOf<typeof insertMutation>['orchard']>();
const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);

const editMutation = graphql(
  `
    mutation UpdateOrchard(
      $id: Int!
      $orchard: orchards_set_input!
      $withPlantRows: Boolean = false
      $withPlants: Boolean = false
    ) {
      update_orchards_by_pk(pk_columns: { id: $id }, _set: $orchard) {
        ...orchardFragment
      }
    }
  `,
  [orchardFragment],
);
const editedData = ref<VariablesOf<typeof editMutation>['orchard']>();
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

function onFormChange(data: typeof editedData.value | typeof insertData.value) {
  if (!data) {
    return;
  } else if ('id' in props.orchard) {
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

  if ('id' in props.orchard) {
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
    orchard: insertData.value,
  });
}

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  if (!('id' in props.orchard)) {
    // this should never happen
    throw new Error('Orchard ID is missing');
  }

  return executeEditMutation({
    id: props.orchard.id,
    orchard: editedData.value,
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
