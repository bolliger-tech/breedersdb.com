<template>
  <q-card style="width: clamp(310px, 90vw, 1000px); max-width: unset">
    <q-card-section class="row items-center q-py-sm">
      <slot name="title"
        ><h4 class="q-my-sm">{{ title }}</h4></slot
      >
      <q-space />
      <q-btn v-close-popup icon="close" flat round dense />
    </q-card-section>

    <q-separator />

    <q-card-section style="max-height: calc(100vh - 200px)" class="scroll">
      <slot></slot>
    </q-card-section>

    <q-separator />

    <q-card-actions align="between">
      <div>
        <slot name="action-left">
          <EntityButtonDelete @delete="() => $emit('delete')" />
        </slot>
      </div>
      <div>
        <slot name="action-right">
          <template v-if="onEdit">
            <q-btn
              flat
              :label="t('base.edit')"
              color="primary"
              @click="() => $emit('edit')"
            />
            <q-btn
              v-close-popup
              flat
              :label="t('base.close')"
              color="primary"
            />
          </template>
          <template v-if="onSave">
            <q-btn
              flat
              :label="t('base.cancel')"
              color="primary"
              @click="() => $emit('cancel')"
            />
            <q-btn
              flat
              :label="t('base.save')"
              color="primary"
              :loading="loading"
              @click="() => $emit('save')"
              @mouseleave="() => $emit('resetErrors')"
              @focusout="() => $emit('resetErrors')"
            />
            <q-tooltip
              :model-value="!!saveError || !!validationError"
              max-width="250px"
              anchor="top middle"
              self="bottom middle"
              :hide-delay="2000"
              no-parent-event
              class="bg-dark shadow-3 entity-modal-content__error-tooltip"
            >
              <BaseGraphqlError v-if="saveError" :error="saveError" />
              <div
                v-else-if="validationError"
                class="q-gutter-md row items-center"
              >
                <div class="col-auto">
                  <q-icon name="warning" size="2em" class="text-negative" />
                </div>
                <div class="col">
                  {{ validationError }}
                </div>
              </div>
            </q-tooltip>
          </template>
        </slot>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityButtonDelete from './EntityButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { CombinedError } from '@urql/vue';

export interface EntityModalContentProps {
  title?: string;
  loading?: boolean;
  saveError?: CombinedError;
  validationError?: string | null;
  // make emit handler available in template
  onSave?: () => void;
  onEdit?: () => void;
}

defineProps<EntityModalContentProps>();
defineSlots<{
  title: [];
  default: [];
  'action-left': [];
  'action-right': [];
}>();
defineEmits<{
  edit: [];
  delete: [];
  cancel: [];
  save: [];
  resetErrors: [];
}>();

const { t } = useI18n();
</script>
