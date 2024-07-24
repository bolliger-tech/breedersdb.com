<template>
  <EntitySelect
    ref="selectRef"
    v-model="form"
    :label="t('attributions.add.selectForm')"
    :options="options"
    option-value="id"
    option-label="name"
    :loading="fetching"
    :error="error"
    required
  >
    <template #option="option">
      <q-item v-bind="option.itemProps">
        <q-item-section>
          <q-item-label>{{ option.opt.name }}</q-item-label>
          <q-item-label caption>{{ option.opt.description }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </EntitySelect>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, watch, ref, Ref } from 'vue';
import { ResultOf, graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import EntitySelect, {
  EntitySelectInstance,
} from 'src/components/Entity/Edit/EntitySelect.vue';

export type AttributionForm = ResultOf<typeof query>['attribution_forms'][0];

const selectRef: Ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null> = ref<EntitySelectInstance<{
  id: number;
  name: string;
}> | null>(null);

defineExpose({
  validate: () => selectRef.value?.validate(),
});

const formId = defineModel<number | null>({ required: true });
const emit = defineEmits<{
  select: [form: AttributionForm | null];
}>();

const query = graphql(`
  query AttributionForms {
    attribution_forms(
      where: { disabled: { _eq: false } }
      order_by: { name: asc }
    ) {
      id
      name
      description
    }
  }
`);

const { data, error, fetching } = useQuery({
  query,
});

const options = computed(() => data.value?.attribution_forms ?? []);

const form = computed<AttributionForm | null>({
  get: () => options.value.find((o) => o.id === formId.value) ?? null,
  set: (f) => (formId.value = f?.id ?? -1),
});

// use watch instead of form.set so the initial form is also emitted
watch(form, (f) => emit('select', f));

const { t } = useI18n();
</script>
