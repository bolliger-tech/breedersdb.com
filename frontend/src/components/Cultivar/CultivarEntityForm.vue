<template>
  <BaseInputLabel :label="t('cultivars.type')" class="q-mb-md">
    <q-btn-toggle
      v-model="type"
      unelevated
      rounded
      toggle-color="primary"
      style="border: 1px solid var(--q-primary)"
      :options="[
        {
          label: t('cultivars.breedersCultivar', 1),
          value: 'breeders_cultivar',
        },
        { label: t('cultivars.variety', 1), value: 'variety' },
      ]"
    />
  </BaseInputLabel>
  <LotSelect
    v-if="type === 'breeders_cultivar'"
    :ref="(el: InputRef) => (refs.lotId = el)"
    v-model="data.lot_id"
    required
    @update:model-value="() => refs.nameInputs?.validate()"
  />
  <CultivarNameInputs
    v-if="type === 'breeders_cultivar'"
    :ref="(el: InputRef) => (refs.nameInputs = el)"
    v-model:name-segment="data.name_segment"
    v-model:name-override="data.name_override"
    :cultivar-id="('id' in props.cultivar && props.cultivar.id) || undefined"
    :lot-id="data.lot_id || undefined"
  />
  <CultivarNameOverrideInput
    v-if="type === 'variety'"
    :ref="(el: InputRef) => (refs.nameOverride = el)"
    v-model="data.name_override"
    :full-name="undefined"
    :hint="`${t('cultivars.nameOverrideHint')}. ${t('base.required')}.`"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.acronym = el)"
    v-model="data.acronym"
    :label="t('cultivars.fields.acronym')"
    type="text"
    autocomplete="off"
  />
  <EntityInput
    v-if="type === 'variety'"
    :ref="(el: InputRef) => (refs.breeder = el)"
    v-model="data.breeder"
    :label="t('cultivars.fields.breeder')"
    type="text"
    autocomplete="off"
  />
  <EntityInput
    v-if="type === 'variety'"
    :ref="(el: InputRef) => (refs.registration = el)"
    v-model="data.registration"
    :label="t('cultivars.fields.registration')"
    type="text"
    autocomplete="off"
  />
  <EntityInput
    :ref="(el: InputRef) => (refs.note = el)"
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
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import { watch } from 'vue';
import { makeModalPersistentSymbol } from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import {
  CultivarEditInput,
  CultivarInsertInput,
} from './CultivarModalEdit.vue';
import { InputRef, useEntityForm } from 'src/composables/useEntityForm';
import LotSelect from 'src/components/Lot/LotSelect.vue';
import CultivarNameInputs from './CultivarNameInputs.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import CultivarNameOverrideInput from './CultivarNameOverrideInput.vue';

export interface CultivarEntityFormProps {
  cultivar: CultivarInsertInput | CultivarEditInput;
  isVariety: boolean;
}

const props = defineProps<CultivarEntityFormProps>();
const emits = defineEmits<{
  change: [data: typeof data.value];
}>();
// for defineExpose() see below

const initialData = {
  name_segment: props.cultivar.name_segment,
  name_override: props.cultivar.name_override,
  lot_id: props.cultivar.lot_id || null,
  acronym: props.cultivar.acronym,
  breeder: props.cultivar.breeder,
  registration: props.cultivar.registration,
  note: props.cultivar.note,
};

const data = ref({ ...initialData });

const refs = ref<{ [key: string]: InputRef | null }>({
  nameInputs: null,
  nameOverride: null,
  lotId: null,
  acronym: null,
  breeder: null,
  registration: null,
  note: null,
});

const type = ref<'breeders_cultivar' | 'variety'>(
  props.isVariety ? 'variety' : 'breeders_cultivar',
);

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
