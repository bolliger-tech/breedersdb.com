<template>
  <h5
    v-if="showTextInput || showPhotoInput"
    class="text-caption text-weight-bold q-mb-none q-mt-md"
  >
    {{ t('attributions.add.notes') }}
  </h5>

  <div class="column" :class="{ reverse: openInputsOrdered[0] === 'photo' }">
    <AttributionAddFormInputText
      v-if="showTextInput"
      ref="textInputRef"
      :model-value="textNote"
      :validation="{ maxLen: 2047, pattern: null }"
      :label="t('attributions.columns.textNote')"
      autofocus
      class="q-mt-sm"
      @update:model-value="updateTextNote"
      @clear="showTextInput = false"
      @blur="showTextInput = !!textNote"
    />

    <AttributionAddFormInputPhoto
      v-if="showPhotoInput"
      ref="photoInputRef"
      v-model="photoNote"
      class="q-mt-sm"
      @clear="showPhotoInput = false"
      @cancel="showPhotoInput = !!photoNote"
    />
  </div>

  <div class="row">
    <q-btn
      v-if="allowTextNote && !showTextInput"
      color="primary"
      flat
      size="sm"
      :label="t('attributions.add.addTextNote')"
      class="q-mt-sm"
      :disabled="disabled"
      @click="showTextInput = true"
    />
    <q-btn
      v-if="allowPhotoNote && !showPhotoInput"
      color="primary"
      flat
      size="sm"
      :label="t('attributions.add.addPhotoNote')"
      class="q-mt-sm"
      :disabled="disabled"
      @click="addPhotoNote"
    />
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import AttributionAddFormInputPhoto from 'src/components/Attribution/Add/AttributionAddFormInputPhoto.vue';
import AttributionAddFormInputText from 'src/components/Attribution/Add/AttributionAddFormInputText.vue';
import { nextTick, ref, watch } from 'vue';
import { focusInView } from 'src/utils/focusInView';

export interface AttributionAddFormInputNoteProps {
  allowTextNote: boolean;
  allowPhotoNote: boolean;
  disabled?: boolean;
}

defineProps<AttributionAddFormInputNoteProps>();
const textNote = defineModel<string | null>('textNote', { required: true });
const photoNote = defineModel<File | null>('photoNote', { required: true });

const textInputRef = ref<InstanceType<
  typeof AttributionAddFormInputText
> | null>(null);

defineExpose({
  clear,
  validate: () => textInputRef.value?.validate(),
  focus: () => textInputRef.value && focusInView(textInputRef.value),
});

const showTextInput = ref(textNote.value !== null);
const showPhotoInput = ref(photoNote.value !== null);

const photoInputRef = ref<InstanceType<
  typeof AttributionAddFormInputPhoto
> | null>(null);

const { t } = useI18n();

function updateTextNote(val: string | null) {
  textNote.value = val || null;
}

async function addPhotoNote() {
  showPhotoInput.value = true;
  await nextTick();
  photoInputRef.value?.pickFiles();
}

const openInputsOrdered = ref<('text' | 'photo')[]>([]);
watch([showTextInput, showPhotoInput], ([text, photo]) => {
  if (text) {
    openInputsOrdered.value.push('text');
  } else {
    openInputsOrdered.value = openInputsOrdered.value.filter(
      (v) => v !== 'text',
    );
  }
  if (photo) {
    openInputsOrdered.value.push('photo');
  } else {
    openInputsOrdered.value = openInputsOrdered.value.filter(
      (v) => v !== 'photo',
    );
  }
});

function clear() {
  showTextInput.value = false;
  showPhotoInput.value = false;
  textNote.value = null;
  photoNote.value = null;
}
</script>
