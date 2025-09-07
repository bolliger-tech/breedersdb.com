<template>
  <q-item v-if="fetching">
    <q-item-section class="row align-center">
      <q-spinner color="primary" size="2em" />
    </q-item-section>
  </q-item>
  <q-item v-else-if="fetchError">
    <q-item-section class="text-negative">
      {{ t('plantGroups.autocreate.fetchFailed') }}
    </q-item-section>
  </q-item>
  <template v-else-if="searchValue.includes('.') && propositions">
    <q-item
      v-for="proposition in propositions"
      :id="`plant-group-select-${proposition.label.existing}${proposition.label.new}`"
      :key="`${proposition.label.existing}${proposition.label.new}`"
      clickable
      @keydown.down="focusNext"
      @click="select(proposition)"
      @keydown.enter="select(proposition)"
    >
      <q-item-section>
        <div class="row align-center">
          <q-chip
            class="q-mr-sm text-uppercase text-bold"
            size="sm"
            color="primary"
            dark
            :riple="false"
            :clickable="false"
            dense
            >{{ t('plantGroups.autocreate.create') }}</q-chip
          >
          <div>
            <span class="text-muted">{{ proposition.label.existing }}</span>
            <span class="text-bold">{{ proposition.label.new }}</span>
          </div>
          <div
            v-if="proposition.nextFree"
            class="q-ml-lg text-muted text-caption"
          >
            {{
              t('plantGroups.autocreate.nextFree', {
                num:
                  'cultivar' in proposition.entity
                    ? proposition.entity.cultivar.name_segment
                    : 'ERROR',
              })
            }}
          </div>
        </div>
      </q-item-section>
    </q-item>
  </template>
  <q-item v-else>
    <q-item-section class="text-grey">
      {{
        searchValue.includes('.')
          ? t('plantGroups.autocreate.nothingFound')
          : t('plantGroups.autocreate.noDot')
      }}
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { QItem } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { ref, watch, onBeforeUnmount, toRefs } from 'vue';
import { graphql } from 'src/graphql';
import type { CombinedError } from '@urql/vue';
import { useMutation } from '@urql/vue';
import { useAutocreatePropositions } from './useAutocreatePropositions';

export interface PlantGroupSelectAutocreateProps {
  searchValue: string;
}

const props = defineProps<PlantGroupSelectAutocreateProps>();
const { searchValue } = toRefs(props);

const { propositions, fetchError, fetching } = useAutocreatePropositions({
  searchValue,
});

const emit = defineEmits<{
  saving: [boolean];
  saveError: [CombinedError | undefined];
  select: [number];
}>();

defineExpose({
  focusNext,
  selectFirst,
});

const { t } = useI18n();

const selectedItem = ref<number | null>(null);

function focusNext() {
  if (!propositions.value) {
    selectedItem.value = null;
    return;
  }

  if (selectedItem.value === null) {
    selectedItem.value = 0;
  } else {
    selectedItem.value = (selectedItem.value + 1) % propositions.value.length;
  }

  const label = propositions.value[selectedItem.value]?.label;

  if (!label) {
    return;
  }

  const item = document.getElementById(
    `plant-group-select-${label.existing}${label.new}`,
  );
  item?.focus();
}

const insertCultivarMutation = graphql(`
  mutation InsertCultivar(
    $lotId: Int!
    $cultivarNameSegment: citext!
    $groupNameSegment: citext!
  ) {
    insert_cultivars_one(
      object: {
        lot_id: $lotId
        name_segment: $cultivarNameSegment
        plant_groups: { data: { name_segment: $groupNameSegment } }
      }
    ) {
      id
      plant_groups {
        id
      }
    }
  }
`);

const insertPlantGroupMutation = graphql(`
  mutation InsertPlantGroup($cultivarId: Int!, $nameSegment: citext!) {
    insert_plant_groups_one(
      object: { cultivar_id: $cultivarId, name_segment: $nameSegment }
    ) {
      id
    }
  }
`);

const {
  fetching: savingCultivar,
  error: saveCultivarError,
  ...urqlCultivarMutation
} = useMutation(insertCultivarMutation);

const {
  fetching: savingPlantGropup,
  error: savePlantGropupError,
  ...urqlPlantGroupMutation
} = useMutation(insertPlantGroupMutation);

watch([saveCultivarError, savePlantGropupError], () => {
  emit('saveError', saveCultivarError.value || savePlantGropupError.value);
});

watch([savingCultivar, savingPlantGropup], () => {
  emit('saving', savingCultivar.value || savingPlantGropup.value);
});

async function select(proposition: NonNullable<typeof propositions.value>[0]) {
  const resp =
    'cultivar' in proposition.entity
      ? await urqlCultivarMutation.executeMutation({
          lotId: proposition.entity.cultivar.lot_id,
          cultivarNameSegment: proposition.entity.cultivar.name_segment,
          groupNameSegment: proposition.entity.cultivar.group.name_segment,
        })
      : await urqlPlantGroupMutation.executeMutation({
          cultivarId: proposition.entity.group.cultivar_id,
          nameSegment: proposition.entity.group.name_segment,
        });

  if (resp.error) {
    console.error(resp.error);
    return;
  }

  const respString = JSON.stringify(resp, null, 2);

  if (!resp.data) {
    console.error(`Unexpected result from backend: ${respString}`);
    throw new Error(`Unexpected result from backend: ${respString}`);
  }

  const groupId =
    'insert_plant_groups_one' in resp.data
      ? resp.data.insert_plant_groups_one?.id
      : resp.data.insert_cultivars_one?.plant_groups[0]?.id;

  if (typeof groupId === 'undefined') {
    console.error(`Unexpected result from backend: ${respString}`);
    throw new Error(`Unexpected result from backend: ${respString}`);
  }

  emit('select', groupId);
}

async function selectFirst() {
  if (!propositions.value) {
    return;
  }

  const proposition =
    selectedItem.value !== null && propositions.value[selectedItem.value]
      ? propositions.value[selectedItem.value]
      : propositions.value[0];

  if (!proposition) {
    return;
  }

  await select(proposition);
}

onBeforeUnmount(() => {
  emit('saving', false);
  emit('saveError', undefined);
});
</script>
