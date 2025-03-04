<template>
  <BaseStepper
    v-model="step"
    class="attribute-steps"
    @after-transition="onAfterTransition"
  >
    <q-step
      :name="1"
      icon="svguse:/icons/sprite.svg#form"
      done-icon="svguse:/icons/sprite.svg#form"
      active-icon="svguse:/icons/sprite.svg#form"
      title=""
      :done="step1Done"
    >
      <AttributionFormSelect ref="attributeFormSelectRef" v-model="formId" />

      <q-stepper-navigation class="row justify-end">
        <q-btn
          color="primary"
          :label="t('base.continue')"
          @click="completeStep1"
        />
      </q-stepper-navigation>
    </q-step>

    <q-step
      :name="2"
      title=""
      icon="sell"
      done-icon="sell"
      active-icon="sell"
      :done="step2Done"
      :disable="!step1Done"
    >
      <AttributionAddMetaData
        ref="attributeMetaDataRef"
        v-model:author="author"
        v-model:date="date"
        :repeat="repeatInt"
        @update:repeat="repeat = $event"
      />

      <q-stepper-navigation class="row justify-between reverse">
        <!-- reversed for better tab order -->
        <q-btn
          color="primary"
          :label="t('base.continue')"
          @click="completeStep2"
        />
        <q-btn flat color="primary" :label="t('base.back')" @click="step = 1" />
      </q-stepper-navigation>
    </q-step>

    <q-step
      :name="3"
      title=""
      :icon="entityIcon"
      :done-icon="entityIcon"
      :active-icon="entityIcon"
      :disable="!step1Done || !step2Done"
      :done="step3Done"
    >
      <slot name="entity-picker"></slot>
      <q-stepper-navigation class="row justify-between reverse">
        <!-- reversed for better tab order -->
        <q-btn
          color="primary"
          :label="t('base.continue')"
          :loading="entityLoading"
          @click="completeStep3"
        />
        <q-btn flat color="primary" :label="t('base.back')" @click="step = 2" />
      </q-stepper-navigation>
    </q-step>

    <q-step
      :name="4"
      title=""
      icon="svguse:/icons/sprite.svg#star"
      done-icon="svguse:/icons/sprite.svg#star"
      active-icon="svguse:/icons/sprite.svg#star"
      :disable="!step1Done || !step2Done || !step3Done"
    >
      <BaseGraphqlError v-if="formFetchError" :error="formFetchError" />
      <BaseSpinner v-else-if="formFetching" />
      <AttributionAddFormWrapper
        v-else
        :key="formKey"
        :entity="entity"
        :form="form"
        :date="date"
        :author="author"
        :repeat-target="repeatInt"
        :edit="(id) => (editAttributionId = id)"
        :edit-id="editAttributionId || undefined"
        @reset-edit-id="() => (editAttributionId = null)"
        @select-form="() => (step = 1)"
        @add-metadata="() => (step = 2)"
        @select-entity="() => (step = 3)"
        @reset-me="() => (formKey += 1)"
      />
      <q-stepper-navigation>
        <q-btn flat color="primary" :label="t('base.back')" @click="step = 3" />
      </q-stepper-navigation>
    </q-step>
  </BaseStepper>
</template>

