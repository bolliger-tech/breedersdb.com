<template>
  <q-dialog v-model="open" :full-width="$q.screen.xs" @before-show="load">
    <q-card class="cultivar-pedigree-dialog">
      <q-card-section>
        <div class="row items-center no-wrap q-mb-md">
          <h3 class="col q-my-none">{{ t('cultivars.pedigree.title') }}</h3>
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
            :aria-label="t('base.close')"
          />
        </div>

        <BaseSpinner v-if="loading" />
        <template v-else>
          <BaseMessage
            v-if="loadingFailed"
            type="error"
            class="q-mb-md"
            :message="t('cultivars.pedigree.loadingFailed')"
          />
          <div v-if="tree && layout" class="cultivar-pedigree-dialog__chart">
            <CultivarPedigreeNode
              :node="tree"
              :layout="layout"
              :loading-keys="loadingKeys"
              @load="loadParents"
              @navigate="open = false"
            />
          </div>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
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
const open = defineModel<boolean>({ required: true });

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
async function fetchParents(
  node: PedigreeTree,
): Promise<[PedigreeTree, PedigreeTree] | null> {
  const result = await query(
    parentsQuery,
    { id: node.cultivarId! },
    { requestPolicy: 'cache-and-network' },
  );
  const crossing = result?.data?.cultivars_by_pk?.lot.crossing;
  return crossing ? toPedigreeNodes(crossing, node.key) : null;
}

const tree = ref<PedigreeTree | null>(null);
const layout = computed(() => tree.value && layoutPedigree(tree.value));
const loading = ref(false);
const loadingFailed = ref(false);
const loadingKeys = ref(new Set<string>());

// Each opening loads afresh. A load started by an earlier opening (possibly
// of another cultivar) must not overwrite the current one.
let currentLoad = 0;

async function load() {
  const thisLoad = ++currentLoad;
  tree.value = null;
  loading.value = true;
  loadingFailed.value = false;
  loadingKeys.value.clear();

  const root: PedigreeTree = {
    key: 'root',
    cultivarId: props.cultivarId,
    name: props.displayName,
    expandable: true,
  };
  try {
    await loadParentsAndGrandparents(root);
    if (thisLoad !== currentLoad) return;
    if (root.parents) tree.value = root;
    else loadingFailed.value = true;
  } catch {
    if (thisLoad === currentLoad) loadingFailed.value = true;
  } finally {
    if (thisLoad === currentLoad) loading.value = false;
  }
}

// Parents and grandparents are visible on open, deeper levels on demand.
async function loadParentsAndGrandparents(root: PedigreeTree) {
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
}

async function loadParents(node: PedigreeTree) {
  loadingFailed.value = false;
  loadingKeys.value.add(node.key);
  try {
    const parents = await fetchParents(node);
    if (parents) node.parents = parents;
  } catch {
    loadingFailed.value = true;
  } finally {
    loadingKeys.value.delete(node.key);
  }
}
</script>

<style lang="scss" scoped>
// Quasar caps dialogs at 560px. The chart may use the whole screen width.
.cultivar-pedigree-dialog {
  max-width: 100%;
}

.cultivar-pedigree-dialog__chart {
  overflow-x: auto;
}
</style>
