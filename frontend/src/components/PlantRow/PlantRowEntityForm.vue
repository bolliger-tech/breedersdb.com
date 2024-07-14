<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.nameRef = el)"
    v-model="data.name"
    :label="t('plantRows.fields.name')"
    :rules="[
      (val: string) =>
        !!val || t('base.validation.xIsRequired', [t('plantRows.fields.name')]),
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
    required
  />
  <OrchardSelect
    :ref="(el: InputRef) => (refs.orchardRef = el)"
    v-model="data.orchard_id"
    :with-disabled="props.plantRow.orchard?.disabled"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.dateEliminatedRef = el)"
    v-model="data.date_eliminated"
    :label="t('plantRows.fields.dateEliminated')"
    type="date"
    autocomplete="off"
    :hint="
      data.date_eliminated
        ? t('plantRows.hints.dateEliminatedFalse')
        : t('plantRows.hints.dateEliminatedTrue')
    "
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { VNodeRef, nextTick, ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import {
  PlantRowEditInput,
  PlantRowInsertInput,
} from './PlantRowModalEdit.vue';
import { useEntityForm } from 'src/composables/useEntityForm';
import { graphql } from 'gql.tada';
import { useQuery } from '@urql/vue';
import OrchardSelect from '../Orchard/OrchardSelect.vue';

export interface PlantRowEntityFormProps {
  plantRow: PlantRowInsertInput | PlantRowEditInput;
}

const props = defineProps<PlantRowEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.plantRow.name,
  orchard_id: props.plantRow.orchard?.id || null,
  date_eliminated: props.plantRow.date_eliminated,
};

const data = ref({ ...initialData });

type InputRef = VNodeRef & {
  validate: () => boolean | Promise<boolean> | undefined;
  focus: () => void;
};
const refs = ref<{ [key: string]: InputRef | null }>({
  nameRef: null,
  orchardRef: null,
});

const { isDirty, validate } = useEntityForm({
  refs,
  data,
  initialData,
});

defineExpose({ validate });

const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
watch(isDirty, () => makeModalPersistent(isDirty.value));

watch(data, (newData) => emits('change', newData), { deep: true });

const { t } = useI18n();

const nameUniqueQuery = graphql(`
  query PlantRowsNameUniqueQuery($name: String!) {
    plant_rows(where: { name: { _eq: $name } }, limit: 1) {
      id
    }
  }
`);

const nameUniqueQueryVariables = ref({ name: data.value.name });

const { executeQuery: executeEmailUniqueQuery, fetching: fetchingNameUnique } =
  useQuery({
    query: nameUniqueQuery,
    variables: nameUniqueQueryVariables,
  });

async function isNameUnique(newName: string) {
  nameUniqueQueryVariables.value.name = newName;
  await nextTick(); // wait for the refs to be updated
  const result = await executeEmailUniqueQuery();
  if (result.error.value) {
    console.error(result.error);
    return true;
  }
  return (
    result.data?.value?.plant_rows.length === 0 ||
    result.data?.value?.plant_rows[0]?.id ===
      ('id' in props.plantRow ? props.plantRow.id : undefined)
  );
}
</script>
