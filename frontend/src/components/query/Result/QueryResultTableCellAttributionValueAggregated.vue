<template>
  <QueryResultTableCellAttribution
    v-if="attributions.length > 0"
    :color="color"
  >
    <template #label>
      {{ label }}
    </template>
    <template #overlay>
      <i18n-t
        keypath="result.aggTitle"
        tag="h4"
        class="text-body2 text-weight-bold q-ma-none q-mb-sm title"
      >
        <template #value>
          <span class="chip">{{ label }}</span
          >&nbsp;
        </template>
        <template #theAggregation>
          {{ aggregationName }}
        </template>
      </i18n-t>
      <QueryResultTableCellAttributionValue
        v-for="attribution of attributions"
        :key="attribution.id"
        :attribution="attribution"
      />
    </template>
  </QueryResultTableCellAttribution>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { QueryAttributionsViewFields } from './filterToQuery';
import { useI18n } from 'src/composables/useI18n';
import { formatResultColumnValue } from './formatResultColumnValue';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';
import QueryResultTableCellAttribution from './QueryResultTableCellAttribution.vue';
import QueryResultTableCellAttributionValue from './QueryResultTableCellAttributionValue.vue';
import { useQuasar } from 'quasar';
import { AttributionAggregation } from './attributionAggregationTypes';
import { dataTypeToColumnType } from './dataTypeToColumnType';

export interface QueryResultTableCellAttributionProps {
  attributions: QueryAttributionsViewFields[];
  aggregation: AttributionAggregation;
}

const props = defineProps<QueryResultTableCellAttributionProps>();

const { t } = useI18n();

const label = computed(() => {
  if (!props.attributions.length) {
    return '';
  }

  const type = dataTypeToColumnType(props.attributions[0].data_type);

  switch (props.aggregation) {
    case AttributionAggregation.Count:
      return formatResultColumnValue({
        value: props.attributions.length,
        type,
        t,
      });
    case AttributionAggregation.Min:
      return formatResultColumnValue({
        value: getMin(props.attributions, type),
        type,
        t,
      });
    case AttributionAggregation.Max:
      return formatResultColumnValue({
        value: getMax(props.attributions, type),
        type,
        t,
      });
    case AttributionAggregation.Mean:
      return formatResultColumnValue({
        value: getMean(props.attributions, type),
        type: type === ColumnType.Integer ? ColumnType.Float : type,
        t,
      });
    case AttributionAggregation.Median:
      return formatResultColumnValue({
        value: getMedian(props.attributions, type),
        type: type === ColumnType.Integer ? ColumnType.Float : type,
        t,
      });
    case AttributionAggregation.StdDev:
      if (type === ColumnType.Date) {
        const stdDev = getStdDev(props.attributions, type);
        return stdDev === null ? '' : toTimespan(stdDev);
      }
      return formatResultColumnValue({
        value: getStdDev(props.attributions, type),
        type: type === ColumnType.Integer ? ColumnType.Float : type,
        t,
      });
    default:
      throw new Error(`Unsupported aggregation: ${props.aggregation}`);
  }
});

function getMin(attributions: QueryAttributionsViewFields[], type: ColumnType) {
  const min = Math.min(...getValuesAsNumbers(attributions, type));
  return type === ColumnType.Date ? new Date(min) : min;
}

function getMax(attributions: QueryAttributionsViewFields[], type: ColumnType) {
  const min = Math.max(...getValuesAsNumbers(attributions, type));
  return type === ColumnType.Date ? new Date(min) : min;
}

function getMean(
  attributions: QueryAttributionsViewFields[],
  type: ColumnType,
) {
  const values = getValuesAsNumbers(attributions, type);
  if (!values.length) {
    return null;
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return type === ColumnType.Date ? new Date(mean) : mean;
}

function getMedian(
  attributions: QueryAttributionsViewFields[],
  type: ColumnType,
) {
  const sortedValues = getValuesAsNumbers(attributions, type).sort(
    (a, b) => a - b,
  );
  if (!sortedValues.length) {
    return null;
  }
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] +
          sortedValues[sortedValues.length / 2]) /
        2
      : sortedValues[Math.floor(sortedValues.length / 2)];

  return type === ColumnType.Date ? new Date(median) : median;
}

function getStdDev(
  attributions: QueryAttributionsViewFields[],
  type: ColumnType,
) {
  const values = getValuesAsNumbers(attributions, type);
  if (!values.length) {
    return null;
  }
  const mean = getMean(attributions, type) as number;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return type === ColumnType.Date
    ? Math.sqrt(variance) / 1000 // seconds
    : Math.sqrt(variance);
}

function getValuesAsNumbers(
  attributions: QueryAttributionsViewFields[],
  type: ColumnType,
) {
  if (![ColumnType.Integer, ColumnType.Float, ColumnType.Date].includes(type)) {
    throw new Error(`Aggregation not available for: ${type}`);
  }
  return attributions
    .map((a) => {
      switch (type) {
        case ColumnType.Integer:
          return a.integer_value;
        case ColumnType.Float:
          return a.float_value;
        case ColumnType.Date:
          return a.date_value ? new Date(a.date_value).getTime() : null;
        default:
          throw new Error(`Unsupported type: ${type}`);
      }
    })
    .filter(Boolean) as number[];
}

function toTimespan(seconds: number) {
  seconds = round(seconds, 1);
  const minutes = round(seconds / 60, 1);
  const hours = round(minutes / 60, 1);
  const days = round(hours / 24, 1);
  if (seconds < 60)
    return `${seconds} ${t('base.timespan.second', Math.floor(seconds))}`;
  else if (minutes < 60)
    return `${minutes} ${t('base.timespan.minute', Math.floor(minutes))}`;
  else if (hours < 24)
    return `${hours} ${t('base.timespan.hour', Math.floor(hours))}`;
  else return `${days} ${t('base.timespan.day', Math.floor(days))}`;
}

function round(value: number, decimals: number) {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

const $q = useQuasar();
const color = computed(() => {
  const baseColor = '#e1bee7'; // purple-2
  return $q.dark.isActive
    ? `color-mix(in srgb, ${baseColor} 33%, transparent)`
    : baseColor;
});

const aggregationName = computed(() => {
  return {
    [AttributionAggregation.Count]: t('result.aggregations.theCount'),
    [AttributionAggregation.Max]: t('result.aggregations.theMax'),
    [AttributionAggregation.Min]: t('result.aggregations.theMin'),
    [AttributionAggregation.Mean]: t('result.aggregations.theMean'),
    [AttributionAggregation.Median]: t('result.aggregations.theMedian'),
    [AttributionAggregation.StdDev]: t('result.aggregations.theStdDev'),
  }[props.aggregation];
});
</script>

<style scoped lang="scss">
.chip {
  max-width: 80px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 0.625rem;
  padding: 0.5em 0.9em;
  border-radius: 2em;
  line-height: 1;
  display: inline-block;
  background-color: $purple-2;
  transform: translateY(0.5em);
}
.body--dark {
  .chip {
    background-color: color-mix(in srgb, $purple-2 33%, transparent);
  }
}

.title {
  text-wrap: balance;
}
</style>
