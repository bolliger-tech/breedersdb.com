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
          <PlantLabelId v-if="labelId" :label-id="labelId" />
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
import PlantLabelId from 'src/components/Plant/PlantLabelId.vue';
import EntityName, {
  PlantGroupNameProps,
} from 'src/components/Entity/EntityName.vue';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';

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
  title: void;
  subtitle: void;
}>();
</script>
