<template>
  <div>
    <div class="row q-mb-sm">
      <h4 class="q-ma-none">
        {{ t('attribute.counter.title') }}
      </h4>
      <BaseExplainer class="q-ml-xs">
        <i18n-t :keypath="`attribute.counter.description`">
          <template #count
            ><strong>{{ count }}</strong></template
          >
          <template #entity>{{ entity }}</template>
          <template #total>{{ total }}</template>
        </i18n-t>
      </BaseExplainer>
    </div>
    <div class="row no-wrap">
      <q-linear-progress size="1.5em" :value="progress" color="grey-7" rounded>
        <div class="absolute-full flex flex-center">
          <q-badge
            color="white"
            text-color="black"
            :label="count"
            class="text-weight-bold"
          />
        </div>
      </q-linear-progress>
      <q-btn
        v-if="count >= total"
        flat
        color="primary"
        size="sm"
        dense
        class="q-px-sm"
        style="white-space: nowrap"
        @click="$emit('reset')"
        >{{ t('attribute.counter.reset') }}</q-btn
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';
import { AttributableEntities } from './attributableEntities';
import BaseExplainer from 'src/components/Base/BaseExplainer.vue';
import { useAttributableEntityName } from 'src/components/Attribute/useAttributableEntityName';

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
</script>
