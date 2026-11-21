<template>
  <h3 class="q-mb-md">{{ t('cultivars.pedigree.title') }}</h3>
  <BaseSpinner v-if="loading" />
  <p v-else-if="parentsUnknown">{{ t('cultivars.pedigree.parentsUnknown') }}</p>
  <q-tree
    v-else-if="parents.length"
    v-model:expanded="expanded"
    :nodes="nodes"
    node-key="key"
    @lazy-load="loadParents"
  >
    <template #default-header="{ node }: { node: PedigreeNode }">
      <template v-if="node.parent">
        <span class="q-mr-xs">{{ node.parent === 'mother' ? '♀' : '♂' }}</span>
        <!-- stop: the name navigates, the rest of the node header expands -->
        <RouterLink
          v-if="node.cultivarId"
          :to="{ path: `/cultivars/${node.cultivarId}`, query: $route.query }"
          class="undecorated-link"
          @click.stop
          @keypress.stop
        >
          {{ node.label }}
        </RouterLink>
        <span v-else class="text-grey">
          {{ t('cultivars.pedigree.unknown') }}
        </span>
      </template>
      <span v-else>{{ node.label }}</span>
    </template>
  </q-tree>
  <BaseMessage
    v-if="loadingFailed"
    type="error"
    :message="t('cultivars.pedigree.loadingFailed')"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import { useI18n } from 'src/composables/useI18n';
import { useOneShotQuery } from 'src/composables/useOneShotQuery';
import {
  pedigreeCultivarFragment,
  toPedigreeNodes,
  type PedigreeNode,
} from './pedigreeNodes';

const props = defineProps<{ cultivarId: number; displayName: string }>();

const { t } = useI18n();
const { query } = useOneShotQuery();

const parentsQuery = graphql(
  `
    query CultivarPedigreeParents($id: Int!) {
      cultivars_by_pk(id: $id) {
        lot {
          crossing {
            mother_cultivar {
              ...pedigreeCultivarFragment
            }
            father_cultivar {
              ...pedigreeCultivarFragment
            }
          }
        }
      }
    }
  `,
  [pedigreeCultivarFragment],
);

// Resolves to null if the component was unmounted meanwhile.
async function fetchParentNodes(cultivarId: number, key: string) {
  const result = await query(
    parentsQuery,
    { id: cultivarId },
    { requestPolicy: 'cache-and-network' },
  );
  const crossing = result?.data?.cultivars_by_pk?.lot.crossing;
  return crossing ? toPedigreeNodes(crossing, key) : null;
}

const loading = ref(true);
const loadingFailed = ref(false);
// QTree assigns the lazy loaded children to these node objects.
const parents = ref<PedigreeNode[]>([]);
const expanded = ref<string[]>([]);

// Not awaited in setup, so the rest of the view modal doesn't wait for it.
loadParentsAndGrandparents()
  .catch(() => (loadingFailed.value = true))
  .finally(() => (loading.value = false));

// Parents and grandparents are visible on open, deeper levels load on expand.
async function loadParentsAndGrandparents() {
  const parentNodes = (await fetchParentNodes(props.cultivarId, 'root')) ?? [];
  await Promise.all(
    parentNodes.map(async (parent) => {
      if (!parent.lazy) return;
      // On failure the parent stays lazy, so expanding it retries.
      const grandparents = await fetchParentNodes(
        parent.cultivarId!,
        parent.key,
      ).catch(() => {
        loadingFailed.value = true;
        return null;
      });
      if (!grandparents) return;
      parent.children = grandparents;
      parent.lazy = false;
    }),
  );
  parents.value = parentNodes;
  expanded.value = ['root', ...parentNodes.map((parent) => parent.key)];
}

// Empty parents means loading failed, which shows its own message.
const parentsUnknown = computed(
  () =>
    parents.value.length > 0 &&
    parents.value.every((parent) => parent.cultivarId === null),
);

const nodes = computed<PedigreeNode[]>(() => [
  {
    key: 'root',
    cultivarId: props.cultivarId,
    label: props.displayName,
    children: parents.value,
  },
]);

function loadParents({
  node,
  done,
  fail,
}: {
  node: PedigreeNode;
  done: (children: PedigreeNode[]) => void;
  fail: () => void;
}) {
  loadingFailed.value = false;
  fetchParentNodes(node.cultivarId!, node.key)
    .then((children) => (children ? done(children) : fail()))
    .catch(() => {
      loadingFailed.value = true;
      fail();
    });
}
</script>
