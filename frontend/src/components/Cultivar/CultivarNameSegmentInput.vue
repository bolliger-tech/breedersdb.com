<template>
  <EntityNameSegmentInput
    ref="inputRef"
    v-model="modelValue"
    :rules="[
      (val: string | null | undefined) =>
        !!val ||
        t('base.validation.xIsRequired', {
          x: t('entity.commonColumns.nameSegment'),
        }),
      (val: string) =>
        (val && /^[\d]{3}$/.test(val)) ||
        t('cultivars.validation.nameSegmentFormat'),
      async (val: string) =>
        (await isNameSegmentUnique(val)) ||
        t('cultivars.validation.nameNotUniqueWithLot'),
    ]"
    mask="###"
    fill-mask="#"
    unmasked-value
    :prefix="lot?.display_name || null"
    :next-free-name-segment="nextFreeNameSegment"
    :loading="loading || fetchingCultivars || fetchingNameSegmentUnique"
    :fetch-error="lotError || !!cultivarsError"
  >
    <template #explainerFullNameListItems>
      <i18n-t tag="li" keypath="cultivars.explainer.1.base" scope="global">
        <template #pattern
          ><strong>{{ t('cultivars.explainer.1.pattern') }}</strong></template
        >
        <template #placeholder
          ><code>{{ t('lots.title', 1) }}.###</code></template
        >
        <template #lot
          ><code>{{ t('lots.title', 1) }}</code></template
        >
        <template #cultivarPlaceholder><code>###</code></template>
      </i18n-t>
      <li>
        <strong>{{ t('cultivars.explainer.examples') }}</strong>
        <ul>
          <li>
            <code>AxB.{{ currentYear }}A.001</code>
          </li>
          <li>
            <code>AxB.{{ currentYear }}A.002</code>
          </li>
          <li>
            <code>CxD.{{ currentYear }}A.001</code>
          </li>
        </ul>
      </li>
      <i18n-t tag="li" keypath="cultivars.explainer.2.base" scope="global">
        <template #hint
          ><strong>{{ t('cultivars.explainer.2.hint') }}</strong></template
        >
      </i18n-t>
    </template>

    <template #inputHint>
      {{ t('base.required') }}.
      {{ t('cultivars.segmentNameHint', { example: '017' }) }}.
      <i18n-t v-if="lot" keypath="cultivars.explainer.2.base" scope="global">
        <template #hint
          ><strong>{{ t('cultivars.explainer.2.hint') }}</strong></template
        >
      </i18n-t>
    </template>
  </EntityNameSegmentInput>
</template>

<script setup lang="ts">
import EntityNameSegmentInput from 'src/components/Entity/Edit/EntityNameSegmentInput.vue';
import { useI18n } from 'src/composables/useI18n';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, ref, watch } from 'vue';
import { useIsUnique } from 'src/composables/useIsUnique';
import { focusInView } from 'src/utils/focusInView';

export interface CultivarNameInputProps {
  cultivarId: number | undefined;
  lot: {
    id: number;
    display_name: string;
  } | null;
  loading: boolean;
  lotError: boolean;
}

const props = defineProps<CultivarNameInputProps>();
const modelValue = defineModel<string>({ required: true });

const inputRef = ref<InstanceType<typeof EntityNameSegmentInput> | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { t } = useI18n();

const currentYear = parseInt(new Date().getFullYear().toString().slice(-2));

const cultivarsQuery = graphql(`
  query Cultivars($lotId: Int!) {
    cultivars(where: { lot_id: { _eq: $lotId } }) {
      id
      name_segment
    }
  }
`);
const cultivarsQueryVariables = computed(() => ({
  lotId: props.lot?.id,
}));
const {
  data: cultivarsData,
  error: cultivarsError,
  fetching: fetchingCultivars,
  resume: resumeCultivarsQuery,
  pause: pauseCultivarsQuery,
} = useQuery({
  query: cultivarsQuery,
  variables: cultivarsQueryVariables,
  pause: !props.lot,
  context: { additionalTypenames: ['cultivars'] },
});
watch(
  () => props.lot,
  (newValue) => {
    if (newValue) {
      resumeCultivarsQuery();
    } else {
      pauseCultivarsQuery();
      cultivarsData.value = undefined;
    }
  },
);

const nextFreeNameSegment = computed(() => {
  if (!cultivarsData.value) {
    return null;
  }
  const takenSegments = cultivarsData.value.cultivars
    .filter((c) => c.id !== props.cultivarId) // Exclude current cultivar
    .map((c) => c.name_segment);
  for (let i = 1; i < 1000; i++) {
    const segment = i.toString().padStart(3, '0');
    if (!takenSegments.includes(segment)) {
      return segment;
    }
  }
  return null;
});

const additionalWhere = computed(() => {
  if (!props.lot?.id) {
    return { lot_id: { _eq: -1 } };
  }
  return {
    lot_id: { _eq: props.lot.id },
  };
});
const { isUnique: isNameSegmentUnique, fetching: fetchingNameSegmentUnique } =
  useIsUnique({
    tableName: 'cultivars',
    existingId: props.cultivarId || undefined,
    columnName: 'name_segment',
    additionalWhere,
  });
</script>
