<template>
  <EntityModalContent
    :loading="savingEdit || savingInsert"
    :save-error="saveError"
    :validation-error="validationError"
    sprite-icon="rows"
    :title="t('base.edit')"
    :subtitle="t('plantRows.title', 1)"
    @cancel="cancel"
    @save="save"
    @reset-errors="resetErrors"
  >
    <template #default>
      <PlantRowEntityForm
        ref="formRef"
        :plant-row="plantRow"
        @change="onFormChange"
      />
    </template>

    <template #action-left>
      <PlantRowButtonDelete
        v-if="'id' in plantRow && !plantRow.disabled"
        :plant-row-id="plantRow.id"
        @deleted="() => router.push({ path: '/rows', query: route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalContent>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import {
  PlantRowFragment,
  plantRowFragment,
} from 'src/components/PlantRow/plantRowFragment';
import { VariablesOf, graphql } from 'src/graphql';
import { computed, ref, nextTick } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import PlantRowButtonDelete from 'src/components/PlantRow/PlantRowButtonDelete.vue';
import PlantRowEntityForm from 'src/components/PlantRow/PlantRowEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { useCancel } from 'src/composables/useCancel';

export type PlantRowEditInput = Omit<PlantRowFragment, 'created' | 'modified'>;
export type PlantRowInsertInput = Omit<PlantRowEditInput, 'id' | 'orchard'> &
  Partial<Pick<PlantRowEditInput, 'orchard'>>;

export interface PlantRowModalEditProps {
  plantRow: PlantRowEditInput | PlantRowInsertInput;
}

const props = defineProps<PlantRowModalEditProps>();

const router = useRouter();
const route = useRoute();
const { cancel } = useCancel({ path: '/rows' });

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const formRef = ref<InstanceType<typeof PlantRowEntityForm> | null>(null);

const insertMutation = graphql(
  `
    mutation InsertPlantRow(
      $plantRow: plant_rows_insert_input!
      $withPlants: Boolean = false
    ) {
      insert_plant_rows_one(object: $plantRow) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);
const insertData = ref<VariablesOf<typeof insertMutation>['plantRow']>();
const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);

const editMutation = graphql(
  `
    mutation UpdatePlantRow(
      $id: Int!
      $plantRow: plant_rows_set_input!
      $withPlants: Boolean = false
    ) {
      update_plant_rows_by_pk(pk_columns: { id: $id }, _set: $plantRow) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);
const editedData = ref<VariablesOf<typeof editMutation>['plantRow']>();
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

function onFormChange(data: typeof editedData.value | typeof insertData.value) {
  if (!data) {
    return;
  } else if ('id' in props.plantRow) {
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

  if ('id' in props.plantRow) {
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
    plantRow: insertData.value,
  });
}

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  if (!('id' in props.plantRow)) {
    // this should never happen
    throw new Error('PlantRow ID is missing');
  }

  return executeEditMutation({
    id: props.plantRow.id,
    plantRow: editedData.value,
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
