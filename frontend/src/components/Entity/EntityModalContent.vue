<template>
  <q-card style="width: clamp(310px, 90dvw, 1000px); max-width: unset">
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
                class="q-ma-none nowrap-ellipsis"
              >
                <slot name="title-text">{{ title }}</slot>
              </h2>
              <h3
                v-if="subtitle || $slots['subtitle-text']"
                class="text-body1 q-ma-none nowrap-ellipsis"
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

    <q-card-section class="scroll entity-modal-content__default">
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
              v-if="printData"
              flat
              :label="t('base.print')"
              color="primary"
              @click="() => print(printData as string)"
            />
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
            <EntityModalContentSave
              :loading="loading"
              v-on="{
                save: () => $emit('save'),
                ...(onSaveThenPrint && {
                  saveThenPrint: () => $emit('saveThenPrint'),
                }),
                ...(onSaveThenNewFromTemplate && {
                  saveThenNewFromTemplate: () =>
                    $emit('saveThenNewFromTemplate'),
                }),
                saveThenPrintThenNewFromTemplate: () =>
                  $emit('saveThenPrintThenNewFromTemplate'),
              }"
            />
            <BaseErrorTooltip
              :graphql-error="saveError"
              :message="validationError"
              @close="$emit('resetErrors')"
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
import EntityModalContentSave from './EntityModalContentSave.vue';
import type { CombinedError } from '@urql/vue';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import type { SpriteIcons } from '../Base/BaseSpriteIcon/types';
import BaseErrorTooltip from 'src/components/Base/BaseErrorTooltip.vue';
import type { Slot } from 'vue';
import { usePrint } from 'src/composables/usePrint';

export interface EntityModalContentProps {
  title?: string | undefined;
  subtitle?: string | undefined;
  spriteIcon?: SpriteIcons | undefined;
  loading?: boolean | undefined;
  saveError?: CombinedError | undefined;
  validationError?: string | null | undefined;
  printData?: string | undefined; // only used if onEdit is available
  // make emit handler available in template
  onSave?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onSaveThenPrint?: (() => void) | undefined;
  onSaveThenNewFromTemplate?: (() => void) | undefined;
}

defineProps<EntityModalContentProps>();
defineSlots<{
  title: Slot;
  'title-text': Slot;
  'subtitle-text': Slot;
  default: Slot;
  'action-left': Slot;
  'action-right': Slot;
}>();
defineEmits<{
  edit: [];
  delete: [];
  cancel: [];
  save: [];
  saveThenPrint: [];
  saveThenNewFromTemplate: [];
  saveThenPrintThenNewFromTemplate: [];
  resetErrors: [];
}>();

const { print } = usePrint();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.entity-modal-content__default {
  max-height: calc(100dvh - 200px);
}

/* fix pwa standalone-mode footer hidden */
:global(
  body:is(.platform-ios, .platform-android:not(.native-mobile))
    .q-dialog__inner--minimized
    .entity-modal-content__default
) {
  max-height: calc(100dvh - 260px);
}

:global(.body--dark .entity-modal-content__error-tooltip) {
  border: 1px solid $grey-7;
}
</style>
