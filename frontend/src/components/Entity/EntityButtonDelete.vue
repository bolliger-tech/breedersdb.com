<template>
  <q-btn
    flat
    :label="label ? label : t('base.delete')"
    color="negative"
    :disable="disabled"
    :size="size"
    @click="confirm = true"
  />

  <q-dialog v-model="confirm" @hide="$emit('resetErrors')">
    <q-card>
      <q-card-section class="row items-center q-gutter-md">
        <slot name="message">
          <BaseMessage
            :type="error ? 'error' : 'warning'"
            :message="
              foreignKeyError || message || t('base.deleteConfirmation')
            "
            icon-size="xl"
          />
        </slot>
      </q-card-section>

      <template v-if="error && !foreignKeyError">
        <q-separator />
        <q-card-section v-if="error">
          <BaseGraphqlError :error="error" />
        </q-card-section>
        <q-separator />
      </template>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          flat
          :label="foreignKeyError ? t('base.ok') : t('base.cancel')"
          color="primary"
        />
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
import { computed, ref } from 'vue';
import type { BaseGraphqlErrorProps } from '../Base/BaseGraphqlError.vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import BaseMessage from '../Base/BaseMessage.vue';
import { singularize } from 'src/utils/stringUtils';
import { type QBtnProps } from 'quasar';

export interface EntityButtonEliminateProps {
  label?: string | undefined;
  message?: string | undefined;
  error?: BaseGraphqlErrorProps['error'] | undefined;
  fetching?: boolean | undefined;
  disabled?: boolean | undefined;
  size?: QBtnProps['size'] | undefined;
}

const props = defineProps<EntityButtonEliminateProps>();

defineEmits<{
  delete: [];
  resetErrors: [];
}>();

const foreignKeyError = computed(() => {
  const regex =
    /Foreign key violation\..* on table "([^"]+)" violates foreign key constraint.* on table "([^"]+)"/i;

  if (!props.error?.message || !regex.test(props.error.message)) {
    return null;
  }

  const [, currentTable, foreignTable] = props.error.message.match(
    regex,
  ) as string[];

  if (!currentTable || !foreignTable) {
    // this should never happen
    throw new Error('Failed to parse foreign key error message');
  }

  const currentEntity = singularize(
    currentTable.replace('plant_', '').replace('_', ' '),
  );
  const foreignEntity = foreignTable.replace('plant_', '').replace('_', ' ');

  // this is too tedious to translate…
  return `Failed to delete ${currentEntity} because some ${foreignEntity} depend on it. Delete the ${foreignEntity} first.`;
});

const { t } = useI18n();

const confirm = ref(false);
</script>
