<template>
  <EntityInput
    :ref="(el: InputRef) => (refs.nameRef = el)"
    v-model="data.name"
    :label="t('entity.commonColumns.name')"
    :rules="[
      (val: string) =>
        !!val ||
        t('base.validation.xIsRequired', { x: t('entity.commonColumns.name') }),
      async (val: string) =>
        (await isNameUnique(val)) || t('base.validation.nameNotUnique'),
    ]"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="fetchingNameUnique"
  />
  <BaseInputLabel :label="t('entity.commonColumns.disabled')">
    <EntityToggle
      :ref="(el: InputRef) => (refs.disabledRef = el)"
      v-model="data.disabled"
      color="primary"
    />
  </BaseInputLabel>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { OrchardEditInput, OrchardInsertInput } from './OrchardModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import BaseInputLabel from '../Base/BaseInputLabel.vue';
import { useIsUnique } from 'src/composables/useIsUnique';
import EntityToggle from 'src/components/Entity/EntityToggle.vue';

export interface OrchardEntityFormProps {
  orchard: OrchardInsertInput | OrchardEditInput;
}

const props = defineProps<OrchardEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name: props.orchard.name,
  disabled: props.orchard.disabled,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  nameRef: null,
  disabledRef: null,
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

const { isUnique: isNameUnique, fetching: fetchingNameUnique } = useIsUnique({
  tableName: 'orchards',
  existingId: ('id' in props.orchard && props.orchard.id) || undefined,
});
</script>
