<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="plant">
    <template #title>
      <h2 class="q-my-sm">Edit</h2>
    </template>

    <template #default>
      <PlantEntityForm :plant="plant" />
    </template>

    <template #action-left>
      <PlantButtonEliminate v-if="!plant.disabled" :plant-id="plant.id" />
      <div v-else></div>
    </template>

    <template #action-right>
      <q-btn flat :label="t('base.cancel')" color="primary" @click="cancel" />
      <q-btn v-close-popup flat :label="t('base.save')" color="primary" />
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import PlantEntityForm from 'src/components/Plant/PlantEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';

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

const { t } = useI18n();

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
</script>
