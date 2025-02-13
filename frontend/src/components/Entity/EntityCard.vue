<template>
  <div class="row items-center" :class="{ 'external-font-size': fontSize }">
    <BaseSpriteIcon
      :name="icon"
      :color="iconColor || 'grey-7'"
      :size="fontSize ? '2.5em' : '50px'"
      style="padding-bottom: 2px"
    />
    <div class="q-ml-sm">
      <slot name="title">
        <h2 class="q-ma-none" :class="{ 'external-font-size': fontSize }">
          <EntityLabelId
            v-if="
              labelId && (entityType === 'plant' || entityType === 'plantGroup')
            "
            :entity-type="entityType"
            :label-id="labelId || ''"
          />
          <EntityName
            v-else
            :plant-group="plantGroup"
            :cultivar="plantGroup?.cultivar || cultivar"
            :lot="plantGroup?.cultivar?.lot || cultivar?.lot || lot"
            :crossing="
              plantGroup?.cultivar?.lot?.crossing ||
              cultivar?.lot?.crossing ||
              lot?.crossing
            "
            no-link
          />
        </h2>
      </slot>
      <slot name="subtitle">
        <EntityName
          v-if="
            labelId &&
            (entityType === 'plant' || entityType === 'plantGroup') &&
            plantGroup
          "
          :plant-group="plantGroup"
          :cultivar="plantGroup.cultivar"
          :lot="plantGroup.cultivar?.lot"
          :crossing="plantGroup.cultivar?.lot?.crossing"
          no-link
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
import { computed, type Slot } from 'vue';

interface Plant {
  entityType: 'plant';
  labelId: string;
  plantGroup: PlantGroupNameProps['plantGroup'] & {
    cultivar?: PlantGroupNameProps['cultivar'] & {
      lot?: PlantGroupNameProps['lot'] & {
        crossing?: PlantGroupNameProps['crossing'];
      };
    };
  };
  cultivar?: never;
  lot?: never;
}

interface PlantGroup {
  entityType: 'plantGroup';
  labelId?: string | null;
  plantGroup: PlantGroupNameProps['plantGroup'] & {
    cultivar?: PlantGroupNameProps['cultivar'] & {
      lot?: PlantGroupNameProps['lot'] & {
        crossing?: PlantGroupNameProps['crossing'];
      };
    };
  };
  cultivar?: never;
  lot?: never;
}

interface Cultivar {
  entityType: 'cultivar';
  labelId?: never;
  plantGroup?: never;
  cultivar: PlantGroupNameProps['cultivar'] & {
    lot?: PlantGroupNameProps['lot'] & {
      crossing?: PlantGroupNameProps['crossing'];
    };
  };
  lot?: never;
}

interface Lot {
  entityType: 'lot';
  labelId?: never;
  plantGroup?: never;
  cultivar?: never;
  lot: PlantGroupNameProps['lot'] & {
    crossing?: PlantGroupNameProps['crossing'];
  };
}

export type EntityCardProps = (Plant | PlantGroup | Cultivar | Lot) & {
  fontSize?: string;
  iconColor?: string;
};

const props = defineProps<EntityCardProps>();

defineSlots<{
  title: Slot;
  subtitle: Slot;
}>();

const icon = computed(() => {
  switch (props.entityType) {
    case 'plant':
      return 'tree';
    case 'plantGroup':
      return 'tree-group';
    case 'cultivar':
      return 'cultivar';
    case 'lot':
      return 'lot';
  }
  // @ts-expect-error don't move into switch so ts complains if we add a new entity type
  throw new Error('Invalid entity type');
});
</script>

<style scoped>
.external-font-size {
  font-size: v-bind(fontSize);
}
</style>
