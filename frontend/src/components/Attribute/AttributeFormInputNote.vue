<template>
  <div class="row justify-between">
    <q-btn
      v-if="allowTextNote && !showTextInput"
      color="primary"
      flat
      size="sm"
      :label="t('attribute.addTextNote')"
      @click="showTextInput = true"
    />
    <q-space />
    <q-btn
      v-if="allowPhotoNote && !showPhotoInput"
      color="primary"
      flat
      size="sm"
      :label="t('attribute.addPhotoNote')"
      @click="showPhotoInput = true"
    />
  </div>

  <AttributeFormInputText
    v-if="showTextInput"
    :model-value="textNote"
    :validation="{ maxLen: 2047, pattern: null }"
    @update:model-value="updateTextNote"
  />
  <AttributeFormInputPhoto v-if="showPhotoInput" v-model="photoNote" />
</template>
<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import AttributeFormInputPhoto from 'src/components/Attribute/AttributeFormInputPhoto.vue';
import AttributeFormInputText from 'src/components/Attribute/AttributeFormInputText.vue';
import { ref } from 'vue';

export interface AttributeFormInputNoteProps {
  allowTextNote: boolean;
  allowPhotoNote: boolean;
}

defineProps<AttributeFormInputNoteProps>();
const textNote = defineModel<string | null>('textNote', { required: true });
const photoNote = defineModel<{ file: File; fileName: string } | null>(
  'photoNote',
  { required: true },
);

const showTextInput = ref(false);
const showPhotoInput = ref(false);

const { t } = useI18n();

function updateTextNote(val: string | null) {
  textNote.value = val || null;
}
</script>
