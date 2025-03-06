<template>
  <LotNameSegmentInput
    ref="nameSegmentRef"
    v-model="nameSegment"
    :crossing="crossing"
    :loading="fetching"
    :crossing-error="!!error"
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
import type { InputRef } from 'src/composables/useEntityForm';
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
  validate: async () =>
    ((await nameSegmentRef.value?.validate()) ?? true) &&
    ((await nameOverrideRef.value?.validate()) ?? true),
  focus: async () => {
    const nameOverrideValid = (await nameOverrideRef.value?.validate()) || true;
    if (!nameOverrideValid) {
      nameOverrideRef.value && focusInView(nameOverrideRef.value);
      return;
    }
    nameSegmentRef.value && focusInView(nameSegmentRef.value);
  },
});

const query = graphql(`
  query Crossing($id: Int!) {
    crossings_by_pk(id: $id) {
      id
      name
    }
  }
`);
const variables = computed(() => ({ id: props.crossingId }));
const { data, error, fetching, ...urql } = useQuery({
  query: query,
  variables: variables,
  pause: !props.crossingId,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['crossings'] },
});
watch(
  () => props.crossingId,
  (newValue) => {
    if (newValue) {
      urql.resume();
    } else {
      urql.pause();
      data.value = undefined;
    }
  },
);
const crossing = computed(() => data.value?.crossings_by_pk || null);

const fullName = computed(() => {
  if (!crossing.value || !nameSegment.value) {
    return undefined;
  }
  return `${crossing.value.name}.${nameSegment.value}`;
});
</script>
