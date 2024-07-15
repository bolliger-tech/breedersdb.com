<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="plantRow"
    sprite-icon="rows"
    :title="plantRow.name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow :label="t('entity.commonColumns.name')">
          {{ plantRow.name }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('plantRows.fields.orchard')">
          {{ plantRow.orchard.name }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.disabled')">
          {{ plantRow.disabled ? t('base.yes') : t('base.no') }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(plantRow.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            plantRow.modified
              ? localizeDate(plantRow.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
      </EntityViewTable>
    </template>

    <template #action-left>
      <PlantRowButtonDelete
        v-if="!plantRow.disabled"
        :plant-row-id="plantRow.id"
        @deleted="() => router.push({ path: '/rows', query: route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import PlantRowButtonDelete from 'src/components/PlantRow/PlantRowButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PlantRow($id: Int!) {
      plant_rows_by_pk(id: $id) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const plantRow = computed(() => data.value?.plant_rows_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/rows/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
