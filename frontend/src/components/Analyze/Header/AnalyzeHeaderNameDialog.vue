<template>
  <q-dialog v-model="show">
    <q-card style="min-width: 300px">
      <q-card-section class="row items-center q-py-sm">
        <h2 class="q-ma-none nowrap-ellipsis" style="width: calc(100% - 34px)">
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
            (v: string | null | undefined) =>
              !!v ||
              t('base.validation.xIsRequired', {
                x: t('entity.commonColumns.name'),
              }),
            async (val: string) =>
              (await isUnique(val)) || t('base.validation.nameNotUnique'),
          ]"
          required
          :loading="isUniqueFetching"
          :label="t('entity.commonColumns.name')"
          trim
          debounce="300"
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
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import { ref, computed } from 'vue';
import type { AnalyzeFilterBaseTables } from 'src/graphql';
import { useIsUnique } from 'src/composables/useIsUnique';

export interface AnalyzeHeaderNameDialogProps {
  analyzeId: 'new' | number;
  baseTable: AnalyzeFilterBaseTables;
}

const props = defineProps<AnalyzeHeaderNameDialogProps>();
const name = defineModel<string>('name', { required: true });
const show = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ save: [] }>();

const inputRef = ref<InstanceType<typeof EntityInput> | null>(null);
const oldName = ref(name.value);

const additionalWhere = computed(() => ({
  base_table: { _eq: props.baseTable },
}));

const { isUnique, fetching: isUniqueFetching } = useIsUnique({
  tableName: 'analyze_filters',
  existingId: typeof props.analyzeId === 'number' ? props.analyzeId : undefined,
  additionalWhere,
});

async function validateNameAndSave() {
  await Promise.resolve(inputRef.value?.validate()).then((valid) => {
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
