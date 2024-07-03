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
    >
      <!-- inputmode="tel": numeric keyboard with # -->
      <q-input
        v-model="input"
        :autofocus="true"
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
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import BaseInputLabel from '../Base/BaseInputLabel.vue';
import BaseQrScanner from '../Base/BaseQrScanner.vue';
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

export interface PlantSelectorProps {
  rejectEliminated?: boolean;
}

const props = withDefaults(defineProps<PlantSelectorProps>(), {
  rejectEliminated: false,
});

const emit = defineEmits<{
  plant: [data: PlantFragment | null];
  fetching: [data: boolean];
}>();
onMounted(() => emit('plant', null));

defineExpose({ onManualInput });

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
      $label_id: String!
      $withSegments: Boolean = true
      $withAttributions: Boolean = false
    ) {
      plants(where: { label_id: { _eq: $label_id } }) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

const variables = computed(() => ({ label_id: labelId.value }));

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
    emit('plant', d.plants[0]);
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

async function loadPlant() {
  if (error.value && error.value.type !== 'notFound') {
    return;
  }

  await nextTick(); // ensure the useQuery({variables}) is updated
  await executeQuery();
}
</script>
