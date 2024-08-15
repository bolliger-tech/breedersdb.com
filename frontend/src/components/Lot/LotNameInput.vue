<template>
  <BaseInputLabel :label="t('entity.commonColumns.fullName')">
    <template #explainer>
      <i18n-t keypath="entity.nameExplainerIntro.base" scope="global">
        <template #structuredName
          ><strong>{{
            t('entity.nameExplainerIntro.structuredName')
          }}</strong></template
        >
        <template #freeFormName
          ><strong>{{
            t('entity.nameExplainerIntro.freeFormName')
          }}</strong></template
        >
      </i18n-t>
      <div class="q-mt-md">
        <strong>{{ t('entity.commonColumns.fullName') }}</strong>
        <ul>
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
        </ul>
      </div>
      <div>
        <strong>{{ t('entity.commonColumns.explicitDisplayName') }}</strong>
        <ul>
          <i18n-t tag="li" keypath="lots.explainer.3.base" scope="global">
            <template #freeFormText
              ><strong>{{
                t('lots.explainer.3.freeFormText')
              }}</strong></template
            >
          </i18n-t>
          <li>
            <strong>{{ t('lots.explainer.examples') }}</strong>
            <ul>
              <li>{{ t('lots.title', 1) }} 1</li>
              <li>{{ t('lots.title', 1) }} 2</li>
              <li>{{ t('lots.title', 1) }} 3</li>
            </ul>
          </li>
        </ul>
      </div>
    </template>

    <template #default>
      <q-input
        ref="nameSegmentRef"
        v-model="nameSegment"
        :bg-color="inputBgColor"
        dense
        outlined
        bottom-slots
        :dark="$q.dark.isActive"
        autocomplete="off"
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
        type="text"
        required
        mask="##A"
        fill-mask="#"
        unmasked-value
        :loading="fetchingCrossing || fetchingLots || fetchingNameSegmentUnique"
      >
        <template v-if="crossing" #prepend>
          <div style="font-size: 14px; opacity: 0.9">
            {{ crossing.name }}<strong style="padding-left: 6px">.</strong>
          </div>
        </template>

        <template v-if="!fetchingLots && nextFreeNameSegment" #append>
          <q-btn
            :label="t('lots.autoGenerate')"
            flat
            dense
            @click="nameSegment = nextFreeNameSegment"
          />
        </template>

        <template #hint>
          {{ t('base.required') }}.
          <i18n-t keypath="lots.segmentNameHint" scope="global">
            <template #example
              ><code>{{ currentYear }}A</code></template
            >
          </i18n-t>
        </template>

        <template v-if="crossingError || lotsError" #error>
          {{ t('lots.nameSegmentDataError') }}
        </template>
      </q-input>
    </template>
  </BaseInputLabel>
  <!-- TODO: add name_override field -->
</template>

<script setup lang="ts">
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { useI18n } from 'src/composables/useI18n';
import { useInputBackground } from 'src/composables/useInputBackground';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, ref, watch } from 'vue';
import { useIsUnique } from 'src/composables/useIsUnique';
import type { QInput } from 'quasar';
import { focusInView } from 'src/utils/focusInView';

export interface LotNameInputProps {
  lotId: number | null | undefined;
  crossingId: number | null | undefined;
}

const props = defineProps<LotNameInputProps>();
const nameSegment = defineModel<string>('nameSegment', { required: true });
// const nameOverride = defineModel<string>('nameOverride', { required: true });

const nameSegmentRef = ref<QInput | null>(null);
defineExpose({
  validate: () => nameSegmentRef.value?.validate(),
  focus: () => nameSegmentRef.value && focusInView(nameSegmentRef.value),
});

const { inputBgColor } = useInputBackground();
const { t } = useI18n();

const currentYear = parseInt(new Date().getFullYear().toString().slice(-2));

const crossingQuery = graphql(`
  query Crossing($id: Int!) {
    crossings_by_pk(id: $id) {
      id
      name
    }
  }
`);
const crossingQueryVariables = computed(() => ({ id: props.crossingId }));
const {
  data: crossingData,
  error: crossingError,
  fetching: fetchingCrossing,
  resume: resumeCrossingQuery,
  pause: pauseCrossingQuery,
} = useQuery({
  query: crossingQuery,
  variables: crossingQueryVariables,
  pause: !props.crossingId,
});
watch(
  () => props.crossingId,
  (newValue) => {
    if (newValue) {
      resumeCrossingQuery();
    } else {
      pauseCrossingQuery();
      crossingData.value = undefined;
    }
  },
);
const crossing = computed(() => crossingData.value?.crossings_by_pk);

const lotsQuery = graphql(`
  query Lots($crossingId: Int!) {
    lots(where: { crossing_id: { _eq: $crossingId } }) {
      id
      name_segment
    }
  }
`);
const lotsQueryVariables = computed(() => ({ crossingId: props.crossingId }));
const {
  data: lotsData,
  error: lotsError,
  fetching: fetchingLots,
  resume: resumeLotsQuery,
  pause: pauseLotsQuery,
} = useQuery({
  query: lotsQuery,
  variables: lotsQueryVariables,
  pause: !props.crossingId,
});
watch(
  () => props.crossingId,
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
  if (!props.crossingId) {
    return {};
  }
  return {
    crossing_id: { _eq: props.crossingId },
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

<style scoped>
code {
  background: rgba(0, 0, 0, 0.25);
  padding: 0.1em 0.25em;
  border-radius: 0.25em;
}
</style>
