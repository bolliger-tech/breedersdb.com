<template>
  <BaseSpinner v-if="loading" />
  <template v-else>
    <BaseMessage
      v-if="loadingFailed"
      type="error"
      class="q-mb-md"
      :message="t('cultivars.pedigree.loadingFailed')"
    />
    <div v-if="tree && layout" class="cultivar-pedigree-chart">
      <CultivarPedigreeNode :node="tree" :layout="layout" @load="loadParents" />
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import { useI18n } from 'src/composables/useI18n';
import { useOneShotQuery } from 'src/composables/useOneShotQuery';
import CultivarPedigreeNode from './CultivarPedigreeNode.vue';
import {
  layoutPedigree,
  pedigreeCultivarFragment,
  toPedigreeNodes,
  type PedigreeTree,
} from './pedigree';

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

// Resolves to null if the component was unmounted meanwhile. Rejects if the
// query failed or the cultivar's parents are missing.
async function fetchParents(
  node: PedigreeTree,
): Promise<[PedigreeTree, PedigreeTree] | null> {
  const result = await query(
    parentsQuery,
    { id: node.cultivarId! },
    { requestPolicy: 'cache-and-network' },
  );
  if (!result) return null;
  const crossing = result.data?.cultivars_by_pk?.lot.crossing;
  if (!crossing) throw new Error(`Cultivar ${node.cultivarId} not found`);
  return toPedigreeNodes(crossing, node.key);
}

// The whole loaded tree lives here, as each card's position depends on all
// ancestors.
const tree = ref<PedigreeTree | null>(null);
const layout = computed(() => tree.value && layoutPedigree(tree.value));
const loading = ref(true);
const loadingFailed = ref(false);

// Not awaited in setup, so the dialog shows the spinner meanwhile.
loadParentsAndGrandparents()
  .catch(() => (loadingFailed.value = true))
  .finally(() => (loading.value = false));

// Parents and grandparents are visible on open, deeper levels on demand.
async function loadParentsAndGrandparents() {
  const root: PedigreeTree = {
    key: 'root',
    cultivarId: props.cultivarId,
    name: props.displayName,
    expandable: true,
  };
  const parents = await fetchParents(root);
  if (!parents) return;
  await Promise.all(
    parents.map(async (parent) => {
      if (!parent.expandable) return;
      // On failure the parent keeps its button, which retries.
      const grandparents = await fetchParents(parent).catch(() => {
        loadingFailed.value = true;
        return null;
      });
      if (grandparents) parent.parents = grandparents;
    }),
  );
  root.parents = parents;
  tree.value = root;
}

async function loadParents(node: PedigreeTree) {
  loadingFailed.value = false;
  node.loading = true;
  try {
    const parents = await fetchParents(node);
    if (parents) node.parents = parents;
  } catch {
    loadingFailed.value = true;
  } finally {
    node.loading = false;
  }
}
</script>

<style lang="scss" scoped>
.cultivar-pedigree-chart {
  overflow-x: auto;
}
</style>
