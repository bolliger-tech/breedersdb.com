<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="plant">
    <template #title>
      <h2 class="q-my-sm">{{ t('base.edit') }}</h2>
    </template>

    <template #default>
      <PlantEntityForm
        ref="formRef"
        :plant="plant"
        @change="(data) => (changedData = data)"
      />
    </template>

    <template #action-left>
      <PlantButtonEliminate v-if="!plant.disabled" :plant-id="plant.id" />
      <div v-else></div>
    </template>

    <template #action-right>
      <div v-if="errorMsg" class="text-negative">{{ errorMsg }}</div>
      <q-btn flat :label="t('base.cancel')" color="primary" @click="cancel" />
      <q-btn
        flat
        :label="t('base.save')"
        color="primary"
        :loading="saving"
        @click="save"
      />
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@urql/vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { VariablesOf, graphql } from 'src/graphql';
import { computed, ref, watch } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import PlantEntityForm from 'src/components/Plant/PlantEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import { closeModalSymbol } from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Plant(
      $id: Int!
      $withAttributions: Boolean = false
      $withSegments: Boolean = true
    ) {
      plants_by_pk(id: $id) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);
const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const plant = computed(() => data.value?.plants_by_pk);

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

const errorMsg = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const formRef = ref<InstanceType<typeof PlantEntityForm> | null>(null);
const changedData = ref<VariablesOf<typeof mutation>['plant']>();
const mutation = graphql(
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
const {
  executeMutation,
  fetching: saving,
  error: saveError,
} = useMutation(mutation);
watch(saveError, () => {
  errorMsg.value = saveError.value?.message ?? null;
});

async function save() {
  if (!changedData.value) {
    closeModal();
    return;
  }

  errorMsg.value = null;
  const isValid = await formRef.value?.validate();
  if (!isValid) {
    errorMsg.value = t('base.validation.invalidFields');
    return;
  }

  executeMutation({
    id: parseInt(props.entityId.toString()),
    plant: changedData.value,
  }).then(() => {
    if (!saveError.value) {
      closeModal();
    }
  });
}

const { t } = useI18n();
</script>
