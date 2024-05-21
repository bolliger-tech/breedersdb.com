<template>
  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('cultivars.analyze.filter.cultivarFilter') }}
  </p>
  <QueryFilterTreeRoot
    :filter="baseFilterDefault"
    :options="baseFilterOptions"
  />
  <!-- <p class="text-overline q-mb-none q-mt-lg">
    {{ t('filter.attributionFilter') }}
  </p>
  <QueryFilterTreeRoot
    :filter="attributionFilterDefault"
    :options="attributionOptions"
  /> -->
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryFilterTreeRoot from './QueryFilterTreeRoot.vue';
import { useAttributionFilterOptions } from './useAttributionFilterOptions';
import { computed, ref, watch } from 'vue';
import { useQueryStore } from './queryStore';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import { FilterColumn } from './filterColumn';
import { FilterRuleType } from './filterRuleTypes';

const { t } = useI18n();

const store = useQueryStore();
const baseFilterDefault = computed(() => store.getBaseFilter);

const labelPrefix = uppercaseFirstLetter(t('filter.cultivar')) + ' > ';
const cultivarFilterOptions: FilterColumn[] = [
  new FilterColumn('cultivar', 'id', labelPrefix + t('filter.id'), {
    type: FilterRuleType.Integer,
    allowEmpty: false,
    validation: {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
      step: 1,
    },
  }),
  new FilterColumn(
    'cultivar',
    'name',
    labelPrefix + uppercaseFirstLetter(t('filter.cultivar')),
    {
      type: FilterRuleType.String,
      allowEmpty: false,
      validation: {
        maxLen: 58,
        pattern: null,
      },
    },
  ),
  new FilterColumn(
    'cultivar',
    'common_name',
    labelPrefix + t('filter.commonName'),
    {
      type: FilterRuleType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  ),
  new FilterColumn('cultivar', 'acronym', labelPrefix + t('filter.acronym'), {
    type: FilterRuleType.String,
    allowEmpty: true,
    validation: {
      maxLen: 10,
      pattern: null,
    },
  }),
  new FilterColumn('cultivar', 'breeder', labelPrefix + t('filter.breeder'), {
    type: FilterRuleType.String,
    allowEmpty: true,
    validation: {
      maxLen: 255,
      pattern: null,
    },
  }),
  new FilterColumn(
    'cultivar',
    'registration',
    labelPrefix + t('filter.registration'),
    {
      type: FilterRuleType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  ),
  new FilterColumn('cultivar', 'note', labelPrefix + t('filter.note'), {
    type: FilterRuleType.String,
    allowEmpty: true,
    validation: {
      maxLen: 2047,
      pattern: null,
    },
  }),
  new FilterColumn('cultivar', 'created', labelPrefix + t('filter.created'), {
    type: FilterRuleType.Datetime,
    allowEmpty: false,
  }),
];

const { fetchOptions: fetchAttributionFilterOptions } =
  useAttributionFilterOptions({ labelPrefix: t('filter.attribute') });

const { data: attributionFilterOptions, error } =
  await fetchAttributionFilterOptions();

const baseFilterOptions = ref([
  ...cultivarFilterOptions,
  ...attributionFilterOptions,
]);

watch(error, (error) => {
  if (error) {
    throw error;
  }
});
</script>
