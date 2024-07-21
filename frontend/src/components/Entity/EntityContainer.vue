<template>
  <EntityList
    v-model:tab="tab"
    v-model:search="search"
    :tabs="tabs"
    :title="title"
    :search-placeholder="searchPlaceholder"
    :has-qr-scanner="hasQrScanner"
    @scanned-qr="$emit('scanned-qr', $event)"
    @add-new="addNew"
  >
    <template #default>
      <EntityListTable
        v-model:visible-columns="visibleColumns"
        v-model:pagination="pagination"
        :rows="rows"
        :loading="loading"
        :all-columns="allColumns"
        @row-click="(row) => view(row.id)"
      />
    </template>
  </EntityList>
  <EntityModal
    :model-value="!!$route.params.entityId || !!$route.path.match(/\/new\/?$/)"
    @update:model-value="closeModal"
  >
    <router-view />
  </EntityModal>
</template>

<script setup lang="ts">
import EntityList, { EntityListProps } from './List/EntityList.vue';
import EntityListTable, {
  EntityListTableProps,
} from './List/EntityListTable.vue';
import EntityModal from './EntityModal.vue';
import { MatcherLocationAsPath, useRoute, useRouter } from 'vue-router';
import { nextTick } from 'vue';

export interface EntityContainerProps
  extends EntityContainerPropsWithoutModels {
  tab?: EntityListProps['tab'];
  search?: EntityListProps['search'];
  pagination?: EntityListTableProps['pagination'];
  visibleColumns: EntityListTableProps['visibleColumns'];
}

interface EntityContainerPropsWithoutModels {
  title: EntityListProps['title'];
  tabs?: EntityListProps['tabs'];
  searchPlaceholder?: EntityListProps['searchPlaceholder'];
  rows: EntityListTableProps['rows'];
  loading?: EntityListTableProps['loading'];
  allColumns: EntityListTableProps['allColumns'];
  listEntitiesPath: string | MatcherLocationAsPath;
  addEntityPath: string | MatcherLocationAsPath;
  viewEntityPathGetter: (id: number | string) => string | MatcherLocationAsPath;
  hasQrScanner?: boolean;
}

const props = defineProps<EntityContainerPropsWithoutModels>();

const tab = defineModel<string>('tab');
const search = defineModel<string>('search');
const pagination =
  defineModel<EntityListTableProps['pagination']>('pagination');
const visibleColumns = defineModel<EntityListTableProps['visibleColumns']>(
  'visibleColumns',
  { required: true },
);

defineSlots<{
  default: void;
}>();
defineEmits<{
  'scanned-qr': [data: string];
}>();

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
</script>
