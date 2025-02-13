<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <OrchardModalEdit
      v-if="orchard"
      :orchard="orchard"
      :title="t('base.new')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import OrchardModalEdit, {
  OrchardInsertInput,
} from 'src/components/Orchard/OrchardModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyOrchard: OrchardInsertInput = {
  name: '',
  disabled: false,
};

const query = graphql(
  `
    query Orchard(
      $id: Int!
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      orchards_by_pk(id: $id) {
        ...orchardFragment
        plant_rows(where: { disabled: { _eq: false } }) {
          ...plantRowFragment
        }
        lots {
          ...lotFragment
        }
      }
    }
  `,
  [orchardFragment, plantRowFragment, lotFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: { additionalTypenames: ['plant_rows'] },
  pause: !props.templateId,
});

const orchard = computed(() => {
  if (props.templateId) {
    if (!data.value?.orchards_by_pk) {
      return;
    }
    return {
      ...emptyOrchard,
      disabled: data.value.orchards_by_pk.disabled,
    };
  } else {
    return emptyOrchard;
  }
});

const { t } = useI18n();
</script>
