<template>
  <div>
    <BaseInputLabel
      :label="t('entity.picker.inputMethod', { entity: entityName })"
      class="q-mb-md"
    >
      <q-btn-toggle
        v-model="inputMethod"
        :options="options"
        size="sm"
        :dense="!$q.screen.gt.xs && options.length > 4"
        toggle-color="primary"
        stack
      />
    </BaseInputLabel>

    <div v-if="inputMethod === 'qr-code'" class="q-py-sm">
      <BaseQrScanner
        ref="inputRef"
        :error-message="error"
        :error="!!error"
        @change="onQrInput"
      />
    </div>

    <BaseInputLabel
      v-else-if="inputMethod === 'plant-label-id'"
      :label="t('entity.picker.plantLabelId')"
    >
      <EntityLabelIdInput
        ref="inputRef"
        :model-value="plantLabelId"
        :error-message="error"
        entity-type="plant"
        @update:model-value="plantLabelId = $event ?? ''"
        @keyup.enter="
          emit('input', {
            plantLabelId: plantLabelIdUtils.zeroFill(plantLabelId),
            plantGroupLabelId: '',
            plantGroupId: null,
            cultivarId: null,
            lotId: null,
          })
        "
      />
    </BaseInputLabel>

    <BaseInputLabel
      v-else-if="inputMethod === 'plant-group-label-id'"
      :label="t('entity.picker.plantGroupLabelId')"
    >
      <EntityLabelIdInput
        ref="inputRef"
        :model-value="plantGroupLabelId"
        :error-message="error"
        entity-type="plantGroup"
        @update:model-value="plantGroupLabelId = $event ?? ''"
        @keyup.enter="
          emit('input', {
            plantLabelId: '',
            plantGroupLabelId: plantGroupLabelIdUtils.addPrefix(
              plantGroupLabelIdUtils.zeroFill(plantGroupLabelId),
            ),
            plantGroupId: null,
            cultivarId: null,
            lotId: null,
          })
        "
      />
    </BaseInputLabel>

    <PlantGroupSelect
      v-else-if="inputMethod === 'plant-group-select'"
      ref="inputRef"
      v-model="plantGroupId"
      :label="t('entity.picker.plantGroupSelect')"
      required
      @update:model-value="
        emit('input', {
          plantLabelId: '',
          plantGroupLabelId: '',
          plantGroupId: $event ?? null,
          cultivarId: null,
          lotId: null,
        })
      "
    />

    <CultivarSelect
      v-else-if="inputMethod === 'cultivar-select'"
      ref="inputRef"
      v-model="cultivarId"
      required
      request-policy="cache-first"
      :label="t('entity.picker.cultivarName')"
      @update:model-value="
        emit('input', {
          plantLabelId: '',
          plantGroupLabelId: '',
          plantGroupId: null,
          cultivarId: $event ?? null,
          lotId: null,
        })
      "
    />

    <LotSelect
      v-else-if="inputMethod === 'lot-select'"
      ref="inputRef"
      v-model="lotId"
      options="no_varieties"
      required
      request-policy="cache-first"
      :label="t('entity.picker.lotName')"
      @update:model-value="
        emit('input', {
          plantLabelId: '',
          plantGroupLabelId: '',
          plantGroupId: null,
          cultivarId: null,
          lotId: $event ?? null,
        })
      "
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { QBtnToggleProps } from 'quasar';
import { useQuasar } from 'quasar';
import { computed, nextTick, ref, watch } from 'vue';
import { toKebabCase } from 'src/utils/stringUtils';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import BaseQrScanner from 'src/components/Base/BaseQrScanner/BaseQrScanner.vue';
import EntityLabelIdInput from 'src/components/Entity/EntityLabelIdInput.vue';
import CultivarSelect from 'src/components/Cultivar/CultivarSelect.vue';
import LotSelect from 'src/components/Lot/LotSelect.vue';
import {
  plantGroupLabelIdUtils,
  plantLabelIdUtils,
} from 'src/utils/labelIdUtils';
import PlantGroupSelect from '../PlantGroup/PlantGroupSelect.vue';

type InputMethod =
  | 'qr-code'
  | 'plant-label-id'
  | 'plant-group-label-id'
  | 'plant-group-select'
  | 'cultivar-select'
  | 'lot-select';

export interface EntityPickerProps {
  entityType: 'plant' | 'plantGroup' | 'cultivar' | 'lot';
  error?: string | undefined;
}

const props = defineProps<EntityPickerProps>();

const emit = defineEmits<{
  input: [
    data: {
      plantLabelId: string | null;
      plantGroupLabelId: string | null;
      plantGroupId: number | null;
      cultivarId: number | null;
      lotId: number | null;
    },
  ];
}>();

/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */
type InputComponent = InstanceType<
  | typeof BaseQrScanner
  | typeof EntityLabelIdInput
  | typeof CultivarSelect
  | typeof LotSelect
>;
/* eslint-enable @typescript-eslint/no-duplicate-type-constituents */

const inputRef = ref<InputComponent | null>(null);

