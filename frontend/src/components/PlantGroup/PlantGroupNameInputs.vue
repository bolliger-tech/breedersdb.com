<template>
  <PlantGroupNameSegmentInput
    ref="nameSegmentRef"
    v-model="nameSegment"
    :cultivar="cultivar"
    :loading="fetching"
    :cultivar-error="!!error"
    :plant-group-id="plantGroupId"
  />
  <PlantGroupNameOverrideInput
    ref="nameOverrideRef"
    v-model="nameOverride"
    :plant-group-id="plantGroupId"
    :full-name="fullName"
  />
</template>

<script setup lang="ts">
import PlantGroupNameSegmentInput from './PlantGroupNameSegmentInput.vue';
import PlantGroupNameOverrideInput from './PlantGroupNameOverrideInput.vue';
import type { InputRef } from 'src/composables/useEntityForm';
import { focusInView } from 'src/utils/focusInView';
import { computed, ref, watch } from 'vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';

export interface PlantGroupNameInputProps {
  plantGroupId: number | undefined;
  cultivarId: number | null;
}

const props = defineProps<PlantGroupNameInputProps>();
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
  query Cultivars($id: Int!) {
    cultivars_by_pk(id: $id) {
      id
      display_name
    }
  }
`);
const variables = computed(() => ({ id: props.cultivarId }));
const { data, error, fetching, resume, pause } = useQuery({
  query: query,
  variables: variables,
  pause: !props.cultivarId,
  requestPolicy: 'cache-and-network',
  context: { additionalTypenames: ['cultivars'] },
});
watch(
  () => props.cultivarId,
  (newValue) => {
    if (newValue) {
      resume();
    } else {
      pause();
      data.value = undefined;
    }
  },
);
const cultivar = computed(() => data.value?.cultivars_by_pk || null);

const fullName = computed(() => {
  if (!cultivar.value || !nameSegment.value) {
    return undefined;
  }
  return `${cultivar.value.display_name}.${nameSegment.value}`;
});
</script>
