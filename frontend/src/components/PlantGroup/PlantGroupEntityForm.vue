<template>
  <EntityInput
    v-if="props.plantGroup.label_id"
    :model-value="props.plantGroup.label_id"
    :label="t('plantGroups.fields.labelId')"
    type="text"
    readonly
    :hint="t('plantGroups.labelIdHint')"
  />
  <CultivarSelect
    :ref="(el: InputRef) => (refs.cultivarRef = el)"
    v-model="data.cultivar_id"
    :required="true"
    @update:model-value="
      () => data.name_segment && refs.nameInputsRef?.validate()
    "
  />
  <PlantGroupNameInputs
    :ref="(el: InputRef) => (refs.nameInputsRef = el)"
    v-model:name-segment="data.name_segment"
    v-model:name-override="data.name_override"
    :plant-group-id="
      ('id' in props.plantGroup && props.plantGroup.id) || undefined
    "
    :cultivar-id="data.cultivar_id || null"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.noteRef = el)"
    v-model="data.note"
    :label="t('entity.commonColumns.note')"
    type="textarea"
    autocomplete="off"
    autogrow
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import CultivarSelect from '../Cultivar/CultivarSelect.vue';
import PlantGroupNameInputs from './PlantGroupNameInputs.vue';
import type {
  PlantGroupInsertInput,
  PlantGroupEditInput,
} from './PlantGroupModalEdit.vue';

export interface PlantGroupEntityFormProps {
  plantGroup: PlantGroupInsertInput | PlantGroupEditInput;
}

const props = defineProps<PlantGroupEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  cultivar_id: props.plantGroup.cultivar_id,
  name_segment: props.plantGroup.name_segment,
  name_override: props.plantGroup.name_override,
  note: props.plantGroup.note,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  cultivarRef: null,
  nameInputsRef: null,
  noteRef: null,
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
</script>