<script setup lang="ts">
import AttributionFormSelect from 'src/components/AttributionForm/AttributionFormSelect.vue';
import AttributionAddMetaData from 'src/components/Attribution/Add/AttributionAddMetaData.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import AttributionAddFormWrapper, {
  type AttributionAddFormWrapperProps,
} from 'src/components/Attribution/Add/AttributionAddFormWrapper.vue';
import BaseStepper from 'src/components/Base/BaseStepper.vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import { useI18n } from 'src/composables/useI18n';
import type { Ref } from 'vue';
import { computed, ref, watch, type Slot } from 'vue';
import { useQueryArg } from 'src/composables/useQueryArg';
import { useQuasar } from 'quasar';
import {
  attributionFormFragment,
  type AttributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';

const FORM_ID_STORAGE_KEY = 'breedersdb-attribution-form-id';
const AUTHOR_STORAGE_KEY = 'breedersdb-attribution-author';
const REPEAT_STORAGE_KEY = 'breedersdb-attribute-repeat-target';

const FORM_ID_URL_KEY = 'form';
const AUTHOR_URL_KEY = 'author';
const DATE_URL_KEY = 'date';
const REPEAT_URL_KEY = 'repeat';

export interface AttributionAddStepsProps {
  entity: AttributionAddFormWrapperProps['entity'];
  entityLoading: boolean;
  entityIcon: string;
  focusEntityPicker?: () => void;
}

const props = defineProps<AttributionAddStepsProps>();

defineSlots<{
  'entity-picker': Slot;
}>();

const emit = defineEmits<{
  entityStepCompleted: [];
}>();

const formQuery = graphql(
  `
    query AttributionForm($formId: Int!) {
      attribution_forms_by_pk(id: $formId) {
        ...attributionFormFragment
      }
    }
  `,
  [attributionFormFragment],
);

const { t } = useI18n();
const { localStorage, sessionStorage } = useQuasar();

// step 1
const { queryArg: formId } = useQueryArg<number>({
  key: FORM_ID_URL_KEY,
  defaultValue: sessionStorage.getItem<number>(FORM_ID_STORAGE_KEY) ?? -1,
  replace: true,
  showDefaultInUrl: true,
});
watch(formId, (f) => sessionStorage.set(FORM_ID_STORAGE_KEY, f));

const formVariables = computed(() => ({
  formId: parseInt(formId.value.toString(), 10),
}));

const {
  data: formData,
  error: formFetchError,
  fetching: formFetching,
  ...urqlForm
} = useQuery({
  query: formQuery,
  variables: formVariables,
  pause: true,
  context: { additionalTypenames: ['attribution_forms'] },
  requestPolicy: 'cache-and-network',
});
watch(
  formVariables,
  () => {
    if (formId.value > -1) {
      urqlForm.executeQuery();
    }
  },
  { immediate: true, deep: true, flush: 'post' },
);

const form = computed(
  () =>
    (formData.value?.attribution_forms_by_pk as
      | AttributionFormFragment
      | undefined) ?? null,
);

const attributeFormSelectRef: Ref<InstanceType<
  typeof AttributionFormSelect
> | null> = ref<InstanceType<typeof AttributionFormSelect> | null>(null);

function completeStep1() {
  Promise.resolve(attributeFormSelectRef.value?.validate()).then((valid) => {
    if (valid) {
      step.value = 2;
    }
  });
}

// step 2
const { queryArg: author } = useQueryArg<string>({
  key: AUTHOR_URL_KEY,
  defaultValue: localStorage.getItem<string>(AUTHOR_STORAGE_KEY) ?? '',
  replace: true,
  showDefaultInUrl: true,
});
watch(author, (a) => localStorage.set(AUTHOR_STORAGE_KEY, a));

const { queryArg: date } = useQueryArg({
  key: DATE_URL_KEY,
  defaultValue: new Date().toISOString().split('T')[0],
  replace: true,
  showDefaultInUrl: true,
});

const { queryArg: repeat } = useQueryArg<number>({
  key: REPEAT_URL_KEY,
  defaultValue: sessionStorage.getItem<number>(REPEAT_STORAGE_KEY) ?? 0,
  replace: true,
  showDefaultInUrl: true,
});
watch(repeat, (r) => sessionStorage.set(REPEAT_STORAGE_KEY, r));
const repeatInt = computed(() => parseInt(repeat.value.toString(), 10));

const attributeMetaDataRef = ref<InstanceType<
  typeof AttributionAddMetaData
> | null>(null);

function completeStep2() {
  Promise.resolve(attributeMetaDataRef.value?.validate()).then((valid) => {
    if (valid) {
      step.value = 3;
    }
  });
}

// step 3
function completeStep3() {
  emit('entityStepCompleted');
}

// step 4
const formKey = ref(0);

// all
const editAttributionId = ref<number | null>(null);

const step1Done = computed(() => formId.value > -1);

const step2Done = computed(
  () =>
    author.value.length > 0 && date.value.length > 0 && repeatInt.value >= 0,
);

const step3Done = computed(
  () => !!props.entity.data || editAttributionId.value !== null,
);

watch(step3Done, (done) => {
  if (done) {
    step.value = 4;
  }
});

function getInitialStep() {
  // never jump directly to step 4 to make very clear, that any attribution input is lost
  return !step1Done.value ? 1 : !step2Done.value ? 2 : 3;
}

const step = ref(getInitialStep());
watch(step, (s) => {
  if (s === 3) {
    editAttributionId.value = null;
  }
});

function onAfterTransition(to: string | number) {
  if (to === 3) {
    props.focusEntityPicker?.();
  }
}
</script>
