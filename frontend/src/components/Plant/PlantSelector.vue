<template>
  <div class="q-gutter-md">
    <q-btn-toggle
      v-model="inputMethod"
      :options="options"
      size="sm"
      toggle-color="primary"
    />

    <BaseInputLabel
      v-if="inputMethod === 'keyboard'"
      :label="t('plants.fields.labelId')"
      dense
      :label-small="labelSmall"
    >
      <!-- inputmode="tel": numeric keyboard with # -->
      <q-input
        ref="inputRef"
        v-model="input"
        inputmode="tel"
        outlined
        type="text"
        :error-message="error?.message"
        :error="!!error"
        :hint="t('plants.hints.labelIdOmitZeros')"
        @keyup.enter="onManualInput"
        @blur="() => (input = zeroFill(input))"
        @focus="() => (input = getSignificantDigits(input))"
      />
    </BaseInputLabel>

    <div v-else>
      <BaseQrScanner
        :error-message="error?.message"
        :error="!!error"
        @change="onQrInput"
      />
    </div>

    <BaseGraphqlError v-if="fetchError" :error="fetchError" />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import {
  ref,
  watch,
  nextTick,
  onBeforeUnmount,
  ComponentPublicInstance,
} from 'vue';
import BaseInputLabel from '../Base/BaseInputLabel.vue';
import BaseQrScanner from '../Base/BaseQrScanner/BaseQrScanner.vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import {
  isPrefixed,
  isValid,
  zeroFill,
  getSignificantDigits,
} from 'src/utils/labelIdUtils';
import { computed } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import { PlantFragment, plantFragment } from './plantFragment';
import { onMounted } from 'vue';
import { type QInput } from 'quasar';

export interface PlantSelectorProps {
  rejectEliminated?: boolean;
  labelSmall?: boolean;
}

export interface PlantSelectorEmits {
  (e: 'plant', data: PlantFragment | null): void;
  (e: 'fetching', data: boolean): void;
}

export type PlantSelectorInstance =
  ComponentPublicInstance<PlantSelectorProps> & {
    onManualInput: () => void;
    focus: () => void;
  };

const props = withDefaults(defineProps<PlantSelectorProps>(), {
  rejectEliminated: false,
});

const emit = defineEmits<PlantSelectorEmits>();
onMounted(() => emit('plant', null));

const inputRef = ref<QInput | null>(null);

const modelValue = defineModel<number | null | undefined>({ required: false });

defineExpose({
  onManualInput,
  focus: () => {
    inputRef.value?.focus();
  },
});

const LOCALSTORAGE_KEY = 'breedersdb-plant-selector-input-method';

const { t } = useI18n();
const { localStorage } = useQuasar();

const inputMethod = ref<'camera' | 'keyboard'>(
  localStorage.getItem<'camera' | 'keyboard'>(LOCALSTORAGE_KEY) ?? 'camera',
);
watch(inputMethod, (v) => localStorage.set(LOCALSTORAGE_KEY, v));

const options = [
  { value: 'camera', label: t('plants.scanQrCode'), icon: 'qr_code_scanner' },
  { value: 'keyboard', label: t('plants.enterLabelId'), icon: 'keyboard' },
];

const input = ref<string>('');
const labelId = ref<string>('');

const error = computed<
  | {
      type: 'notFound' | 'invalidFormat' | 'eliminatedNotAllowed';
      message: string;
    }
  | undefined
>(() => {
  if (labelId.value.length > 0 && !isValid(labelId.value))
    return {
      type: 'invalidFormat',
      message: t('plants.errors.labelIdinvalid'),
    };

  if (props.rejectEliminated && isPrefixed(labelId.value))
    return {
      type: 'eliminatedNotAllowed',
      message: t('plants.errors.eliminatedNotAllowed'),
    };

  if (data.value?.plants.length === 0)
    return {
      type: 'notFound',
      message: t('plants.errors.labelIdNotFound', { labelId: labelId.value }),
    };

  return undefined;
});

const query = graphql(
  `
    query PlantByLabelId(
      $where: plants_bool_exp!
      $PlantWithSegments: Boolean = true
    ) {
      plants(where: $where) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

const variables = computed(() => ({
  where: !!labelId.value.length
    ? { label_id: { _eq: labelId.value } }
    : { id: { _eq: modelValue.value } },
}));

console.log(modelValue.value);

const {
  executeQuery,
  fetching,
  data,
  error: fetchError,
} = useQuery({
  query,
  pause: true,
  variables,
});

watch(fetching, (f) => emit('fetching', f));
onBeforeUnmount(() => emit('fetching', false));

watch(data, (d) => {
  if (d?.plants.length) {
    const plant = d.plants[0];
    modelValue.value = plant.id;
    emit('plant', plant);
    input.value = plant.label_id;
  }
});

function onManualInput() {
  input.value = zeroFill(input.value);
  labelId.value = input.value;
  loadPlant();
}

function onQrInput(data: string) {
  labelId.value = data;
  loadPlant();
}

if (modelValue.value) {
  loadPlant();
}

async function loadPlant() {
  if (error.value && error.value.type !== 'notFound') {
    return;
  }

  await nextTick(); // ensure the useQuery({variables}) is updated
  await executeQuery();
}
</script>
