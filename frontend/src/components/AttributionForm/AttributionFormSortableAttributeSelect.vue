<template>
  <div
    ref="containerRef"
    class="relative-position"
    :draggable="draggable"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="row items-center relative-position">
      <template v-if="!noSpaceBefore">
        <q-icon
          v-if="!notDraggable"
          name="drag_indicator"
          style="color: var(--q-text-muted); transform: translateY(-0.35em)"
          :style="{ cursor: draggable ? 'grabbing' : 'grab' }"
          size="md"
          class="col-auto q-mr-xs"
          @mousedown="draggable = true"
          @touchstart="draggable = true"
          @mouseup="draggable = false"
          @touchend="draggable = false"
          @click.prevent.stop=""
        />
        <div v-else style="width: 36px"></div>
      </template>
      <AttributeSelect
        ref="inputRef"
        v-model="attribute"
        class="col"
        hide-label
      />
      <q-btn
        class="col-auto q-ml-xs"
        color="negative"
        style="transform: translateY(-0.75em)"
        dense
        flat
        icon="delete_outline"
        rounded
        @click="$emit('delete')"
      />
    </div>
    <q-checkbox
      v-model="required"
      :label="t('attributionForms.required')"
      :style="`transform: translate(${noSpaceBefore ? '0' : '2em'}, -1.5em)`"
      size="sm"
    />
    <q-separator
      v-if="!last"
      style="transform: translateY(-0.75em)"
      :color="anyDragActive ? 'transparent' : undefined"
    />

    <div
      class="absolute-top-left drop-zone"
      :class="{
        'drop-zone--active': dropZoneActive && !draggable,
        'drop-zone--hover': overTopDropZone && !draggable,
      }"
      style="
        height: calc(50% + 0.5em);
        border-top-width: 1em;
        border-top-style: solid;
        transform: translateY(-1.25em);
      "
      @dragenter="overTopDropZone = true"
      @dragleave="overTopDropZone = false"
      @dragover.prevent="setDropEffectMove"
      @drop.prevent="$emit('drop', 'before')"
    ></div>
    <div
      class="absolute-bottom-left drop-zone"
      :class="{
        'drop-zone--active': dropZoneActive && !draggable,
        'drop-zone--hover': overBottomDropZone && !draggable,
      }"
      style="
        height: calc(50% + 0.5em);
        border-bottom-width: 1em;
        border-bottom-style: solid;
        transform: translateY(-0.25em);
      "
      @dragenter="overBottomDropZone = true"
      @dragleave="overBottomDropZone = false"
      @dragover.prevent="setDropEffectMove"
      @drop.prevent="$emit('drop', 'after')"
    ></div>
  </div>
</template>

<script setup lang="ts">
import AttributeSelect from 'src/components/Attribute/AttributeSelect.vue';
import { nextTick, ref } from 'vue';
import { type AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { focusInView } from 'src/utils/focusInView';
import { useQuasar } from 'quasar';
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
const containerRef = ref<HTMLDivElement | null>(null);

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

const emit = defineEmits<{
  dragstart: [];
  dragend: [];
  drop: [position: 'before' | 'after'];
  delete: [];
}>();

const draggable = ref(false);
const overTopDropZone = ref(false);
const overBottomDropZone = ref(false);

function setDropEffectMove(e: DragEvent) {
  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }
  e.dataTransfer.dropEffect = 'move';
}

const $q = useQuasar();

async function onDragStart(e: DragEvent) {
  emit('dragstart');
  await nextTick();

  if (e.dataTransfer && containerRef.value) {
    e.dataTransfer.effectAllowed = 'move';

    // create a ghost element to be displayed while dragging to prevent
    // having overlapping elements on the dragged item (like the drop zone
    // or the modal title if element is below it)
    const ghost = containerRef.value.cloneNode(true) as HTMLDivElement;
    ghost.id = 'attribution-form-sortable-attribute-select-ghost';
    ghost.style.position = 'fixed';
    ghost.style.top = '-1000px';
    ghost.style.width = containerRef.value.offsetWidth + 'px';
    ghost.style.backgroundColor = $q.dark.isActive ? 'var(--q-dark)' : 'white';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
  }
}

function onDragEnd() {
  document
    .getElementById('attribution-form-sortable-attribute-select-ghost')
    ?.remove();
  draggable.value = false;
  emit('dragend');
}

const { t } = useI18n();
</script>

<style scoped lang="scss">
.drop-zone {
  width: 100%;
  display: none;
}

.drop-zone--active {
  border-color: color-mix(in srgb, var(--q-primary) 20%, transparent);
  display: block;
}

.drop-zone--hover {
  border-color: var(--q-primary);
}
</style>
