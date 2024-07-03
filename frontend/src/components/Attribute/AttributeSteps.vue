<template>
  <q-stepper v-model="step" vertical color="primary" animated header-nav>
    <q-step
      :name="1"
      icon="svguse:/icons/sprite.svg#form"
      :title="t('attribute.form')"
      :done="!!form"
      :caption="step > 1 ? form?.name : undefined"
    >
      <AttributeFormSelector
        ref="attributeFormSelectorRef"
        v-model="formId"
        @select="(f) => (form = f)"
      />

      <q-stepper-navigation>
        <q-btn
          color="primary"
          :label="t('base.continue')"
          @click="completeStep1"
        />
      </q-stepper-navigation>
    </q-step>

    <q-step
      :name="2"
      :title="t('attribute.addMeta')"
      :caption="metadataCaption"
      icon="sell"
      :done="!!author && !!date"
      :disable="!form"
    >
      <AttributeMetaData
        ref="attributeMetaDataRef"
        v-model:author="author"
        v-model:date="date"
        v-model:repeat="repeat"
      />

      <q-stepper-navigation>
        <q-btn
          color="primary"
          :label="t('base.continue')"
          @click="completeStep2"
        />
        <q-btn
          flat
          color="primary"
          :label="t('base.back')"
          class="q-ml-sm"
          @click="step = 1"
        />
      </q-stepper-navigation>
    </q-step>

    <q-step
      :name="3"
      :title="entityTitle"
      :caption="entityCaption"
      :icon="entityIcon"
      :disable="!form || !author || !date"
      :done="hasEntity"
    >
      <slot name="entity-selector"></slot>
      <q-stepper-navigation>
        <q-btn
          color="primary"
          :label="t('base.continue')"
          :loading="entityLoading"
          @click="completeStep3"
        />
        <q-btn
          flat
          color="primary"
          :label="t('base.back')"
          class="q-ml-sm"
          @click="step = 2"
        />
      </q-stepper-navigation>
    </q-step>

    <q-step :name="4" title="Attributes" icon="svguse:/icons/sprite.svg#star">
      Try out different ad text to see what brings in the most customers, and
      learn how to enhance your ads using features like ad extensions. If you
      run into any problems with your ads, find out how to tell if they're
      running and how to resolve approval issues.

      <q-stepper-navigation>
        <q-btn color="primary" label="Finish" />
        <q-btn
          flat
          color="primary"
          label="Back"
          class="q-ml-sm"
          @click="step = 3"
        />
      </q-stepper-navigation>
    </q-step>
  </q-stepper>
</template>

<script setup lang="ts">
import AttributeFormSelector, {
  AttributionForm,
} from 'src/components/Attribute/AttributeFormSelector.vue';
import AttributeMetaData from 'src/components/Attribute/AttributeMetaData.vue';
import { useI18n } from 'src/composables/useI18n';
import { computed, ref, watch } from 'vue';
import { useQueryArg } from 'src/composables/useQueryArg';
import { useQuasar } from 'quasar';
import { localizeDate } from 'src/utils/dateUtils';

export interface AttributeStepsProps {
  hasEntity: boolean;
  entityLoading: boolean;
  entityTitle: string;
  entityIcon: string;
  entityCaption: string | undefined;
}

const props = defineProps<AttributeStepsProps>();

defineSlots<{
  'entity-selector': void;
}>();

const emit = defineEmits<{
  entityStepCompleted: [];
}>();

const { t } = useI18n();
const { localStorage, sessionStorage } = useQuasar();

// step 1
const { queryArg: formId } = useQueryArg<number>({
  key: 'form',
  defaultValue:
    sessionStorage.getItem<number>('breedersdb-attribution-formId') ?? -1,
  replace: true,
  showDefaultInUrl: true,
});
watch(formId, (f) => sessionStorage.set('breedersdb-attribution-formId', f));

const form = ref<AttributionForm | null>(null);

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
  defaultValue:
    localStorage.getItem<string>('breedersdb-attribution-author') ?? '',
  replace: true,
  showDefaultInUrl: true,
});
watch(author, (a) => localStorage.set('breedersdb-attribution-author', a));

const { queryArg: date } = useQueryArg({
  key: 'date',
  defaultValue: new Date().toISOString().split('T')[0],
  replace: true,
  showDefaultInUrl: true,
});

const { queryArg: repeat } = useQueryArg<number>({
  key: 'repeat',
  defaultValue:
    sessionStorage.getItem<number>('breedersdb-attribution-repeat') ?? 0,
  replace: true,
  showDefaultInUrl: true,
});
watch(repeat, (r) => sessionStorage.set('breedersdb-attribution-repeat', r));

const metadataCaption = computed(() => {
  if (step.value === 2 || !author.value || !date.value) {
    return undefined;
  }

  return (
    `${localizeDate(date.value)} ${author.value}` +
    (repeat.value > 0
      ? ` – ${t('attribute.valueCount', { count: repeat.value })}`
      : '')
  );
});

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

watch(
  () => props.hasEntity,
  () => {
    if (props.hasEntity) {
      step.value = 4;
    }
  },
);

const step = ref(1);
</script>
