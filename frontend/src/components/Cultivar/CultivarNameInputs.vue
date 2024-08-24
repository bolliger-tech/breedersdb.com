<template>
  <CultivarNameSegmentInput
    ref="nameSegmentRef"
    v-model="nameSegment"
    :lot="lot"
    :loading="fetching"
    :lot-error="!!error"
    :cultivar-id="cultivarId"
  />
  <CultivarNameOverrideInput
    ref="nameOverrideRef"
    v-model="nameOverride"
    :cultivar-id="cultivarId"
    :full-name="fullName"
  />
</template>

<script setup lang="ts">
import CultivarNameSegmentInput from './CultivarNameSegmentInput.vue';
import CultivarNameOverrideInput from './CultivarNameOverrideInput.vue';
import { InputRef } from 'src/composables/useEntityForm';
import { focusInView } from 'src/utils/focusInView';
import { computed, ref, watch } from 'vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';

export interface CultivarNameInputProps {
  cultivarId: number | undefined;
  lotId: number | undefined;
}

const props = defineProps<CultivarNameInputProps>();
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
  query Lots($id: Int!) {
    lots_by_pk(id: $id) {
      id
      display_name
    }
  }
`);
const variables = computed(() => ({ id: props.lotId }));
const { data, error, fetching, resume, pause } = useQuery({
  query: query,
  variables: variables,
  pause: !props.lotId,
  requestPolicy: 'cache-and-network',
});
watch(
  () => props.lotId,
  (newValue) => {
    if (newValue) {
      resume();
    } else {
      pause();
      data.value = undefined;
    }
  },
);
const lot = computed(() => data.value?.lots_by_pk || null);

const fullName = computed(() => {
  if (!lot.value || !nameSegment.value) {
    return undefined;
  }
  return `${lot.value.display_name}.${nameSegment.value}`;
});
</script>
