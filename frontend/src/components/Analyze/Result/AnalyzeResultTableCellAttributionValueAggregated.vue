<template>
  <AnalyzeResultTableCellAttribution v-if="attributions.length > 0" aggregated>
    <template #label>
      {{ label }}
    </template>
    <template #overlay>
      <i18n-t
        keypath="analyze.result.aggTitle"
        tag="h4"
        class="row align-center text-body2 text-weight-bold title"
        scope="global"
      >
        <template #value>
          <AttributionValueChip aggregated dark max-width="80px">{{
            label
          }}</AttributionValueChip
          >&nbsp;
        </template>
        <template #theAggregation>
          {{ aggregationName }}
        </template>
      </i18n-t>
      <AnalyzeResultTableCellAttributionValue
        v-for="attribution of attributions"
        :key="attribution.id"
        :attribution="attribution"
        dark
      />
    </template>
  </AnalyzeResultTableCellAttribution>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { AnalyzeAttributionsViewFields } from './filterToQuery';
import { useI18n } from 'src/composables/useI18n';
import { formatResultColumnValue } from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import AnalyzeResultTableCellAttribution from './AnalyzeResultTableCellAttribution.vue';
import AnalyzeResultTableCellAttributionValue from './AnalyzeResultTableCellAttributionValue.vue';
import { AttributionAggregation } from './attributionAggregationTypes';
import { dataTypeToColumnTypes } from 'src/utils/attributeUtils';
import AttributionValueChip from 'src/components/Attribution/AttributionValueChip.vue';

export interface AnalyzeResultTableCellAttributionValueAggregatedProps {
  attributions: AnalyzeAttributionsViewFields[];
  aggregation: AttributionAggregation;
}

const props =
  defineProps<AnalyzeResultTableCellAttributionValueAggregatedProps>();

const { t } = useI18n();

const label = computed(() => {
  if (!props.attributions.length) {
    return '';
  }

  const type = dataTypeToColumnTypes(props.attributions[0].data_type);

  if (type === ColumnTypes.Photo) {
    // this should never happen
    throw new Error('Photo type not supported for aggregation');
  }

  switch (props.aggregation) {
    case AttributionAggregation.Count:
      return formatResultColumnValue({
        value: props.attributions.length,
        type,
      });
    case AttributionAggregation.Min:
      return formatResultColumnValue({
        value: getMin(props.attributions, type),
        type,
      });
    case AttributionAggregation.Max:
      return formatResultColumnValue({
        value: getMax(props.attributions, type),
        type,
      });
    case AttributionAggregation.Mean:
      return formatResultColumnValue({
        value: getMean(props.attributions, type),
        type:
          type === ColumnTypes.Integer || type === ColumnTypes.Rating
            ? ColumnTypes.Float
            : type,
      });
    case AttributionAggregation.Median:
      return formatResultColumnValue({
        value: getMedian(props.attributions, type),
        type:
          type === ColumnTypes.Integer || type === ColumnTypes.Rating
            ? ColumnTypes.Float
            : type,
      });
    case AttributionAggregation.StdDev:
      if (type === ColumnTypes.Date) {
        const stdDev = getStdDev(props.attributions, type);
        return stdDev === null ? '' : toTimespan(stdDev);
      }
      return formatResultColumnValue({
        value: getStdDev(props.attributions, type),
        type:
          type === ColumnTypes.Integer || type === ColumnTypes.Rating
            ? ColumnTypes.Float
            : type,
      });
    default:
      throw new Error(`Unsupported aggregation: ${props.aggregation}`);
  }
});

function getMin(
  attributions: AnalyzeAttributionsViewFields[],
  type: ColumnTypes,
) {
  const min = Math.min(...getValuesAsNumbers(attributions, type));
  return type === ColumnTypes.Date ? new Date(min) : min;
}

function getMax(
  attributions: AnalyzeAttributionsViewFields[],
  type: ColumnTypes,
) {
  const min = Math.max(...getValuesAsNumbers(attributions, type));
  return type === ColumnTypes.Date ? new Date(min) : min;
}

function getMean(
  attributions: AnalyzeAttributionsViewFields[],
  type: ColumnTypes,
) {
  const values = getValuesAsNumbers(attributions, type);
  if (!values.length) {
    return null;
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return type === ColumnTypes.Date ? new Date(mean) : mean;
}

function getMedian(
  attributions: AnalyzeAttributionsViewFields[],
  type: ColumnTypes,
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

  return type === ColumnTypes.Date ? new Date(median) : median;
}

function getStdDev(
  attributions: AnalyzeAttributionsViewFields[],
  type: ColumnTypes,
) {
  const values = getValuesAsNumbers(attributions, type);
  if (!values.length) {
    return null;
  }
  const mean = getMean(attributions, type) as number;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return type === ColumnTypes.Date
    ? Math.sqrt(variance) / 1000 // seconds
    : Math.sqrt(variance);
}

function getValuesAsNumbers(
  attributions: AnalyzeAttributionsViewFields[],
  type: ColumnTypes,
) {
  if (
    ![
      ColumnTypes.Integer,
      ColumnTypes.Rating,
      ColumnTypes.Float,
      ColumnTypes.Date,
    ].includes(type)
  ) {
    throw new Error(`Aggregation not available for: ${type}`);
  }
  return attributions
    .map((a) => {
      switch (type) {
        case ColumnTypes.Integer:
        case ColumnTypes.Rating:
          return a.integer_value;
        case ColumnTypes.Float:
          return a.float_value;
        case ColumnTypes.Date:
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

const aggregationName = computed(() => {
  return {
    [AttributionAggregation.Count]: t('analyze.result.aggregations.theCount'),
    [AttributionAggregation.Max]: t('analyze.result.aggregations.theMax'),
    [AttributionAggregation.Min]: t('analyze.result.aggregations.theMin'),
    [AttributionAggregation.Mean]: t('analyze.result.aggregations.theMean'),
    [AttributionAggregation.Median]: t('analyze.result.aggregations.theMedian'),
    [AttributionAggregation.StdDev]: t('analyze.result.aggregations.theStdDev'),
  }[props.aggregation];
});
</script>

<style scoped>
.title {
  text-wrap: balance;
  margin: 0 0 0.75em 0;
}
</style>
