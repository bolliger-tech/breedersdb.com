<template>
  <BaseInputLabel>
    <template #label>
      <div class="row">
        <div>{{ t('entity.commonColumns.note') }}</div>
        <q-btn
          v-if="modelValue && !editMode"
          color="primary"
          size="sm"
          class="q-ml-sm"
          flat
          :label="t('base.edit')"
          @click="editNote"
        />
      </div>
    </template>
    <template #default>
      <q-input
        v-if="modelValue || editMode"
        ref="inputRef"
        v-model="modelValue"
        :borderless="!editMode"
        :outlined="editMode"
        autogrow
        autocomplete="off"
        dense
        :clearable="editMode"
        type="textarea"
        style="max-width: 500px"
        :style="!editMode ? 'margin-top: -0.9em' : ''"
        @focus="editMode = true"
        @blur="editMode = false"
      />
      <q-btn v-else color="primary" flat label="Add note" @click="editNote" />
    </template>
  </BaseInputLabel>
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import { ref, nextTick } from 'vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { type QInput } from 'quasar';

const modelValue = defineModel<string | null>({ required: true });

const { t } = useI18n();
const editMode = ref(false);
const inputRef = ref<QInput | null>(null);

async function editNote() {
  editMode.value = true;
  await nextTick();
  inputRef.value?.focus();
}
</script>
