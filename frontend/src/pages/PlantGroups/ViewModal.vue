<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="plantGroup"
      sprite-icon="tree-group"
      :print-data="print || undefined"
      @edit="edit"
    >
      <template #title-text>
        <EntityName
          :plant-group="plantGroup"
          :cultivar="plantGroup.cultivar"
          :lot="plantGroup.cultivar?.lot"
          :crossing="plantGroup.cultivar?.lot?.crossing"
          no-link
        />
      </template>

      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <PlantGroupEntityTable :plant-group="plantGroup" />

        <EntityViewAllAttributions :attributions="attributions" show-entity />

        <h3 class="q-mb-md">{{ t('plants.title', 2) }}</h3>
        <PlantList
          :rows="plantGroup.plants"
          :visible-columns="[
            'label_id',
            'plant_row',
            'distance_plant_row_start',
            'orchard',
            'date_planted',
            'date_eliminated',
          ]"
        />
      </template>

      <template #action-left>
        <PlantGroupButtonDelete
          v-if="!plantGroup.disabled"
          :plant-group-id="plantGroup.id"
          @deleted="() => router.push({ path: '/groups', query: route.query })"
        />
        <div v-else></div>
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import PlantGroupButtonDelete from 'src/components/PlantGroup/PlantGroupButtonDelete.vue';
import PlantGroupEntityTable from 'src/components/PlantGroup/PlantGroupEntityTable.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { plantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityName from 'src/components/Entity/EntityName.vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import {
  attributionsViewFragment,
  type AttributionsViewFragment,
} from 'src/components/Attribution/attributionsViewFragment';
import EntityViewAllAttributions from 'src/components/Entity/View/EntityViewAllAttributions.vue';
import { useRefreshAttributionsViewThenQuery } from 'src/composables/useRefreshAttributionsView';
import PlantList from 'src/components/Plant/PlantList.vue';
import { makeLabel } from 'src/utils/labelUtils';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantGroup(
      $id: Int!
      $PlantGroupWithCultivar: Boolean! = true
      $CultivarWithLot: Boolean! = true
      $LotWithOrchard: Boolean! = false
      $LotWithCrossing: Boolean! = true
      $PlantWithSegments: Boolean! = true
      $AttributionsViewWithEntites: Boolean! = true
    ) {
      plant_groups_by_pk(id: $id) {
        ...plantGroupFragment
        plants {
          ...plantFragment
        }
        attributions_views {
          ...attributionsViewFragment
        }
      }
    }
  `,
  [plantGroupFragment, plantFragment, attributionsViewFragment],
);

const { data, error, fetching } = await useRefreshAttributionsViewThenQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const plantGroup = computed(() => data.value?.plant_groups_by_pk);

const attributions = computed(
  () =>
    (plantGroup.value?.attributions_views || []) as AttributionsViewFragment[],
);

const print = computed(
  () =>
    plantGroup.value &&
    plantGroup.value.label_id &&
    makeLabel({
      code: plantGroup.value.label_id,
      desc: plantGroup.value.display_name,
    }),
);

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/groups/${props.entityId}/edit`,
    query: route.query,
  });
}

const { t } = useI18n();
</script>
