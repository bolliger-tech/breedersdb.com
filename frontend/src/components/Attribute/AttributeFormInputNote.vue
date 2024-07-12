<template>
  <h5
    v-if="showTextInput || showPhotoInput"
    class="text-caption text-weight-bold q-mb-none q-mt-md"
  >
    {{ t('attribute.notes') }}
  </h5>

  <div class="column" :class="{ reverse: openInputsOrdered[0] === 'photo' }">
    <AttributeFormInputText
      v-if="showTextInput"
      :model-value="textNote"
      :validation="{ maxLen: 2047, pattern: null }"
      :label="t('attributions.columns.textNote')"
      autofocus
      class="q-mt-sm"
      @update:model-value="updateTextNote"
      @clear="showTextInput = false"
      @blur="showTextInput = !!textNote"
    />

    <AttributeFormInputPhoto
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
      :label="t('attribute.addTextNote')"
      class="q-mt-sm"
      :disabled="disabled"
      @click="showTextInput = true"
    />
    <q-btn
      v-if="allowPhotoNote && !showPhotoInput"
      color="primary"
      flat
      size="sm"
      :label="t('attribute.addPhotoNote')"
      class="q-mt-sm"
      :disabled="disabled"
      @click="addPhotoNote"
    />
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import AttributeFormInputPhoto from 'src/components/Attribute/AttributeFormInputPhoto.vue';
import AttributeFormInputText from 'src/components/Attribute/AttributeFormInputText.vue';
import { nextTick, ref, watch } from 'vue';

export interface AttributeFormInputNoteProps {
  allowTextNote: boolean;
  allowPhotoNote: boolean;
  disabled?: boolean;
}

defineProps<AttributeFormInputNoteProps>();
const textNote = defineModel<string | null>('textNote', { required: true });
const photoNote = defineModel<File | null>('photoNote', { required: true });

defineExpose({ clear });

const showTextInput = ref(false);
const showPhotoInput = ref(false);

const photoInputRef = ref<InstanceType<typeof AttributeFormInputPhoto> | null>(
  null,
);

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
