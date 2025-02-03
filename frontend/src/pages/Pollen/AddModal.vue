<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PollenModalEdit v-if="pollen" :pollen="pollen" :title="t('base.new')" />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import PollenModalEdit, {
  PollenInsertInput,
} from 'src/components/Pollen/PollenModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { pollenFragment } from 'src/components/Pollen/pollenFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyPollen: PollenInsertInput = {
  name: '',
  date_harvested: null,
  note: null,
};

const query = graphql(
  `
    query Pollen(
      $id: Int!
      $PollenWithCultivar: Boolean = false
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      pollen_by_pk(id: $id) {
        ...pollenFragment
        mother_plants {
          id
          name
          date_impregnated
          created
          plant {
            id
            label_id
          }
          crossing {
            id
            name
          }
        }
      }
    }
  `,
  [pollenFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: { additionalTypenames: ['pollen'] },
  pause: !props.templateId,
});

const pollen = computed(() => {
  if (props.templateId) {
    if (!data.value?.pollen_by_pk) {
      return;
    }
    return {
      ...emptyPollen,
      cultivar_id: data.value.pollen_by_pk.cultivar_id,
      date_harvested: data.value.pollen_by_pk.date_harvested,
    };
  } else {
    return emptyPollen;
  }
});

const { t } = useI18n();
</script>
