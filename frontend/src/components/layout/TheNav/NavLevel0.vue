<template>
  <ul :class="classes">
    <NavLevel0Item
      v-for="(item, index) in items"
      :key="item.to"
      v-bind="item"
      :is-open="openItem === item.to"
      :style="
        index === items.length - 1 &&
        !isMobile && { flex: 'auto 1 0', 'justify-content': 'flex-end' }
      "
      @open="openItem = openItem === item.to ? null : item.to"
    />
  </ul>
</template>

<script setup lang="ts">
import NavLevel0Item, { NavLevel0ItemProps } from './NavLevel0Item.vue';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useQuasar } from 'quasar';
import { onMounted } from 'vue';

export interface NavLevel0Props {
  items: Omit<NavLevel0ItemProps, 'isOpen'>[];
}

const { items } = defineProps<NavLevel0Props>();

const $q = useQuasar();

const isMobile = computed(() => {
  return !$q.screen.gt.sm;
});

const classes = computed(() => {
  return {
    list: true,
    row: isMobile.value,
    column: !isMobile.value,
    'justify-start': !isMobile.value,
    'justify-around': isMobile.value,
    'no-wrap': true,
    'full-height': !isMobile.value,
  };
});

const openItem = ref<string | null>(null);

function closeSubnav() {
  openItem.value = null;
}

onMounted(() => {
  document.addEventListener('click', closeSubnav);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSubnav);
});
</script>

<style lang="scss" scoped>
.list {
  list-style: none;
  margin: 0;
  padding: 0;

  @media screen and (min-width: $breakpoint-md-min) {
    padding: map-get($space-sm, 'y') 0;
  }
}
</style>
