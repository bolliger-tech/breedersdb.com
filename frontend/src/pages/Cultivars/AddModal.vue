<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <CultivarModalEdit
      v-if="cultivar"
      :cultivar="cultivar"
      :title="t('base.new')"
      :is-variety="false"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { CultivarInsertInput } from 'src/components/Cultivar/CultivarModalEdit.vue';
import CultivarModalEdit from 'src/components/Cultivar/CultivarModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyCultivar: CultivarInsertInput = {
  name_segment: '',
  name_override: null,
  full_name: '',
  display_name: '',
  acronym: null,
  breeder: null,
  note: null,
};

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
  variables: { id: props.templateId },
  context: { additionalTypenames: ['cultivars'] },
  pause: !props.templateId,
});

const cultivar = computed(() => {
  if (props.templateId) {
    if (!data.value?.cultivars_by_pk) {
      return;
    }
    return {
      ...emptyCultivar,
      lot_id: data.value.cultivars_by_pk.lot_id,
    };
  } else {
    return emptyCultivar;
  }
});

const { t } = useI18n();
</script>
