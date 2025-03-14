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

const nameSegmentRef = ref<InstanceType<
  typeof CultivarNameSegmentInput
> | null>(null);
const nameOverrideRef = ref<InstanceType<
  typeof CultivarNameOverrideInput
> | null>(null);
defineExpose({
  validate: async () =>
    ((await nameSegmentRef.value?.validate()) ?? true) &&
    ((await nameOverrideRef.value?.validate()) ?? true),
  focus: async () => {
    const nameOverrideValid = (await nameOverrideRef.value?.validate()) || true;
    if (!nameOverrideValid) {
      if (nameOverrideRef.value) focusInView(nameOverrideRef.value);
      return;
    }
    if (nameSegmentRef.value) focusInView(nameSegmentRef.value);
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
const { data, error, fetching, ...urql } = useQuery({
  query: query,
  variables: variables,
  pause: !props.lotId,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['lots'] },
});
watch(
  () => props.lotId,
  (newValue) => {
    if (newValue) {
      urql.resume();
    } else {
      urql.pause();
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
