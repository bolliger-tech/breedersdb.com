<template>
  <q-dialog v-model="modelValue">
    <q-card>
      <q-card-section>
        <h3 class="q-ma-none nowrap-ellipsis">
          {{ t('attributionForms.missingDataDialog.title') }}
        </h3>
      </q-card-section>

      <q-separator />

      <q-card-section class="row items-start no-wrap">
        <q-icon name="warning" color="warning" size="50px" />
        <div class="on-right">
          {{ t('attributionForms.missingDataDialog.message') }}
          <ul>
            <li v-for="field in fields" :key="field.priority">
              {{ field.attribute.name }}
            </li>
          </ul>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          color="primary"
          :label="t('attributionForms.missingDataDialog.confirm')"
          @click="() => emit('confirm')"
        />
        <q-btn
          unelevated
          :label="t('attributionForms.missingDataDialog.cancel')"
          color="primary"
          @click="() => emit('cancel')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { FormField } from './AttributionAddForm.vue';

defineProps<{
  fields: FormField[];
}>();

const modelValue = defineModel<boolean>('modelValue', { required: true });

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();
</script>
