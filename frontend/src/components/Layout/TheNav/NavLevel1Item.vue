<template>
  <li>
    <component
      :is="component.component"
      v-if="component"
      v-bind="component.props"
    />

    <template v-if="icon && label">
      <q-expansion-item
        v-if="children?.length"
        :class="{ 'q-pb-none': isOpen, 'children-bg': isOpen }"
        :model-value="isOpen"
        @click.stop="isOpen = !isOpen"
        @show="startScrollIntoView"
        @after-show="stopScrollIntoView"
      >
        <template #header>
          <NavLevel1ItemIcon
            :icon="icon"
            :label="label"
            :is-current-route="isCurrentRoute"
            class="full-width"
          />
        </template>
        <template #default>
          <NavLevel2 ref="navLevel2" :children="children" />
        </template>
      </q-expansion-item>

      <q-item v-else clickable tag="a" :to="path">
        <NavLevel1ItemIcon
          :icon="icon"
          :label="label"
          :is-current-route="isCurrentRoute"
        />
      </q-item>
    </template>
  </li>
</template>

<script setup lang="ts">
import { NavItem, useNavItem } from './useNavItem';
import NavLevel2 from './NavLevel2.vue';
import { ref, onBeforeUnmount, onMounted } from 'vue';
import NavLevel1ItemIcon from './NavLevel1ItemIcon.vue';

export interface NavLevel1ItemProps extends NavItem {}

const props = defineProps<NavLevel1ItemProps>();

const { isCurrentRoute } = useNavItem(props);

const isOpen = ref(isCurrentRoute.value);

const navLevel2 = ref<InstanceType<typeof NavLevel2> | null>(null);
let animationFrameId: number | null = null;

function scrollIntoView() {
  navLevel2.value?.$el.scrollIntoView({
    behavior: 'instant',
    block: 'nearest',
  });
}

function scrollIntoViewAnimated() {
  scrollIntoView();

  if (animationFrameId) {
    animationFrameId = window.requestAnimationFrame(() =>
      scrollIntoViewAnimated(),
    );
  }
}

function startScrollIntoView() {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = window.requestAnimationFrame(() =>
    scrollIntoViewAnimated(),
  );
}

function stopScrollIntoView() {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }
}

onBeforeUnmount(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }
});

onMounted(() => {
  if (isOpen.value) {
    scrollIntoViewAnimated();
  }
});
</script>

<style scoped>
.children-bg {
  background: rgba(255, 255, 255, 0.1);
}
</style>
