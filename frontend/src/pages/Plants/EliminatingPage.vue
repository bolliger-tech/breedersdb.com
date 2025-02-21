<template>
  <PageLayout>
    <h1 class="q-mr-lg">{{ t('plants.eliminatePlant') }}</h1>

    <BaseStepper
      v-model="step"
      class="attribute-steps"
      @after-transition="onAfterTransition"
    >
      <q-step
        :name="1"
        title=""
        icon="svguse:/icons/sprite.svg#tree"
        done-icon="svguse:/icons/sprite.svg#tree"
        active-icon="svguse:/icons/sprite.svg#tree"
        :done="!!plant"
      >
        <PlantPicker
          ref="plantPicker"
          reject-eliminated
          @plant="(p) => (plant = p)"
          @fetching="(f) => (fetching = f)"
        />
        <q-stepper-navigation class="row justify-between reverse">
          <!-- reversed for better tab order -->
          <q-btn
            color="primary"
            :label="t('base.continue')"
            :loading="fetching"
            @click="step = 2"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="2"
        title=""
        icon="svguse:/icons/sprite.svg#trash"
        done-icon="svguse:/icons/sprite.svg#trash"
        active-icon="svguse:/icons/sprite.svg#trash"
      >
        <EntityCard
          v-if="plant"
          entity-type="plant"
          :label-id="plant.label_id"
          :plant-group="plant.plant_group"
        />
        <BaseGraphqlError v-if="error" :error="error" />
        <q-stepper-navigation class="row justify-between reverse">
          <!-- reversed for better tab order -->
          <q-btn
            ref="eliminateButton"
            color="primary"
            :label="t('plants.eliminate')"
            :loading="eliminating"
            @click="eliminate"
          />
          <q-btn
            flat
            color="primary"
            :label="t('base.back')"
            @click="plant = null"
          />
        </q-stepper-navigation>
      </q-step>
    </BaseStepper>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import PlantPicker from 'src/components/Plant/PlantPicker.vue';
import EntityCard from 'src/components/Entity/EntityCard.vue';
import BaseStepper from 'src/components/Base/BaseStepper.vue';
import { nextTick, ref, watch } from 'vue';
import { PlantFragmentWithSegments } from 'src/components/Plant/plantFragment';
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { useQuasar, type QBtn } from 'quasar';

const { t } = useI18n();

const step = ref(1);
const plantPicker = ref<InstanceType<typeof PlantPicker> | null>(null);
const eliminateButton = ref<QBtn | null>();
const plant = ref<PlantFragmentWithSegments | null>(null);
const fetching = ref(false);

const {
  error,
  executeMutation,
  fetching: eliminating,
} = useMutation(
  graphql(`
    mutation EliminatePlant($id: Int!) {
      update_plants_by_pk(
        pk_columns: { id: $id }
        _set: { date_eliminated: "now()" }
      ) {
        id
      }
    }
  `),
);

const { notify } = useQuasar();

async function eliminate() {
  if (!plant.value) {
    notify({
      type: 'negative',
      message: t('plants.eliminatePlantError'),
      timeout: 3000,
      position: 'top',
    });

    step.value = 1;

    return;
  }

  await executeMutation({ id: plant.value.id });
  await nextTick();

  if (!error.value) {
    notify({
      type: 'positive',
      message: t('plants.eliminatePlantSuccess', {
        labelId: plant.value?.label_id,
      }),
      color: 'positive',
      timeout: 3000,
      position: 'top',
    });

    plant.value = null;
  }
}

function onAfterTransition(to: string | number) {
  switch (to) {
    case 1:
      plantPicker.value?.focus();
      break;
    case 2:
      eliminateButton.value?.$el.focus();
      break;
  }
}

watch(plant, (newPlant) => {
  step.value = newPlant ? 2 : 1;
  if (!plant.value) error.value = undefined;
});
</script>
