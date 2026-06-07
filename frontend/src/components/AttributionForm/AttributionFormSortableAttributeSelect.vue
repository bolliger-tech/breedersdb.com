<template>
  <BaseSortableListItem
    :drop-zone-active="dropZoneActive"
    :not-draggable="!!notDraggable"
    :no-space-before="!!noSpaceBefore"
    :any-drag-active="!!anyDragActive"
    :last="!!last"
    @dragstart="$emit('dragstart')"
    @dragend="$emit('dragend')"
    @drop="(pos) => $emit('drop', pos)"
  >
    <AttributeSelect
      ref="inputRef"
      v-model="attribute"
      class="col"
      hide-label
      hide-bottom-space
    />
    <q-btn
      class="col-auto q-ml-xs"
      color="negative"
      style="top: 0.75em"
      dense
      flat
      icon="delete_outline"
      rounded
      @click="$emit('delete')"
    />

    <template #after>
      <q-checkbox
        v-model="required"
        :label="t('attributionForms.required')"
        size="sm"
      />
    </template>
  </BaseSortableListItem>
</template>

<script setup lang="ts">
import AttributeSelect from 'src/components/Attribute/AttributeSelect.vue';
import BaseSortableListItem from 'src/components/Base/BaseSortableListItem.vue';
import { ref } from 'vue';
import { type AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { focusInView } from 'src/utils/focusInView';
import { useI18n } from 'src/composables/useI18n';

export interface AttributionFormSortableAttributeSelectProps {
  dropZoneActive: boolean;
  notDraggable?: boolean;
  noSpaceBefore?: boolean;
  anyDragActive?: boolean;
  last?: boolean;
}

defineProps<AttributionFormSortableAttributeSelectProps>();

const inputRef = ref<InstanceType<typeof AttributeSelect> | null>(null);

defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const attribute = defineModel<AttributeFragment | null | undefined>(
  'attribute',
  { required: true },
);
const required = defineModel<boolean>('required', {
  required: true,
});

defineEmits<{
  dragstart: [];
  dragend: [];
  drop: [position: 'before' | 'after'];
  delete: [];
}>();

const { t } = useI18n();
</script>
