<template>
  <span
    v-for="(segment, index) in segments.slice().reverse()"
    :key="segment.link"
  >
    <template v-if="noLink">{{ segment.label }}</template>
    <router-link
      v-else
      :to="segment.link"
      :title="segment.title"
      class="undecorated-link"
      >{{ segment.label }}</router-link
    >
    <span v-if="index + 1 < segments.length" class="dot">.</span>
  </span>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';

export interface PlantGroupNameProps {
  plantGroup?: {
    id: number;
    name_segment: string;
    name_override: string | null;
  };
  cultivar?: {
    id: number;
    name_segment: string;
    name_override: string | null;
  };
  lot?: {
    id: number;
    name_segment: string;
    name_override: string | null;
  };
  crossing?: {
    id: number;
    name: string;
  };
  dark?: boolean;
  noLink?: boolean;
}

const props = defineProps<PlantGroupNameProps>();
const { t } = useI18n();

const segments = computed(() => {
  const parts: { link: string; label: string; title: string }[] = [];

  if (props.plantGroup) {
    parts.push({
      link: `/groups/${props.plantGroup.id}`,
      label: props.plantGroup.name_override || props.plantGroup.name_segment,
      title: t('plantGroups.title', 1),
    });

    if (props.plantGroup.name_override !== null) {
      return parts;
    }
  }

  if (props.cultivar) {
    parts.push({
      link: `/cultivars/${props.cultivar.id}`,
      label: props.cultivar.name_override || props.cultivar.name_segment,
      title: t('cultivars.title', 1),
    });

    if (props.cultivar.name_override !== null) {
      return parts;
    }
  }

  if (props.lot) {
    parts.push({
      link: `/lots/${props.lot.id}`,
      label: props.lot.name_override || props.lot.name_segment,
      title: t('lots.title', 1),
    });

    if (props.lot.name_override !== null) {
      return parts;
    }
  }

  if (props.crossing) {
    parts.push({
      link: `/crossings/${props.crossing.id}`,
      label: props.crossing.name,
      title: t('crossings.title', 1),
    });
  }

  return parts;
});
</script>

<style lang="scss" scoped>
.dot {
  padding: 0 0.175em;
  font-weight: 900;
}
</style>
