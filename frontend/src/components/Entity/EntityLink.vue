<template>
  <RouterLink
    v-if="entity.plant"
    :to="`/plants/${entity.plant.id}`"
    class="undecorated-link"
  >
    <EntityLabelId entity-type="plant" :label-id="entity.plant.label_id" />
  </RouterLink>
  <RouterLink
    v-else-if="entity.plant_group"
    :to="`/groups/${entity.plant_group.id}`"
    class="undecorated-link"
  >
    {{ entity.plant_group.display_name }}
  </RouterLink>
  <RouterLink
    v-else-if="entity.cultivar"
    :to="`/cultivars/${entity.cultivar.id}`"
    class="undecorated-link"
  >
    {{ entity.cultivar.display_name }}
  </RouterLink>
  <RouterLink
    v-else-if="entity.lot"
    :to="`/lots/${entity.lot.id}`"
    class="undecorated-link"
  >
    {{ entity.lot.display_name }}
  </RouterLink>
</template>

<script setup lang="ts">
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';

export interface EntityLinkProps {
  entity: {
    plant: {
      id: number;
      label_id: string;
    };
    plant_group: {
      id: number;
      display_name: string;
    };
    cultivar: {
      id: number;
      display_name: string;
    };
    lot: {
      id: number;
      display_name: string;
    };
  };
}

defineProps<EntityLinkProps>();
</script>
