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
        (val && /^(\d{2}[A-Z]|000)$/.test(val)) ||
        t('lots.validation.invalidNameSegmentFormat'),
      async (val: string) =>
        (await isNameSegmentUnique(val)) ||
        t('lots.validation.nameNotUniqueWithCrossing', {
          name: nextFreeNameSegment,
        }),
    ]"
    mask="##A"
    fill-mask="#"
    unmasked-value
    :prefix="crossing?.name || null"
    :next-free-name-segment="nextFreeNameSegment"
    :loading="loading || fetchingLots || fetchingNameSegmentUnique"
    :fetch-error="crossingError || !!lotsError"
  >
    <template #explainerFullNameListItems>
      <i18n-t tag="li" keypath="lots.explainer.1.base" scope="global">
        <template #pattern
          ><strong>{{ t('lots.explainer.1.pattern') }}</strong></template
        >
        <template #placeholder
          ><code>{{ t('crossings.title', 1) }}.###</code></template
        >
        <template #crossing
          ><code>{{ t('crossings.title', 1) }}</code></template
        >
        <template #lotPlaceholder><code>###</code></template>
      </i18n-t>
      <li>
        <strong>{{ t('lots.explainer.examples') }}</strong>
        <ul>
          <li>
            <code>AxB.{{ currentYear }}A</code>
          </li>
          <li>
            <code>AxB.{{ currentYear }}B</code>
          </li>
          <li>
            <code>AxB.{{ currentYear }}C</code>
          </li>
          <li>
            <code>CxD.{{ currentYear }}A</code>
          </li>
        </ul>
      </li>
      <i18n-t tag="li" keypath="lots.explainer.2.base" scope="global">
        <template #hint
          ><strong>{{ t('lots.explainer.2.hint') }}</strong></template
        >
      </i18n-t>
    </template>

    <template #inputHint>
      {{ t('base.required') }}.
      <i18n-t keypath="lots.segmentNameHint" scope="global">
        <template #example
          ><code>{{ currentYear }}A</code></template
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

export interface LotNameInputProps {
  lotId: number | undefined;
  crossing: {
    id: number;
    name: string;
  } | null;
  loading: boolean;
  crossingError: boolean;
}

const props = defineProps<LotNameInputProps>();
const modelValue = defineModel<string>({ required: true });

const inputRef = ref<InstanceType<typeof EntityNameSegmentInput> | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { t } = useI18n();

const currentYear = parseInt(new Date().getFullYear().toString().slice(-2));

const lotsQuery = graphql(`
  query Lots($crossingId: Int!) {
    lots(where: { crossing_id: { _eq: $crossingId } }) {
      id
      name_segment
    }
  }
`);
const lotsQueryVariables = computed(() => ({ crossingId: props.crossing?.id }));
const {
  data: lotsData,
  error: lotsError,
  fetching: fetchingLots,
  resume: resumeLotsQuery,
  pause: pauseLotsQuery,
} = useQuery({
  query: lotsQuery,
  variables: lotsQueryVariables,
  pause: !props.crossing,
});
watch(
  () => props.crossing,
  (newValue) => {
    if (newValue) {
      resumeLotsQuery();
    } else {
      pauseLotsQuery();
      lotsData.value = undefined;
    }
  },
);

const nextFreeNameSegment = computed(() => {
  if (!lotsData.value) {
    return null;
  }
  const takenSegments = lotsData.value.lots
    .filter((lot) => lot.id !== props.lotId) // Exclude current lot
    .map((lot) => lot.name_segment);
  for (let i = currentYear; i !== currentYear - 1; i = (i + 1) % 100) {
    const digits = i.toString().padStart(2, '0');
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      const segment = `${digits}${letter}`;
      if (!takenSegments.includes(segment)) {
        return segment;
      }
    }
  }
  return null;
});

const additionalWhere = computed(() => {
  if (!props.crossing?.id) {
    return {};
  }
  return {
    crossing_id: { _eq: props.crossing.id },
  };
});
const { isUnique: isNameSegmentUnique, fetching: fetchingNameSegmentUnique } =
  useIsUnique({
    tableName: 'lots',
    existingId: props.lotId || undefined,
    columnName: 'name_segment',
    additionalWhere,
  });
</script>
