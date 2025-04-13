<template>
  <div class="row items-start justify-between">
    <slot name="entity-card"></slot>
    <q-btn
      icon="more_vert"
      class="text-muted"
      flat
      round
      dense
      style="transform: translate(14px, -6px)"
    >
      <q-menu>
        <div class="q-pa-md column">
          <strong>{{ t('attributions.add.fieldsToDisplay') }}</strong>
          <q-separator class="q-mt-sm" />
          <slot name="settings"></slot>
          <q-separator v-if="$slots.settings" />
          <q-toggle
            v-model="lastAttributed"
            :label="t('attributions.add.showLastAttributed')"
          />
        </div>
      </q-menu>
    </q-btn>
  </div>

  <AttributionAddLastAttributed
    v-if="lastAttributed"
    :entity-id="entityId"
    :form-id="formId"
    :entity-type="entityType"
  />
</template>

<script lang="ts" setup>
import AttributionAddLastAttributed from 'src/components/Attribution/Add/AttributionAddLastAttributed.vue';
import { ref, type Slot, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { useI18n } from 'src/composables/useI18n';

const LOCAL_STORAGE_KEY =
  'breedersdb-attribution-show-last-attributed-timestamp';

interface AttributionAddEntityInfoProps {
  entityId: number;
  entityType: AttributableEntities;
  formId: number;
}

defineProps<AttributionAddEntityInfoProps>();

defineSlots<{
  settings: Slot;
  'entity-card': Slot;
}>();

const { localStorage } = useQuasar();

const lastAttributed = ref(
  localStorage.getItem<Partial<boolean>>(LOCAL_STORAGE_KEY) ?? true,
);

watch(lastAttributed, (newVal) => {
  localStorage.set(LOCAL_STORAGE_KEY, newVal);
});

const { t } = useI18n();
</script>
