<template>
  <AttributeModalEdit :attribute="attribute" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import AttributeModalEdit, {
  AttributeInsertInput,
} from 'src/components/Attribute/AttributeModalEdit.vue';

const attribute: AttributeInsertInput = {
  name: '',
  validation_rule: null,
  data_type: 'TEXT',
  description: null,
  attribute_type: 'OBSERVATION',
  disabled: false,
  legend: null,
  default_value: null,
};

const { t } = useI18n();
</script>
