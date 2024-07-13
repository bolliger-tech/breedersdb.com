<template>
  <q-stepper
    v-model="step"
    animated
    header-nav
    contracted
    class="attribute-steps"
  >
    <q-step
      :name="1"
      icon="svguse:/icons/sprite.svg#form"
      done-icon="svguse:/icons/sprite.svg#form"
      active-icon="svguse:/icons/sprite.svg#form"
      title=""
      :done="formId > -1"
    >
      <AttributeFormSelector ref="attributeFormSelectorRef" v-model="formId" />

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
      :done="!!author && !!date"
      :disable="formId === -1"
    >
      <AttributeMetaData
        ref="attributeMetaDataRef"
        v-model:author="author"
        v-model:date="date"
        v-model:repeat="repeat"
      />

      <q-stepper-navigation class="row justify-between">
        <q-btn flat color="primary" :label="t('base.back')" @click="step = 1" />
        <q-btn
          color="primary"
          :label="t('base.continue')"
          @click="completeStep2"
        />
      </q-stepper-navigation>
    </q-step>

    <q-step
      :name="3"
      title=""
      :icon="entityIcon"
      :done-icon="entityIcon"
      :active-icon="entityIcon"
      :disable="formId === -1 || !author || !date"
      :done="entityId !== null"
    >
      <slot name="entity-selector"></slot>
      <q-stepper-navigation class="row justify-between">
        <q-btn flat color="primary" :label="t('base.back')" @click="step = 2" />
        <q-btn
          color="primary"
          :label="t('base.continue')"
          :loading="entityLoading"
          @click="completeStep3"
        />
      </q-stepper-navigation>
    </q-step>

    <q-step
      :name="4"
      title=""
      icon="svguse:/icons/sprite.svg#star"
      done-icon="svguse:/icons/sprite.svg#star"
      active-icon="svguse:/icons/sprite.svg#star"
      :disable="formId === -1 || !author || !date || entityId === null"
    >
      <BaseGraphqlError v-if="formFetchError" :error="formFetchError" />
      <BaseSpinner v-else-if="formFetching" />
      <q-banner v-else-if="!form" class="text-white bg-negative">
        {{ t('attribute.noFormSelected') }}
        <template #action>
          <q-btn
            flat
            color="white"
            :label="t('attribute.selectForm')"
            @click="step = 1"
          />
        </template>
      </q-banner>
      <q-banner v-else-if="!author || !date" class="text-white bg-negative">
        {{ t('attribute.missingMetadata') }}
        <template #action>
          <q-btn
            flat
            color="white"
            :label="t('attribute.addMetadata')"
            @click="step = 2"
          />
        </template>
      </q-banner>
      <AttributeNoEntityError
        v-else-if="entityId === null"
        :entity-type="entityType"
        @click="step = 3"
      />

      <template v-else>
        <slot name="entity-preview"></slot>
        <AttributeForm
          :key="attributeFormKey"
          :entity-id="entityId"
          :entity-type="entityType"
          :form="form"
          :date="date"
          :author="author"
          :repeat-target="repeatInt"
          @saved="completeStep4"
        />
      </template>
      <q-stepper-navigation>
        <q-btn flat color="primary" :label="t('base.back')" @click="step = 3" />
      </q-stepper-navigation>
    </q-step>
  </q-stepper>
</template>

<script setup lang="ts">
import AttributeFormSelector from 'src/components/Attribute/AttributeFormSelector.vue';
import AttributeMetaData from 'src/components/Attribute/AttributeMetaData.vue';
import AttributeForm from 'src/components/Attribute/AttributeForm.vue';
import AttributeNoEntityError from 'src/components/Attribute/AttributeNoEntityError.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { graphql, ResultOf } from 'src/graphql';
import { useQuery } from '@urql/vue';
import { useI18n } from 'src/composables/useI18n';
import { computed, ref, watch } from 'vue';
import { useQueryArg } from 'src/composables/useQueryArg';
import { useQuasar } from 'quasar';
import { AttributableEntities } from './attributableEntities';
import { attributeFragment, type AttributeFragment } from './attributeFragment';

