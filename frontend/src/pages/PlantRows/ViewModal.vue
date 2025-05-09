<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="plantRow"
      sprite-icon="rows"
      :title="plantRow.name"
      :print-data="print || undefined"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <PlantRowEntityTable :plant-row="plantRow" />

        <h3 class="q-mb-md">
          {{ t('plants.active') }}
        </h3>
        <PlantList
          :rows="plantRow.plantsActive"
          :visible-columns="[
            'label_id',
            'plant_group_name',
            'distance_plant_row_start',
            'date_planted',
          ]"
        />

        <h3 class="q-mb-md">
          {{ t('plants.eliminated') }}
        </h3>
        <PlantList
          :rows="plantRow.plantsDisabled"
          :visible-columns="[
            'label_id',
            'plant_group_name',
            'distance_plant_row_start',
            'date_planted',
            'date_eliminated',
          ]"
        />
      </template>

      <template #action-left>
        <PlantRowButtonDelete
          v-if="!plantRow.disabled"
          :plant-row-id="plantRow.id"
          @deleted="() => $router.push({ path: '/rows', query: route.query })"
        />
        <div v-else></div>
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import PlantRowButtonDelete from 'src/components/PlantRow/PlantRowButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import { plantFragment } from 'src/components/Plant/plantFragment';
import PlantList from 'src/components/Plant/PlantList.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import PlantRowEntityTable from 'src/components/PlantRow/PlantRowEntityTable.vue';
import { makeTextLabel } from 'src/utils/labelUtils';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantRow($id: Int!, $PlantWithSegments: Boolean! = true) {
      plant_rows_by_pk(id: $id) {
        ...plantRowFragment
        note
        plantsActive: plants(where: { disabled: { _eq: false } }) {
          ...plantFragment
        }
        plantsDisabled: plants(where: { disabled: { _eq: true } }) {
          ...plantFragment
        }
      }
    }
  `,
  [plantRowFragment, plantFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['plant_rows'] },
});

const plantRow = computed(() => data.value?.plant_rows_by_pk);

const { t } = useI18n();

const print = computed(
  () =>
    plantRow.value?.name &&
    makeTextLabel({
      text: plantRow.value?.name,
      caption: t('plantRows.title', 1),
    }),
);

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/rows/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
