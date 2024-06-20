<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="data"
    :title="`${entityName} ${data.plants_by_pk?.label_id}`"
  >
    <pre>{{ JSON.stringify(data, undefined, 2) }}</pre>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useEntityName } from 'src/composables/useEntityName';
import { BaseTable } from 'src/components/Query/Filter/filterNode';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(`
  query Plant($id: Int!) {
    plants_by_pk(id: $id) {
      id
      label_id
      cultivar_name
      plant_group_name
      serial_in_plant_row
      distance_plant_row_start
      geo_location
      geo_location_accuracy
      date_grafted
      date_planted
      date_eliminated
      date_labeled
      note
      rootstock {
        id
        name
      }
      grafting {
        id
        name
      }
      plant_row {
        id
        name
        orchard {
          id
          name
        }
      }
      created
    }
  }
`);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const { getEntityName } = useEntityName();
const entityName = getEntityName({
  table: BaseTable.Plants,
  plural: false,
  capitalize: true,
});
</script>
