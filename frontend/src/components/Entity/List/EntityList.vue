<template>
  <div class="row items-center">
    <h1 class="q-mr-lg">{{ title }}</h1>
    <slot name="add-button"></slot>
  </div>

  <q-card v-if="search !== undefined" class="bg-shade q-my-md" flat>
    <q-card-section>
      <div class="row">
        <div class="col">
          <q-input
            v-model.trim="search"
            class="full-width"
            outlined
            :bg-color="inputBgColor"
            dense
            debounce="300"
            clearable
            :placeholder="searchPlaceholder || t('entity.search')"
            @clear="search = ''"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div v-if="onScannedQr" class="col-auto q-ml-md">
          <BaseQrScannerModal @change="$emit('scanned-qr', $event)" />
        </div>
      </div>
    </q-card-section>
  </q-card>

  <div>
    <q-tabs
      v-if="tabs"
      v-model="tab"
      class="q-ml-xs"
      breakpoint="320"
      align="left"
      no-caps
      dense
      active-bg-color="shade"
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
import type { Slot } from 'vue';
import BaseQrScannerModal from 'src/components/Base/BaseQrScanner/BaseQrScannerModal.vue';

export interface EntityListProps extends EntityListPropsWithoutModels {
  tab?: string | undefined;
  search?: string | undefined;
}

interface EntityListPropsWithoutModels {
  title: string;
  tabs?: { value: string; label: string }[] | undefined;
  searchPlaceholder?: string | undefined;
  hasAddButton?: boolean | undefined;
  onScannedQr?: ((data: string) => void) | undefined;
}

defineProps<EntityListPropsWithoutModels>();
const tab = defineModel<string | undefined>('tab');
const search = defineModel<string | undefined>('search');
defineSlots<{
  default: Slot;
  'add-button': Slot;
}>();
defineEmits<{
  'scanned-qr': [data: string];
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
