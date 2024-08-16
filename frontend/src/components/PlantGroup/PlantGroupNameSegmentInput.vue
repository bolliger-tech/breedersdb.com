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
        (val && /^[-_\w\d]{1,25}$/.test(val)) ||
        t('base.validation.noNewLinesMaxLength', { max: 25 }),
      async (val: string) =>
        (await isNameSegmentUnique(val)) ||
        t('plantGroups.validation.nameNotUniqueWithCultivar'),
    ]"
    :prefix="cultivar?.display_name || null"
    :next-free-name-segment="nextFreeNameSegment"
    :loading="loading || fetchingPlantGroups || fetchingNameSegmentUnique"
    :fetch-error="cultivarError || !!plantGroupsError"
  >
    <template #explainerFullNameListItems>
      <i18n-t tag="li" keypath="plantGroups.explainer.1.base" scope="global">
        <template #pattern
          ><strong>{{ t('plantGroups.explainer.1.pattern') }}</strong></template
        >
        <template #placeholder
          ><code>{{ t('cultivars.title', 1) }}.*</code></template
        >
        <template #cultivar
          ><code>{{ t('cultivars.title', 1) }}</code></template
        >
        <template #plantGroupPlaceholder><code>*</code></template>
      </i18n-t>
      <li>
        <strong>{{ t('plantGroups.explainer.examples') }}</strong>
        <ul>
          <li>
            <code>AxB.{{ currentYear }}A.001.A</code>
          </li>
          <li>
            <code>AxB.{{ currentYear }}A.001.B1</code>
          </li>
        </ul>
      </li>
      <i18n-t tag="li" keypath="plantGroups.explainer.2.base" scope="global">
        <template #hint
          ><strong>{{ t('plantGroups.explainer.2.hint') }}</strong></template
        >
      </i18n-t>
    </template>

    <template #inputHint>
      {{ t('base.required') }}.
      <i18n-t keypath="plantGroups.explainer.2.base" scope="global">
        <template #hint
          ><strong>{{ t('plantGroups.explainer.2.hint') }}</strong></template
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

export interface PlantGroupNameInputProps {
  plantGroupId: number | undefined;
  cultivar: {
    id: number;
    display_name: string;
  } | null;
  loading: boolean;
  cultivarError: boolean;
}

const props = defineProps<PlantGroupNameInputProps>();
const modelValue = defineModel<string>({ required: true });

const inputRef = ref<InstanceType<typeof EntityNameSegmentInput> | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { t } = useI18n();

const currentYear = parseInt(new Date().getFullYear().toString().slice(-2));

const plantGroupsQuery = graphql(`
  query PlantGroups($cultivarId: Int!) {
    plant_groups(where: { cultivar_id: { _eq: $cultivarId } }) {
      id
      name_segment
    }
  }
`);
const plantGroupsQueryVariables = computed(() => ({
  cultivarId: props.cultivar?.id,
}));
const {
  data: plantGroupsData,
  error: plantGroupsError,
  fetching: fetchingPlantGroups,
  resume: resumePlantGroupsQuery,
  pause: pausePlantGroupsQuery,
} = useQuery({
  query: plantGroupsQuery,
  variables: plantGroupsQueryVariables,
  pause: !props.cultivar,
});
watch(
  () => props.cultivar,
  (newValue) => {
    if (newValue) {
      resumePlantGroupsQuery();
    } else {
      pausePlantGroupsQuery();
      plantGroupsData.value = undefined;
    }
  },
);

const nextFreeNameSegment = computed(() => {
  if (!plantGroupsData.value) {
    return null;
  }
  const takenSegments = plantGroupsData.value.plant_groups
    .filter((g) => g.id !== props.plantGroupId) // Exclude current plant group
    .map((g) => g.name_segment);
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const segment = letter;
    if (!takenSegments.includes(segment)) {
      return segment;
    }
  }
  return null;
});

const additionalWhere = computed(() => {
  if (!props.cultivar?.id) {
    return {};
  }
  return {
    cultivar_id: { _eq: props.cultivar.id },
  };
});
const { isUnique: isNameSegmentUnique, fetching: fetchingNameSegmentUnique } =
  useIsUnique({
    tableName: 'plant_groups',
    existingId: props.plantGroupId || undefined,
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
