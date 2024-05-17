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
import {
  AttributeSchema,
  AttributeSchemaOptionType,
} from './filterOptionSchema';
import { useAttributionFilterOptions } from './useAttributionFilterOptions';
import { computed, ref, watch } from 'vue';
import { useQueryStore } from './queryStore';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';

const { t } = useI18n();

const store = useQueryStore();
const baseFilterDefault = computed(() => store.getBaseFilter);

const cultivarFilterOptions: AttributeSchema[] = [
  {
    name: 'id',
    label: t('filter.id'),
    options: {
      type: AttributeSchemaOptionType.Integer,
      allowEmpty: false,
      validation: {
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
        step: 1,
      },
    },
  },
  {
    name: 'name',
    label: uppercaseFirstLetter(t('filter.cultivar')),
    options: {
      type: AttributeSchemaOptionType.String,
      allowEmpty: false,
      validation: {
        maxLen: 58,
        pattern: null,
      },
    },
  },
  {
    name: 'common_name',
    label: t('filter.commonName'),
    options: {
      type: AttributeSchemaOptionType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    name: 'acronym',
    label: t('filter.acronym'),
    options: {
      type: AttributeSchemaOptionType.String,
      allowEmpty: true,
      validation: {
        maxLen: 10,
        pattern: null,
      },
    },
  },
  {
    name: 'breeder',
    label: t('filter.breeder'),
    options: {
      type: AttributeSchemaOptionType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    name: 'registration',
    label: t('filter.registration'),
    options: {
      type: AttributeSchemaOptionType.String,
      allowEmpty: true,
      validation: {
        maxLen: 255,
        pattern: null,
      },
    },
  },
  {
    name: 'note',
    label: t('filter.note'),
    options: {
      type: AttributeSchemaOptionType.String,
      allowEmpty: true,
      validation: {
        maxLen: 2047,
        pattern: null,
      },
    },
  },
  {
    name: 'created',
    label: t('filter.created'),
    options: {
      type: AttributeSchemaOptionType.Datetime,
      allowEmpty: false,
    },
  },
];

const labelPrefix = uppercaseFirstLetter(t('filter.cultivar'));
const cultivarFilterOptionsPrefixed = cultivarFilterOptions.map((item) => ({
  ...item,
  name: `cultivar.${item.name}`,
  label: `${labelPrefix} > ${item.label}`,
}));

const { fetchOptions: fetchAttributionFilterOptions } =
  useAttributionFilterOptions({ labelPrefix: t('filter.attribute') });

const { data: attributionFilterOptions, error } =
  await fetchAttributionFilterOptions();

const baseFilterOptions = ref([
  ...cultivarFilterOptionsPrefixed,
  ...attributionFilterOptions,
]);

watch(error, (error) => {
  if (error) {
    throw error;
  }
});
</script>
