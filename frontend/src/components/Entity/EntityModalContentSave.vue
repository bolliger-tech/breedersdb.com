<template>
  <q-btn-dropdown
    v-if="onSaveThenPrint || onSaveThenNewFromTemplate"
    class="entity-modal-content-save q-ml-xs"
    split
    :label="primaryAction.label"
    color="primary"
    :loading="loading"
    :disable="loading"
    auto-close
    unelevated
    @click="onClick(primaryAction.action)"
  >
    <q-list>
      <q-item clickable @click="onClick('save')">
        <q-item-section>
          {{ t('base.save') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="onSaveThenNewFromTemplate"
        clickable
        @click="onClick('saveThenNewFromTemplate')"
      >
        <q-item-section>
          {{ t('base.saveThenNewFromTemplate') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="onSaveThenPrint"
        clickable
        @click="onClick('saveThenPrint')"
      >
        <q-item-section>
          {{ t('base.saveThenPrint') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="onSaveThenPrint && onSaveThenNewFromTemplate"
        clickable
        @click="onClick('saveThenPrintThenNewFromTemplate')"
      >
        <q-item-section>
          {{ t('base.saveThenPrintThenNewFromTemplate') }}
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
  <q-btn
    v-else
    :label="t('base.save')"
    color="primary"
    class="q-ml-xs"
    unelevated
    :loading="loading"
    :disable="loading"
    @click="onClick('save')"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { useQuasar } from 'quasar';
import { computed } from 'vue';

const STORAGE_KEY = 'breedersdb-entity-modal-content-save__last-action';

export interface EntityModalContentSaveProps {
  loading?: boolean | undefined;
  // make emit handler available in template
  onSaveThenPrint?: (() => void) | undefined;
  onSaveThenNewFromTemplate?: (() => void) | undefined;
}

const props = defineProps<EntityModalContentSaveProps>();

type EmitKey =
  | 'save'
  | 'saveThenPrint'
  | 'saveThenNewFromTemplate'
  | 'saveThenPrintThenNewFromTemplate';
const emit = defineEmits<(key: EmitKey) => void>();

const { t } = useI18n();

const $q = useQuasar();

const allActions = computed<{
  [K in EmitKey]: { label: string; action: EmitKey; available: boolean };
}>(() => ({
  save: {
    label: t('base.save'),
    action: 'save',
    available: true,
  },
  saveThenPrint: {
    label: t('base.saveThenPrint'),
    action: 'saveThenPrint',
    available: !!props.onSaveThenPrint,
  },
  saveThenNewFromTemplate: {
    label: t('base.saveThenNewFromTemplate'),
    action: 'saveThenNewFromTemplate',
    available: !!props.onSaveThenNewFromTemplate,
  },
  saveThenPrintThenNewFromTemplate: {
    label: t('base.saveThenPrintThenNewFromTemplate'),
    action: 'saveThenPrintThenNewFromTemplate',
    available: !!props.onSaveThenPrint && !!props.onSaveThenNewFromTemplate,
  },
}));

const primaryAction = computed(
  (): {
    label: string;
    action: EmitKey;
  } => {
    const defaultAction = 'save';
    const action =
      $q.sessionStorage.getItem<EmitKey>(STORAGE_KEY) || defaultAction;
    const selected =
      action in allActions.value
        ? allActions.value[action]
        : allActions.value[defaultAction];
    return selected.available ? selected : allActions.value[defaultAction];
  },
);

function onClick(action: EmitKey) {
  $q.sessionStorage.set(STORAGE_KEY, action);
  emit(action);
}
</script>

<style lang="scss" scoped>
:global(
  .q-dialog__inner
    > .q-card
    > .q-card__actions
    .entity-modal-content-save
    .q-btn--rectangle
) {
  min-width: unset;
}
</style>
