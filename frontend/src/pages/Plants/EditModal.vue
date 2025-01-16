<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PlantModalEdit v-if="plant" :plant="plant" :title="t('base.edit')" />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import PlantModalEdit from 'src/components/Plant/PlantModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Plant($id: Int!, $PlantWithSegments: Boolean = true) {
      plants_by_pk(id: $id) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);
const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['plants'] },
});
const plant = computed(() => data.value?.plants_by_pk);

const { t } = useI18n();
</script>
