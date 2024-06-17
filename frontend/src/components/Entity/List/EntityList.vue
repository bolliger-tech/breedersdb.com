<template>
  <div class="row items-center">
    <h1 class="q-mr-lg">{{ title }}</h1>
    <q-btn :to="toNewEntity" primary unelevated no-caps color="primary">{{
      t('entity.add')
    }}</q-btn>
  </div>

  <q-card v-if="filter !== undefined" class="bg-shade q-my-md" flat>
    <q-card-section>
      <q-input
        :model-value="filter"
        outlined
        :bg-color="inputBgColor"
        dense
        debounce="300"
        :placeholder="filterPlaceholder || t('entity.search')"
        @update:model-value="(val) => $emit('update:filter', val as string)"
      >
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>
  </q-card>

  <div>
    <q-tabs
      v-if="tabs"
      :model-value="tab"
      class="q-ml-xs"
      breakpoint="320"
      align="left"
      no-caps
      dense
      active-bg-color="shade"
      @update:model-value="(val) => $emit('update:tab', val as string)"
    >
      <q-tab
        v-for="item in tabs"
        :key="item.value"
        class="tab"
        :name="item.value"
        :label="item.label"
      />
    </q-tabs>

    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { useInputBackground } from 'src/composables/useInputBackground';

export interface EntityListProps extends EntityListPropsWithoutModels {
  tab?: string;
  filter?: string;
}

interface EntityListPropsWithoutModels {
  title: string;
  tabs?: { value: string; label: string }[];
  filterPlaceholder?: string;
  toNewEntity: string;
}

defineProps<EntityListProps>();
defineModel('tab', { type: String });
defineModel('filter', { type: String });
defineSlots<{
  default: void;
}>();
defineEmits<{
  'update:tab': [value: string];
  'update:filter': [value: string];
}>();

const { t } = useI18n();
const { inputBgColor } = useInputBackground();
</script>

<style scoped lang="scss">
.tab {
  border-radius: 3px 3px 0 0;
  margin-right: 0.5em;
}
</style>
