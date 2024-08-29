<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <PlantModalEdit v-else-if="plant" :plant="plant" :title="t('base.edit')" />

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import PlantModalEdit from 'src/components/Plant/PlantModalEdit.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

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
});
const plant = computed(() => data.value?.plants_by_pk);

const { t } = useI18n();
</script>