const FORM_ID_STORAGE_KEY = 'breedersdb-attribution-form-id';
const AUTHOR_STORAGE_KEY = 'breedersdb-attribution-author';
const REPEAT_STORAGE_KEY = 'breedersdb-attribute-repeat-target';

export interface AttributeStepsProps {
  entityId: number | null;
  entityType: AttributableEntities;
  entityLoading: boolean;
  entityIcon: string;
}

const props = defineProps<AttributeStepsProps>();

defineSlots<{
  'entity-selector': void;
  'entity-preview': void;
}>();

const emit = defineEmits<{
  entityStepCompleted: [];
}>();

const formQuery = graphql(
  `
    query AttributionForm($formId: Int!) {
      attribution_forms_by_pk(id: $formId) {
        id
        name
        description
        attribution_form_fields(
          where: { attribute: { disabled: { _eq: false } } }
          order_by: { priority: asc }
        ) {
          id
          priority
          attribute {
            ...attributeFragment
          }
        }
      }
    }
  `,
  [attributeFragment],
);

type Form = NonNullable<ResultOf<typeof formQuery>['attribution_forms_by_pk']>;
export type AttributionForm = Form & {
  attribution_form_fields: {
    attribute: AttributeFragment;
    priority: number;
    id: number;
  }[];
};

const { t } = useI18n();
const { localStorage, sessionStorage } = useQuasar();

// step 1
const { queryArg: formId } = useQueryArg<number>({
  key: 'form',
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
} = useQuery({
  query: formQuery,
  variables: formVariables,
  pause: formId.value === -1,
});

const form = computed(
  () => (formData.value?.attribution_forms_by_pk as AttributionForm) ?? null,
);

const attributeFormSelectorRef = ref<InstanceType<
  typeof AttributeFormSelector
> | null>(null);

function completeStep1() {
  Promise.resolve(attributeFormSelectorRef.value?.validate()).then((valid) => {
    if (valid) {
      step.value = 2;
    }
  });
}

// step 2
const { queryArg: author } = useQueryArg<string>({
  key: 'author',
  defaultValue: localStorage.getItem<string>(AUTHOR_STORAGE_KEY) ?? '',
  replace: true,
  showDefaultInUrl: true,
});
watch(author, (a) => localStorage.set(AUTHOR_STORAGE_KEY, a));

const { queryArg: date } = useQueryArg({
  key: 'date',
  defaultValue: new Date().toISOString().split('T')[0],
  replace: true,
  showDefaultInUrl: true,
});

const { queryArg: repeat } = useQueryArg<number>({
  key: 'repeat',
  defaultValue: sessionStorage.getItem<number>(REPEAT_STORAGE_KEY) ?? 0,
  replace: true,
  showDefaultInUrl: true,
});
watch(repeat, (r) => sessionStorage.set(REPEAT_STORAGE_KEY, r));
const repeatInt = computed(() => parseInt(repeat.value.toString(), 10));

const attributeMetaDataRef = ref<InstanceType<typeof AttributeMetaData> | null>(
  null,
);

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
const attributeFormKey = ref(0);

function completeStep4(repeatCount: number) {
  if (repeatCount >= repeatInt.value) {
    // select next entity
    step.value = 3;
  } else {
    // stay on the same entity
    // but reset the AttributeForm
    attributeFormKey.value += 1;
  }
}

watch(
  () => props.entityId,
  () => {
    if (props.entityId !== null) {
      step.value = 4;
    }
  },
);

const step = ref(1);
</script>

<style scoped>
:global(.attribute-steps .q-stepper__tab--active) {
  background: color-mix(in srgb, currentColor 9%, white 5%);
}
:global(
    .attribute-steps :is(.q-stepper__tab--active, .q-stepper__tab--done) .q-icon
  ) {
  color: white;
}

:global(.attribute-steps .q-stepper__header) {
  min-height: 50px;
}
:global(.attribute-steps .q-stepper__header .q-stepper__tab) {
  padding: 0 max(0.5em, calc(10svw - 24px - 4px));
  min-height: clamp(50px, 7svw, 72px);
}
</style>
