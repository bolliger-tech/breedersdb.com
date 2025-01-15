<template>
  <q-btn-dropdown
    v-if="saveThenPrint"
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
      <q-item v-if="saveThenPrint" clickable @click="onClick('saveThenPrint')">
        <q-item-section>
          {{ t('base.saveThenPrint') }}
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
  loading?: boolean;
  saveThenPrint?: boolean;
}

defineProps<EntityModalContentSaveProps>();

type EmitKey = 'save' | 'saveThenPrint';
const emit = defineEmits<(key: EmitKey) => void>();

const { t } = useI18n();

const $q = useQuasar();

const primaryAction = computed(
  (): {
    label: string;
    action: EmitKey;
  } => {
    const action = $q.sessionStorage.getItem<string>(STORAGE_KEY) || 'save';
    switch (action) {
      case 'saveThenPrint':
        return {
          label: t('base.saveThenPrint'),
          action: 'saveThenPrint',
        };
      default:
        return {
          label: t('base.save'),
          action: 'save',
        };
    }
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