const plantLabelId = ref<string | null>(null);
const plantGroupLabelId = ref<string | null>(null);
const plantGroupId = ref<number | null>(null);
const cultivarId = ref<number | null>(null);
const lotId = ref<number | null>(null);

defineExpose({
  focus: () => inputRef.value?.focus(),
  emitInputs,
});

function emitInputs() {
  const _plantLabelId = plantLabelId.value
    ? plantLabelIdUtils.zeroFill(plantLabelId.value)
    : null;

  const _plantGroupLabelId = plantGroupLabelId.value
    ? plantGroupLabelIdUtils.addPrefix(
        plantGroupLabelIdUtils.zeroFill(plantGroupLabelId.value),
      )
    : null;

  emit('input', {
    plantLabelId: _plantLabelId,
    plantGroupLabelId: _plantGroupLabelId,
    plantGroupId: plantGroupId.value,
    cultivarId: cultivarId.value,
    lotId: lotId.value,
  });
}

const localStorageKey = computed(
  () => `breedersdb-${toKebabCase(props.entityType)}-selector-input-method`,
);
const { localStorage } = useQuasar();
const inputMethod = ref<InputMethod>(
  localStorage.getItem<InputMethod>(localStorageKey.value) ?? 'qr-code',
);
watch(inputMethod, (v) => localStorage.set(localStorageKey.value, v));

const inputMethodIsValid = computed(() => {
  if (inputMethod.value === 'qr-code') return true;
  switch (props.entityType) {
    case 'plant':
      return inputMethod.value === 'plant-label-id';
    case 'plantGroup':
      return (
        inputMethod.value === 'plant-label-id' ||
        inputMethod.value === 'plant-group-label-id' ||
        inputMethod.value === 'plant-group-select'
      );
    case 'cultivar':
      return (
        inputMethod.value === 'plant-label-id' ||
        inputMethod.value === 'plant-group-label-id' ||
        inputMethod.value === 'plant-group-select' ||
        inputMethod.value === 'cultivar-select'
      );
    case 'lot':
      return (
        inputMethod.value === 'plant-label-id' ||
        inputMethod.value === 'plant-group-label-id' ||
        inputMethod.value === 'plant-group-select' ||
        inputMethod.value === 'cultivar-select' ||
        inputMethod.value === 'lot-select'
      );
  }
  // @ts-expect-error don't move into switch so ts complains if we add a new entity type
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown entity type: ${props.entityType}`);
});
watch(
  [() => props.entityType, inputMethod],
  () => inputMethodIsValid.value || (inputMethod.value = 'qr-code'),
  { immediate: true },
);

const { t } = useI18n();

const options = computed(() => {
  const options: {
    value: InputMethod;
    label: NonNullable<QBtnToggleProps['options'][0]['label']>;
    icon: NonNullable<QBtnToggleProps['options'][0]['icon']>;
  }[] = [
    {
      value: 'qr-code',
      label: t('entity.picker.scanQrCode'),
      icon: 'qr_code_scanner',
    },
    {
      value: 'plant-label-id',
      label: t('entity.picker.plantLabelId'),
      icon: 'svguse:/icons/sprite.svg#tree',
    },
  ];

  if (props.entityType === 'plant') return options;

  options.push({
    value: 'plant-group-label-id',
    label: t('entity.picker.plantGroupLabelId'),
    icon: 'svguse:/icons/sprite.svg#tree-group',
  });

  options.push({
    value: 'plant-group-select',
    label: t('entity.picker.plantGroupSelect'),
    icon: 'svguse:/icons/sprite.svg#tree-group',
  });

  if (props.entityType === 'plantGroup') return options;

  options.push({
    value: 'cultivar-select',
    label: t('entity.picker.cultivarName'),
    icon: 'svguse:/icons/sprite.svg#cultivar',
  });

  if (props.entityType === 'cultivar') return options;

  options.push({
    value: 'lot-select',
    label: t('entity.picker.lotName'),
    icon: 'svguse:/icons/sprite.svg#lot',
  });

  return options;
});

const entityName = computed(() => {
  switch (props.entityType) {
    case 'plant':
      return t('base.entityName.plant', 1);
    case 'plantGroup':
      return t('base.entityName.plantGroup', 1);
    case 'cultivar':
      return t('base.entityName.cultivar', 1);
    case 'lot':
      return t('base.entityName.lot', 1);
  }
  // @ts-expect-error don't move into switch so ts complains if we add a new entity type
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown entity type: ${props.entityType}`);
});

async function onQrInput(value: string) {
  const _plantGroupLabelId = value && value.startsWith('G') ? value : null;
  const _plantLabelId = !_plantGroupLabelId ? value : null;

  if (!_plantLabelId && !_plantGroupLabelId) {
    return;
  }

  plantLabelId.value = _plantLabelId;
  plantGroupLabelId.value = _plantGroupLabelId;
  plantGroupId.value = null;
  cultivarId.value = null;
  lotId.value = null;

  await nextTick();
  emitInputs();
}
</script>
