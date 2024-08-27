<template>
  <q-dialog v-model="show">
    <q-card style="min-width: 300px">
      <q-card-section class="row items-center q-py-sm">
        <h2 class="q-ma-none nowrap-elipsis" style="width: calc(100% - 34px)">
          {{ t('analyze.header.addName') }}
        </h2>
        <q-btn icon="close" flat round dense @click="onCancel" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <EntityInput
          ref="inputRef"
          v-model="name"
          :rules="[
            (v: string) =>
              !!v ||
              t('base.validation.xIsRequired', {
                x: t('entity.commonColumns.name'),
              }),
            async () =>
              (await isUnique()) || t('base.validation.nameNotUnique'),
          ]"
          required
          :loading="isUniqueFetching"
          :label="t('entity.commonColumns.name')"
          @keydown.enter="validateNameAndSave"
        />
      </q-card-section>

      <q-separator />
      <q-card-actions align="right">
        <q-btn
          flat
          :label="t('base.cancel')"
          color="primary"
          @click="onCancel"
        />
        <q-btn
          flat
          :label="t('base.save')"
          color="primary"
          @click="validateNameAndSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityInput, {
  EntityInputInstance,
} from 'src/components/Entity/Edit/EntityInput.vue';
import { ref, nextTick, computed } from 'vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { AnalyzeFilterBaseTables } from 'src/graphql';

export interface AnalyzeHeaderNameDialogProps {
  analyzeId: 'new' | number;
  baseTable: AnalyzeFilterBaseTables;
}

const props = defineProps<AnalyzeHeaderNameDialogProps>();
const name = defineModel<string>('name', { required: true });
const show = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ save: [] }>();

const inputRef = ref<EntityInputInstance | null>(null);
const oldName = ref(name.value);

const variables = computed(() => ({
  name: name.value,
  baseTable: props.baseTable,
}));

const query = graphql(`
  query AnalyzeFilterNameIsUnique(
    $name: citext!
    $baseTable: analyze_filter_base_tables_enum!
  ) {
    analyze_filters(
      where: { name: { _eq: $name }, base_table: { _eq: $baseTable } }
      limit: 1
    ) {
      id
    }
  }
`);

const { executeQuery, fetching: isUniqueFetching } = useQuery({
  query,
  variables,
  pause: true,
});

async function isUnique() {
  await nextTick(); // wait for the variables to be updated
  const result = await executeQuery();
  if (result.error.value) {
    console.error(result.error);
    return true;
  }
  const data = result.data?.value;
  return (
    data?.analyze_filters.length === 0 ||
    data?.analyze_filters[0]?.id === props.analyzeId
  );
}

function validateNameAndSave() {
  Promise.resolve(inputRef.value?.validate()).then((valid) => {
    if (valid) {
      show.value = false;
      emit('save');
    }
  });
}

function onCancel() {
  name.value = oldName.value;
  show.value = false;
}

const { t } = useI18n();
</script>
