<template>
  <q-btn
    flat
    :label="label ? label : t('base.delete')"
    color="negative"
    :disable="disabled"
    @click="confirm = true"
  />

  <q-dialog v-model="confirm" @hide="$emit('resetErrors')">
    <q-card>
      <q-card-section class="row items-center q-gutter-md">
        <slot name="message">
          <div class="col-auto">
            <q-avatar icon="warning" color="negative" text-color="white" />
          </div>
          <div class="col">
            {{ message ? message : t('base.deleteConfirmation') }}
          </div>
        </slot>
      </q-card-section>

      <template v-if="error">
        <q-separator />
        <q-card-section v-if="error">
          <BaseGraphqlError :error="error" />
        </q-card-section>
        <q-separator />
      </template>

      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('base.cancel')" color="primary" />
        <q-btn
          v-if="!error"
          flat
          :label="label ? label : t('base.delete')"
          :loading="fetching"
          color="negative"
          @click="$emit('delete')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import BaseGraphqlError, {
  BaseGraphqlErrorProps,
} from '../Base/BaseGraphqlError.vue';

export interface EntityButtonEliminateProps {
  label?: string;
  message?: string;
  error?: BaseGraphqlErrorProps['error'];
  fetching?: boolean;
  disabled?: boolean;
}

defineProps<EntityButtonEliminateProps>();

const { t } = useI18n();

const confirm = ref(false);

defineEmits<{
  delete: [];
  resetErrors: [];
}>();
</script>
