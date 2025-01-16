<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <GraftingModalEdit
      v-if="grafting"
      :grafting="grafting"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { graftingFragment } from 'src/components/Grafting/graftingFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import GraftingModalEdit from 'src/components/Grafting/GraftingModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

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
  context: { additionalTypenames: ['graftings'] },
});
const grafting = computed(() => data.value?.graftings_by_pk);

const { t } = useI18n();
</script>
