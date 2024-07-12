<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="grafting"
    sprite-icon="grafting"
    :title="grafting.name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow :label="t('graftings.fields.name')">
          {{ grafting.name }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(grafting.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            grafting.modified
              ? localizeDate(grafting.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
      </EntityViewTable>
    </template>

    <template #action-left>
      <GraftingButtonDelete
        :grafting-id="grafting.id"
        @deleted="() => router.push({ path: '/graftings', query: route.query })"
      />
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import GraftingButtonDelete from 'src/components/Grafting/GraftingButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { graftingFragment } from 'src/components/Grafting/graftingFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Grafting($id: Int!) {
      graftings_by_pk(id: $id) {
        ...graftingFragment
      }
    }
  `,
  [graftingFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const grafting = computed(() => data.value?.graftings_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/graftings/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
