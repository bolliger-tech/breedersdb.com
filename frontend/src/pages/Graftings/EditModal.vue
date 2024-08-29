<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <GraftingModalEdit
    v-else-if="grafting"
    :grafting="grafting"
    :title="t('base.edit')"
  />

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { graftingFragment } from 'src/components/Grafting/graftingFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import GraftingModalEdit from 'src/components/Grafting/GraftingModalEdit.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

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

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const grafting = computed(() => data.value?.graftings_by_pk);

const { t } = useI18n();
</script>
