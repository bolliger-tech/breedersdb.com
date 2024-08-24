<template>
  <div class="q-gutter-md">
    <q-btn-toggle
      v-model="inputMethod"
      :options="options"
      size="sm"
      toggle-color="primary"
    />

    <BaseInputLabel
      v-if="inputMethod === 'keyboard-plant'"
      :label="t('plantGroups.plantLabelId')"
    >
      <EntityLabelIdInput
        ref="inputRef"
        :model-value="input"
        :error-message="error?.message"
        entity-type="plant"
        @update:model-value="
          {
            input = $event ?? '';
            data = undefined;
          }
        "
        @keyup.enter="onManualInput"
      />
    </BaseInputLabel>

    <BaseInputLabel
      v-else-if="inputMethod === 'keyboard-plant-group'"
      :label="t('plantGroups.plantGroupLabelId')"
    >
      <EntityLabelIdInput
        ref="inputRef"
        :model-value="input"
        :error-message="error?.message"
        entity-type="plantGroup"
        @update:model-value="
          {
            input = $event ?? '';
            data = undefined;
          }
        "
        @keyup.enter="onManualInput"
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
import BaseQrScanner from '../Base/BaseQrScanner/BaseQrScanner.vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import EntityLabelIdInput from 'src/components/Entity/EntityLabelIdInput.vue';
import {
  plantGroupLabelIdUtils,
  plantLabelIdUtils,
} from 'src/utils/labelIdUtils';
import { computed } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import { PlantGroupFragment, plantGroupFragment } from './plantGroupFragment';
import { onMounted } from 'vue';
import { type QInput } from 'quasar';

export interface PlantGroupSelectorProps {
  rejectDisabled?: boolean;
}

const props = withDefaults(defineProps<PlantGroupSelectorProps>(), {
  rejectDisabled: false,
});

const emit = defineEmits<{
  plantGroup: [data: PlantGroupFragment | null];
  fetching: [data: boolean];
}>();
onMounted(() => emit('plantGroup', null));

const inputRef = ref<QInput | null>(null);

defineExpose({
  onManualInput,
  focus: () => {
    inputRef.value?.focus();
  },
});

const LOCALSTORAGE_KEY = 'breedersdb-plant-group-selector-input-method';

const { t } = useI18n();
const { localStorage } = useQuasar();

type InputMethod = 'camera' | 'keyboard-plant' | 'keyboard-plant-group';
const inputMethod = ref<InputMethod>(
  localStorage.getItem<InputMethod>(LOCALSTORAGE_KEY) ?? 'camera',
);
watch(inputMethod, (v) => localStorage.set(LOCALSTORAGE_KEY, v));

const options = [
  {
    value: 'camera',
    label: t('plantGroups.scanQrCode'),
    icon: 'qr_code_scanner',
  },
  {
    value: 'keyboard-plant',
    label: t('plantGroups.enterPlantLabelId'),
    icon: 'keyboard',
  },
  {
    value: 'keyboard-plant-group',
    label: t('plantGroups.enterGroupLabelId'),
    icon: 'keyboard',
  },
];

const input = ref<string>('');
const labelId = ref<string>('');

const labelUtils = computed(() =>
  inputMethod.value === 'keyboard-plant'
    ? plantLabelIdUtils
    : plantGroupLabelIdUtils,
);

const error = computed<
  | {
      type: 'notFound' | 'invalidFormat' | 'disabledNotAllowed';
      message: string;
    }
  | undefined
>(() => {
  if (labelId.value.length > 0 && !labelUtils.value.isValid(labelId.value))
    return {
      type: 'invalidFormat',
      message: t('plantGroups.errors.labelIdinvalid'),
    };

  if (data.value?.plant_groups.length === 0 && labelId.value.length > 0)
    return {
      type: 'notFound',
      message:
        inputMethod.value === 'keyboard-plant'
          ? t('plants.errors.labelIdNotFound', {
              labelId: labelId.value,
            })
          : t('plantGroups.errors.labelIdNotFound', {
              labelId: labelId.value,
            }),
    };

  if (data.value?.plant_groups[0]?.disabled && props.rejectDisabled)
    return {
      type: 'disabledNotAllowed',
      message: t('plantGroups.errors.disabledNotAllowed'),
    };

  return undefined;
});

const queryPlantGroupByLabelId = graphql(
  `
    query PlantGroupByLabelId(
      $labelId: String!
      $PlantGroupWithCultivar: Boolean! = true
      $CultivarWithLot: Boolean! = true
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      plant_groups(where: { label_id: { _eq: $labelId } }) {
        ...plantGroupFragment
      }
    }
  `,
  [plantGroupFragment],
);
const queryPlantGroupByPlantLabelId = graphql(
  `
    query PlantGroupByPlantLabelId(
      $labelId: String!
      $PlantGroupWithCultivar: Boolean! = true
      $CultivarWithLot: Boolean! = true
      $LotWithCrossing: Boolean! = true
      $LotWithOrchard: Boolean! = false
    ) {
      plant_groups(where: { plants: { label_id: { _eq: $labelId } } }) {
        ...plantGroupFragment
      }
    }
  `,
  [plantGroupFragment],
);
const labelIdForQuery = computed(() => ({
  labelId:
    inputMethod.value === 'keyboard-plant-group'
      ? `G${labelId.value}`
      : labelId.value,
}));
const plantGroupQuery = computed(() =>
  labelIdForQuery.value.labelId.startsWith('G')
    ? queryPlantGroupByLabelId
    : queryPlantGroupByPlantLabelId,
);

const {
  executeQuery,
  fetching,
  data,
  error: fetchError,
} = await useQuery({
  query: plantGroupQuery,
  variables: labelIdForQuery,
  pause: true,
});

watch(fetching, (f) => emit('fetching', f));
onBeforeUnmount(() => emit('fetching', false));

watch(data, (d) => {
  if (d?.plant_groups.length) {
    emit('plantGroup', d.plant_groups[0]);
  }
});

function onManualInput() {
  labelId.value = input.value;
  loadPlantGroup();
}

function onQrInput(data: string) {
  labelId.value = data;
  loadPlantGroup();
}

async function loadPlantGroup() {
  console.log('load plant group');
  if (error.value && error.value.type !== 'notFound') {
    return;
  }

  await nextTick(); // ensure the useQuery({variables}) is updated
  await executeQuery();
}
</script>
