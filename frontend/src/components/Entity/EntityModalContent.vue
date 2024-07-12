<template>
  <q-card style="width: clamp(310px, 90vw, 1000px); max-width: unset">
    <q-card-section class="row items-center q-py-sm">
      <div style="width: calc(100% - 34px)">
        <slot name="title">
          <div class="row items-center no-wrap">
            <BaseSpriteIcon
              v-if="spriteIcon"
              :name="spriteIcon"
              color="grey-7"
              size="50px"
              class="q-mr-sm q-my-sm"
            />
            <div
              class="q-my-xs"
              :style="`max-width: ${spriteIcon ? 'calc(100% - 58px)' : '100%'}`"
            >
              <h2
                v-if="title || $slots['title-text']"
                class="q-ma-none nowrap-elipsis"
              >
                <slot name="title-text">{{ title }}</slot>
              </h2>
              <h3
                v-if="subtitle || $slots['subtitle-text']"
                class="text-body1 q-ma-none nowrap-elipsis"
              >
                <slot name="subtitle-text">{{ subtitle }}</slot>
              </h3>
            </div>
          </div>
        </slot>
      </div>
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
          <EntityButtonDelete
            @delete="$emit('delete')"
            @reset-errors="$emit('resetErrors')"
          />
        </slot>
      </div>
      <div>
        <slot name="action-right">
          <template v-if="onEdit">
            <q-btn
              flat
              :label="t('base.edit')"
              color="primary"
              @click="$emit('edit')"
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
              @click="$emit('cancel')"
            />
            <q-btn
              flat
              :label="t('base.save')"
              color="primary"
              :loading="loading"
              @click="$emit('save')"
              @mouseleave="$emit('resetErrors')"
              @focusout="$emit('resetErrors')"
            />
            <BaseErrorTooltip
              :graph-q-l-error="saveError"
              :message="validationError"
            />
          </template>
        </slot>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityButtonDelete from './EntityButtonDelete.vue';
import { CombinedError } from '@urql/vue';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import { SpriteIcons } from '../Base/BaseSpriteIcon/types';
import BaseErrorTooltip from 'src/components/Base/BaseErrorTooltip.vue';

export interface EntityModalContentProps {
  title?: string;
  subtitle?: string;
  spriteIcon?: SpriteIcons;
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
  'title-text': [];
  'subtitle-text': [];
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

<style lang="scss" scoped>
.nowrap-elipsis {
  white-space: nowrap;
  overflow-x: clip;
  text-overflow: ellipsis;
}

:global(.body--dark .entity-modal-content__error-tooltip) {
  border: 1px solid $grey-7;
}
</style>
