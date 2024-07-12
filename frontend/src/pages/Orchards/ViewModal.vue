<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="orchard"
    sprite-icon="orchard"
    :title="orchard.name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow :label="t('orchards.fields.name')">
          {{ orchard.name }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('orchards.fields.disabled')">
          {{ orchard.disabled ? t('base.yes') : t('base.no') }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(orchard.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            orchard.modified
              ? localizeDate(orchard.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
      </EntityViewTable>
    </template>

    <template #action-left>
      <OrchardButtonDelete
        :orchard-id="orchard.id"
        @deleted="() => router.push({ path: '/orchards', query: route.query })"
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
import OrchardButtonDelete from 'src/components/Orchard/OrchardButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Orchard($id: Int!) {
      orchards_by_pk(id: $id) {
        ...orchardFragment
      }
    }
  `,
  [orchardFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const orchard = computed(() => data.value?.orchards_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/orchards/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
