<template>
  <EntityList
    v-model:tab="tab"
    v-model:search="search"
    :tabs="tabs"
    :title="title"
    :search-placeholder="searchPlaceholder"
    @scanned-qr="onScannedQr"
  >
    <template #add-button>
      <slot name="add-button">
        <q-btn primary unelevated no-caps color="primary" @click="addNew">{{
          t('entity.add')
        }}</q-btn>
      </slot>
    </template>

    <template #default>
      <EntityListTable
        v-model:visible-columns="visibleColumns"
        v-model:pagination="pagination"
        :rows="rows"
        :loading="loading"
        :all-columns="allColumns"
        :is-exporting="isExporting"
        :export-progress="exportProgress"
        @export="onExport"
        @row-click="(row) => view(row.id)"
      >
        <template
          v-for="slotName in bodyCellSlotNames"
          :key="slotName"
          #[`body-cell-${slotName}`]="slotProps"
        >
          <slot :name="`body-cell-${slotName}`" v-bind="slotProps"></slot>
        </template>
      </EntityListTable>
    </template>
  </EntityList>
  <EntityModal
    ref="modal"
    :key="modalKey"
    :model-value="entityId !== null || !!$route.path.match(/\/new\/?$/)"
    :transition-show="transition"
    :transition-hide="transition"
    @update:model-value="closeModal"
    @keydown.left.stop.prevent="viewPrevious"
    @keydown.right.stop.prevent="viewNext"
  >
    <BaseSuspense>
      <template #default>
        <router-view />
      </template>
      <template #fallback>
        <div class="fixed-center">
          <q-card>
            <q-card-section>
              <BaseSpinner size="xl" />
            </q-card-section>
          </q-card>
        </div>
      </template>
    </BaseSuspense>
  </EntityModal>
</template>

<script setup lang="ts">
import EntityList, { EntityListProps } from './List/EntityList.vue';
import EntityListTable, {
  EntityListTableProps,
} from './List/EntityListTable.vue';
import EntityModal, { type EntityModalProps } from './EntityModal.vue';
import { type MatcherLocationAsPath, useRoute, useRouter } from 'vue-router';
import { nextTick, type Slot, computed, ref, watch } from 'vue';
import type { QTableSlots } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import BaseSuspense from 'components/Base/BaseSuspense/BaseSuspense.vue';
import BaseSpinner from 'components/Base/BaseSpinner.vue';
import type { EntityExportButtonProps } from './EntityExportButton.vue';

export interface EntityContainerProps
  extends EntityContainerPropsWithoutModels {
  tab?: EntityListProps['tab'];
  search?: EntityListProps['search'];
  pagination?: EntityListTableProps['pagination'];
  visibleColumns: EntityListTableProps['visibleColumns'];
}

type EntityContainerPropsWithoutModels = {
  title: EntityListProps['title'];
  tabs?: EntityListProps['tabs'];
  searchPlaceholder?: EntityListProps['searchPlaceholder'];
  rows: EntityListTableProps['rows'];
  loading?: EntityListTableProps['loading'];
  allColumns: EntityListTableProps['allColumns'];
  listEntitiesPath: string | MatcherLocationAsPath;
  addEntityPath?: string | MatcherLocationAsPath;
  viewEntityPathGetter: (id: number | string) => string | MatcherLocationAsPath;
  onScannedQr?: (data: string) => void;
} & EntityExportButtonProps;

const props = defineProps<EntityContainerPropsWithoutModels>();

const tab = defineModel<string>('tab');
const search = defineModel<string>('search');
const pagination =
  defineModel<EntityListTableProps['pagination']>('pagination');
const visibleColumns = defineModel<EntityListTableProps['visibleColumns']>(
  'visibleColumns',
  { required: true },
);

const slots = defineSlots<{
  default: Slot;
  'add-button': Slot;
  [key: `body-cell-${string}`]: QTableSlots[`body-cell-${string}`];
}>();
defineEmits<{
  'scanned-qr': [data: string];
  export: [];
}>();

const bodyCellSlotNames = computed(() =>
  Object.keys(slots)
    .filter((slotName) => slotName.startsWith('body-cell-'))
    .map((slotName) => slotName.slice(10)),
);

const scrollPos = { x: 0, y: 0 };
function saveScrollPos() {
  scrollPos.x = window.scrollX;
  scrollPos.y = window.scrollY;
}
function restoreScrollPos() {
  window.scrollTo(scrollPos.x, scrollPos.y);
}

const route = useRoute();
const router = useRouter();
function addNew() {
  if (typeof props.addEntityPath === 'undefined') return;
  saveScrollPos();
  const path =
    typeof props.addEntityPath === 'string'
      ? props.addEntityPath
      : props.addEntityPath.path;
  router.push({ path, query: route.query });
}
function view(id: number | string) {
  saveScrollPos();
  const pathRaw = props.viewEntityPathGetter(id);
  const path = typeof pathRaw === 'string' ? pathRaw : pathRaw.path;
  router.push({ path, query: route.query });
}
function closeModal() {
  const path =
    typeof props.listEntitiesPath === 'string'
      ? props.listEntitiesPath
      : props.listEntitiesPath.path;

  router.push({ path, query: route.query }).then(() => {
    nextTick(() => nextTick(() => restoreScrollPos()));
  });
}

const entityId = computed(() => {
  if (!route.params.entityId) return null;
  return parseInt(route.params.entityId.toString());
});

const modalKey = computed(() => entityId.value ?? 'new');
const modal = ref<InstanceType<typeof EntityModal> | null>(null);

const navigationEnabled = computed(
  () => entityId.value && props.rows && !modal.value?.persistent,
);

const transition = ref<EntityModalProps['transition']>(undefined);
watch(entityId, () => {
  // use the default transition for opening the modal
  if (null === entityId.value) transition.value = undefined;
});

async function viewNext() {
  if (!navigationEnabled.value) return;
  const index = props.rows.findIndex((r) => r.id === entityId.value);
  if (index === -1 || index === props.rows.length - 1) {
    modal.value?.shake();
  } else {
    transition.value = 'slide-left';
    view(props.rows[index + 1].id);
  }
}

async function viewPrevious() {
  if (!navigationEnabled.value) return;
  const index = props.rows.findIndex((r) => r.id === entityId.value);
  if (index === -1 || index === 0) {
    modal.value?.shake();
  } else {
    transition.value = 'slide-right';
    view(props.rows[index - 1].id);
  }
}

const { t } = useI18n();
</script>
