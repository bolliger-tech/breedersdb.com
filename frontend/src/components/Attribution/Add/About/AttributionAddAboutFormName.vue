<template>
  <i18n-t
    keypath="attributions.add.formName"
    scope="global"
    class="text-caption text-muted q-mb-none"
    tag="p"
  >
    <template #formName>
      <template v-if="fetching">{{ t('base.loading') }}</template>
      <template v-else-if="error">{{ t('base.error') }}</template>
      <strong v-else :class="$q.dark.isActive ? 'text-white' : 'text-black'">
        {{ data?.attribution_forms_by_pk?.name }}.
      </strong>
    </template>
  </i18n-t>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, watch, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';

const props = defineProps<{
  formId: number;
}>();

const query = graphql(`
  query GetFormName($formId: Int!) {
    attribution_forms_by_pk(id: $formId) {
      id
      name
    }
  }
`);

const variables = computed(() => ({ formId: props.formId }));

const pause = ref(false);

const { fetching, data, error } = useQuery({
  query,
  variables,
  context: { additionalTypenames: ['attribution_forms'] },
  requestPolicy: 'cache-first',
  pause,
});

const { t } = useI18n();

watch(error, () => {
  if (error.value) {
    // don't capture exception (network errors)
    console.error(error.value);
  }
});

watch(data, () => {
  // don't update on save
  pause.value = true;
});
</script>
