<template>
  <EntityModalContent>
    <template #title>
      <BaseSpriteIcon name="tree" color="grey-7" size="50px" />
      <div class="q-ma-sm">
        <h2 class="q-ma-none">{{ title }}</h2>
        <span>{{ t('plants.title', 1) }}</span>
      </div>
    </template>

    <template #default>
      <PlantEntityForm ref="formRef" :plant="plant" @change="onFormChange" />
    </template>

    <template #action-left>
      <PlantButtonEliminate
        v-if="!plant.disabled && 'id' in plant"
        :plant-id="plant.id"
      />
      <div v-else></div>
    </template>

    <template #action-right>
      <q-btn flat :label="t('base.cancel')" color="primary" @click="cancel" />
      <q-btn
        flat
        :label="t('base.save')"
        color="primary"
        :loading="savingEdit || savingInsert"
        @click="save"
      />
      <q-dialog
        :model-value="!!saveError || !!validationError"
        @update:model-value="
          saveInsertError = undefined;
          saveEditError = undefined;
          validationError = null;
        "
      >
        <q-card>
          <q-card-section>
            <h2 class="q-my-sm">
              <q-avatar icon="warning" color="negative" text-color="white" />
              {{ t('base.error') }}
            </h2>
          </q-card-section>

          <q-card-section class="q-py-none">
            <BaseGraphqlError v-if="saveError" :error="saveError" />
            <p v-else-if="validationError">
              {{ validationError }}
            </p>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('base.ok')" color="primary" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </EntityModalContent>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import {
  PlantFragment,
  plantFragment,
} from 'src/components/Plant/plantFragment';
import { VariablesOf, graphql } from 'src/graphql';
import { computed, ref, nextTick } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import PlantEntityForm from 'src/components/Plant/PlantEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';

export type PlantEditInput = PlantFragment;
export type PlantInsertInput = Omit<
  PlantFragment,
  | 'id'
  | 'label_id'
  | 'cultivar_name'
  | 'plant_group_name'
  | 'created'
  | 'attributions_views'
>;

export interface PlantModalEditProps {
  plant: PlantEditInput | PlantInsertInput;
  title: string;
}

const props = defineProps<PlantModalEditProps>();

const router = useRouter();
const route = useRoute();
function cancel() {
  const canGoBack = !!router.options.history.state.back;
  if (canGoBack) {
    router.back();
  } else {
    router.push({ path: '/plants', query: route.query });
  }
}

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const formRef = ref<InstanceType<typeof PlantEntityForm> | null>(null);

const insertMutation = graphql(
  `
    mutation InsertPlant(
      $plant: plants_insert_input!
      $withSegments: Boolean = true
      $withAttributions: Boolean = false
    ) {
      insert_plants_one(object: $plant) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);
const insertData = ref<VariablesOf<typeof insertMutation>['plant']>();
const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);

const editMutation = graphql(
  `
    mutation UpdatePlant(
      $id: Int!
      $plant: plants_set_input!
      $withSegments: Boolean = true
      $withAttributions: Boolean = false
    ) {
      update_plants_by_pk(pk_columns: { id: $id }, _set: $plant) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);
const editedData = ref<VariablesOf<typeof editMutation>['plant']>();
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

function onFormChange(data: typeof editedData.value | typeof insertData.value) {
  if (!data) {
    return;
  } else if ('id' in data) {
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

  if ('id' in props.plant) {
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
    plant: insertData.value,
  });
}

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  if (!('id' in props.plant)) {
    // this should never happen
    throw new Error('Plant ID is missing');
  }

  return executeEditMutation({
    id: props.plant.id,
    plant: editedData.value,
  });
}

const saveError = computed(() => saveInsertError.value || saveEditError.value);

const { t } = useI18n();
</script>
