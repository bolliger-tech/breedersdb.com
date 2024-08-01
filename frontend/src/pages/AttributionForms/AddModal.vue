<template>
  <AttributionFormModalEdit
    :attribution-form="attributionForm"
    :title="t('base.new')"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import AttributionFormModalEdit, {
  type AttributionFormInsertInput,
} from 'src/components/AttributionForm/AttributionFormModalEdit.vue';

const attributionForm: AttributionFormInsertInput = {
  name: '',
  description: null,
  disabled: false,
  attribution_form_fields: [],
};

const { t } = useI18n();
</script>
