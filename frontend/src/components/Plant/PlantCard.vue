<template>
  <div class="row items-end">
    <BaseSpriteIcon
      name="tree"
      color="grey-7"
      size="50px"
      style="padding-bottom: 2px"
    />
    <div class="q-ml-sm">
      <slot name="title">
        <h2 class="q-ma-none">
          <EntityLabelId
            v-if="labelId"
            entity-type="plant"
            :label-id="labelId"
          />
        </h2>
      </slot>
      <slot name="subtitle">
        <EntityName
          v-if="plantGroup"
          :plant-group="plantGroup"
          :cultivar="plantGroup.cultivar"
          :lot="plantGroup.cultivar?.lot"
          :crossing="plantGroup.cultivar?.lot?.crossing"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import EntityName, {
  PlantGroupNameProps,
} from 'src/components/Entity/EntityName.vue';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import type { Slot } from 'vue';

export interface PlantCardProps {
  labelId?: string;
  plantGroup?: PlantGroupNameProps['plantGroup'] & {
    cultivar?: PlantGroupNameProps['cultivar'] & {
      lot?: PlantGroupNameProps['lot'] & {
        crossing?: PlantGroupNameProps['crossing'];
      };
    };
  };
}

defineProps<PlantCardProps>();
defineSlots<{
  title: Slot;
  subtitle: Slot;
}>();
</script>
