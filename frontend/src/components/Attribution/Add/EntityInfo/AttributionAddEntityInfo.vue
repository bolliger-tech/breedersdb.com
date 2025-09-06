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
            v-model="showFormName"
            :label="t('attributions.add.showFormName')"
          />
          <q-toggle
            v-model="lastAttributed"
            :label="t('attributions.add.showLastAttributed')"
          />
        </div>
      </q-menu>
    </q-btn>
  </div>

  <AttributionAddFormName v-if="showFormName" :form-id="formId" />

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
import AttributionAddFormName from '../AttributionAddFormName.vue';

const KEY_LAST_ATTRIBUTED =
  'breedersdb-attribution-show-last-attributed-timestamp';
const KEY_FORM_NAME = 'breedersdb-attribution-show-form-name';

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
  localStorage.getItem<Partial<boolean>>(KEY_LAST_ATTRIBUTED) ?? true,
);
const showFormName = ref(
  localStorage.getItem<Partial<boolean>>(KEY_FORM_NAME) ?? false,
);

watch(lastAttributed, (newVal) => {
  localStorage.set(KEY_LAST_ATTRIBUTED, newVal);
});
watch(showFormName, (newVal) => {
  localStorage.set(KEY_FORM_NAME, newVal);
});

const { t } = useI18n();
</script>
