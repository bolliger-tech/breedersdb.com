<template>
  <div class="row no-wrap align-center">
    <q-linear-progress
      size="1.5em"
      :value="progress"
      rounded
      dark
      @mouseover="showExplainer = true"
      @mouseleave="showExplainer = false"
    >
      <q-tooltip
        v-model="showExplainer"
        anchor="top middle"
        self="bottom middle"
        style="width: min(90svw, 500px)"
      >
        <i18n-t :keypath="`attribute.counter.description`" scope="global">
          <template #count
            ><strong>{{ count }}</strong></template
          >
          <template #entity>{{ entity }}</template>
          <template #total>{{ total }}</template>
        </i18n-t>
      </q-tooltip>

      <div class="absolute-full flex flex-center">
        <q-badge color="white" text-color="black">
          <span class="text-weight-bold">{{ count }}</span
          >&nbsp;/&nbsp;{{ total }}
        </q-badge>
      </div>
    </q-linear-progress>
    <q-btn
      v-if="count >= total"
      flat
      color="white"
      size="sm"
      dense
      class="q-px-sm"
      style="white-space: nowrap"
      @click="$emit('reset')"
      >{{ t('attributions.add.counter.reset') }}</q-btn
    >
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import { useAttributableEntityName } from 'src/components/Attribution/useAttributableEntityName';

defineEmits<{
  reset: [];
}>();

export type MarkCounterProps = {
  count: number;
  total: number;
  entityType: AttributableEntities;
};

const props = defineProps<MarkCounterProps>();
const progress = computed(() => props.count / props.total);
const { entity } = useAttributableEntityName({ entityType: props.entityType });

const { t } = useI18n();

const showExplainer = ref(false);
</script>

<style scoped>
.q-linear-progress {
  color: var(--bdb-primary-100);
}
</style>
