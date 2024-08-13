<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="cultivar"
    sprite-icon="cultivar"
    :title="cultivar.display_name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow :label="t('entity.commonColumns.displayName')">
          {{ cultivar.display_name }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('cultivars.fields.lot')">
          <RouterLink
            :to="`/lots/${cultivar.lot?.id}`"
            class="undecorated-link"
          >
            {{ cultivar.lot?.display_name }}
          </RouterLink>
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('cultivars.fields.acronym')">
          {{ cultivar.acronym }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('cultivars.fields.breeder')">
          {{ cultivar.breeder }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('cultivars.fields.registration')">
          {{ cultivar.registration }}
        </EntityViewTableRow>

        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(cultivar.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            cultivar.modified
              ? localizeDate(cultivar.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
        <EntityViewTableRow v-if="cultivar.note">
          <strong>{{ t('entity.commonColumns.note') }}</strong>
          <br />
          <span style="white-space: pre-line">{{ cultivar.note }}</span>
        </EntityViewTableRow>
      </EntityViewTable>
    </template>

    <template #action-left>
      <CultivarButtonDelete
        :cultivar-id="cultivar.id"
        @deleted="() => router.push({ path: '/cultivars', query: route.query })"
      />
    </template>
  </EntityModalContent>

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import CultivarButtonDelete from 'src/components/Cultivar/CultivarButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Cultivar(
      $id: Int!
      $CultivarWithLot: Boolean = true
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      cultivars_by_pk(id: $id) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const cultivar = computed(() => data.value?.cultivars_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/cultivars/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
