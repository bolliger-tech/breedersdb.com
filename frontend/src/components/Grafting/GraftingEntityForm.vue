<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.nameRef = el)"
    v-model="data.name"
    :label="t('graftings.fields.name')"
    :rules="[
      (val: string) =>
        !!val || t('base.validation.xIsRequired', [t('graftings.fields.name')]),
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
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
  GraftingEditInput,
  GraftingInsertInput,
} from './GraftingModalEdit.vue';
import { useEntityForm } from 'src/composables/useEntityForm';
import { graphql } from 'gql.tada';
import { useQuery } from '@urql/vue';

export interface GraftingEntityFormProps {
  grafting: GraftingInsertInput | GraftingEditInput;
}

const props = defineProps<GraftingEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.grafting.name,
};

const data = ref({ ...initialData });

type InputRef = VNodeRef & {
  validate: () => boolean | Promise<boolean> | undefined;
  focus: () => void;
};
const refs = ref<{ [key: string]: InputRef | null }>({
  nameRef: null,
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
  query GraftingsNameUniqueQuery($name: String!) {
    graftings(where: { name: { _eq: $name } }, limit: 1) {
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
    result.data?.value?.graftings.length === 0 ||
    result.data?.value?.graftings[0]?.id ===
      ('id' in props.grafting ? props.grafting.id : undefined)
  );
}
</script>
