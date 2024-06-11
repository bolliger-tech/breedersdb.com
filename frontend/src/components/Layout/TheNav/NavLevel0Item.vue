<template>
  <li class="col column justify-center align-center list-item">
    <div class="relative-position full-width column align-stretch">
      <q-item
        v-bind="{ ...(!hasChildren && { tag: 'a', to }) }"
        ref="item"
        clickable
        class="item q-px-none"
        :focused="isOpen || isHovered || hasFocus"
        manual-focus
        @click.stop="clickHandler"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
        @focus="hasFocus = true"
        @blur="hasFocus = false"
      >
        <q-scroll-observer
          v-if="isOpen && hasChildren"
          @scroll="setBoundingClientRect"
        />
        <NavLevel0ItemIcon
          :icon="icon"
          :label="label"
          :class="{
            'text-white': !isCurrentRoute,
            'text-secondary-100': isCurrentRoute,
          }"
        />
      </q-item>
      <NavLevel1
        v-if="isOpen && hasChildren"
        :children="getChildren"
        :style="navLevel1Styles"
      />
    </div>
  </li>
</template>

<script setup lang="ts">
import { QItem, useQuasar } from 'quasar';
import NavLevel0ItemIcon, {
  NavLevel0ItemIconProps,
} from './NavLevel0ItemIcon.vue';
import NavLevel1, { NavLevel1Props } from './NavLevel1.vue';
import { useNavItem } from './useNavItem';
import { ref } from 'vue';
import { computed } from 'vue';

export interface NavLevel0ItemProps extends NavLevel0ItemIconProps {
  isOpen: boolean;
  children?: NavLevel1Props['children'];
  to: string;
}

const emit = defineEmits<{ open: [] }>();

const { label, icon, children, isOpen, to } = defineProps<NavLevel0ItemProps>();

const { isCurrentRoute, hasChildren, getChildren } = useNavItem({
  children,
  to,
});

const isHovered = ref(false);
const hasFocus = ref(false);

const item = ref<QItem | null>(null);
const itemBoundingClientRect = ref(new DOMRect(0, 0, 0, 0));
function setBoundingClientRect() {
  if (item.value) {
    itemBoundingClientRect.value = item.value.$el.getBoundingClientRect();
  }
}
const $q = useQuasar();
const navLevel1Styles = computed(() => {
  if ($q.screen.lt.md) {
    return {};
  }

  const parentTop = itemBoundingClientRect.value.top;
  const windowHeight = window.innerHeight;

  if (parentTop > windowHeight / 2) {
    const bottom =
      windowHeight - parentTop - itemBoundingClientRect.value.height;
    return {
      top: 'auto',
      bottom: `${bottom}px`,
      'max-height': `calc(100% - ${bottom}px)`,
    };
  }

  return {
    top: `${parentTop}px`,
    bottom: 'auto',
    'max-height': `calc(100% - ${parentTop}px)`,
  };
});

function clickHandler() {
  setBoundingClientRect();
  emit('open');
}
</script>

<style scoped lang="scss">
.list-item {
  @media screen and (min-width: $breakpoint-md-min) {
    flex: auto 0 0;
  }
}
.item {
  height: 83px;
  display: flex;
  justify-content: center;

  @media screen and (min-width: $breakpoint-md-min) {
    width: 100px;
  }
}
</style>
