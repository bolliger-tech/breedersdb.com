<template>
  <LotNameSegmentInput
    ref="nameSegmentRef"
    v-model="nameSegment"
    :crossing="crossing"
    :loading="fetchingCrossing"
    :crossing-error="!!crossingError"
    :lot-id="lotId"
  />
  <LotNameOverrideInput
    ref="nameOverrideRef"
    v-model="nameOverride"
    :lot-id="lotId"
    :full-name="fullName"
  />
</template>

<script setup lang="ts">
import LotNameSegmentInput from './LotNameSegmentInput.vue';
import LotNameOverrideInput from './LotNameOverrideInput.vue';
import { InputRef } from 'src/composables/useEntityForm';
import { focusInView } from 'src/utils/focusInView';
import { computed, ref, watch } from 'vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';

export interface LotNameInputProps {
  lotId: number | undefined;
  crossingId: number | null;
}

const props = defineProps<LotNameInputProps>();
const nameSegment = defineModel<string>('nameSegment', { required: true });
const nameOverride = defineModel<string | null>('nameOverride', {
  required: true,
});

const nameSegmentRef = ref<InputRef | null>(null);
const nameOverrideRef = ref<InputRef | null>(null);
defineExpose({
  validate: () =>
    nameSegmentRef.value?.validate() && nameOverrideRef.value?.validate(),
  focus: () => {
    if (!nameSegmentRef.value?.validate()) {
      nameSegmentRef.value && focusInView(nameSegmentRef.value);
      return;
    }
    if (!nameOverrideRef.value?.validate()) {
      nameOverrideRef.value && focusInView(nameOverrideRef.value);
      return;
    }
    nameSegmentRef.value && focusInView(nameSegmentRef.value);
  },
});

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
  requestPolicy: 'cache-first',
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
const crossing = computed(() => crossingData.value?.crossings_by_pk || null);

const fullName = computed(() => {
  if (!crossing.value || !nameSegment.value) {
    return undefined;
  }
  return `${crossing.value.name}.${nameSegment.value}`;
});
</script>
