<template>
  <q-btn
    color="primary"
    flat
    :label="t('attributions.add.addAttribute')"
    class="full-width"
    @click="showDialog = true"
  />
  <q-dialog v-model="showDialog">
    <q-card style="width: clamp(310px, 90dvw, 1000px); max-width: unset">
      <q-card-section class="row items-center q-py-sm">
        <h2 class="q-ma-none nowrap-elipsis" style="width: calc(100% - 34px)">
          {{ t('attributions.add.addAttribute') }}
        </h2>
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <AttributeSelect @update:model-value="add" />
      </q-card-section>

      <q-separator />
      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('base.cancel')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import { type AttributeFragment } from 'src/components/Attribute/attributeFragment';
import AttributeSelect from 'src/components/Attribute/AttributeSelect.vue';

const emit = defineEmits<{
  add: [attribute: AttributeFragment];
}>();

const { t } = useI18n();

const showDialog = ref(false);

function add(attribute: AttributeFragment | null | undefined) {
  if (attribute) {
    emit('add', attribute);
    showDialog.value = false;
  }
}
</script>
