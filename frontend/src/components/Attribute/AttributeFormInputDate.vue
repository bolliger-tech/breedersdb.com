<template>
  <q-date
    v-model:model-value="modelValue"
    first-day-of-week="1"
    mask="YYYY-MM-DD"
    :default-year-month="defaultYearMonth"
    minimal
    @update:model-value="(val) => updateModelValue(val?.toString() ?? null)"
  />
  <div v-if="notCurrentYearMonth" class="row align-center q-mt-sm">
    <div class="col-auto">
      <q-icon name="warning" class="text-warning" />
    </div>
    <div class="col text-caption q-ml-sm">
      {{ t('attribute.notCurrentYearMonth') }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar';
import { watch, computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';

const STORAGE_KEY = 'breedersdb-attribution-last-date-value';

const modelValue = defineModel<string | null>({ required: true });

function updateModelValue(value: string | null) {
  if (value === '' || value === null) {
    modelValue.value = null;
    return;
  }

  modelValue.value = value;
}

const { t } = useI18n();
const notCurrentYearMonth = computed(() => {
  if (modelValue.value === null) {
    return false;
  }
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  return modelValue.value.slice(0, 7) !== currentYearMonth;
});

const $q = useQuasar();
watch(modelValue, (value) => {
  if (value === null) {
    return;
  }
  $q.localStorage.set(STORAGE_KEY, new Date(`${value}T00:00:00.000Z`));
});

const defaultYearMonth = computed(() => {
  const date = $q.localStorage.getItem<Date>(STORAGE_KEY);
  if (date === null) {
    return undefined;
  }

  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}/${month}`;
});
</script>
