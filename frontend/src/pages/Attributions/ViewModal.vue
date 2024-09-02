<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="attribution"
    sprite-icon="star"
    :title="attribution.attribute_name || 'Unknown'"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow
          v-if="attribution.data_type === 'PHOTO' && attribution.text_value"
          :label="t('attributions.columns.value')"
        >
          <EntityViewAttributionImage
            :file-name="attribution.text_value"
            :attribution="attribution"
          />
        </EntityViewTableRow>
        <EntityViewTableRow v-else-if="attribution.data_type === 'TEXT'">
          <strong>{{ t('attributions.columns.value') }}</strong>
          <br />
          <span style="white-space: pre-line">{{ getValue(attribution) }}</span>
        </EntityViewTableRow>
        <EntityViewTableRow v-else :label="t('attributions.columns.value')">
          {{ getValue(attribution) }}
        </EntityViewTableRow>

        <EntityViewTableRow :label="t('attributes.title', 1)">
          <RouterLink
            :to="`/attributes/${attribution.attribute_id}`"
            class="undecorated-link"
          >
            {{ attribution.attribute_name }}
          </RouterLink>
        </EntityViewTableRow>

        <EntityViewTableRow v-if="attribution.text_note">
          <strong>{{ t('entity.commonColumns.note') }}</strong>
          <br />
          <span style="white-space: pre-line">{{ attribution.text_note }}</span>
        </EntityViewTableRow>
        <EntityViewTableRow
          v-if="attribution.photo_note"
          :label="t('attributions.columns.photoNote')"
        >
          <EntityViewAttributionImage
            :file-name="attribution.photo_note"
            :attribution="attribution"
          />
        </EntityViewTableRow>

        <EntityViewTableRow :label="entityName" render-empty>
          <EntityLink :entity="attribution" />
        </EntityViewTableRow>

        <EntityViewTableRow :label="t('attributions.columns.dateAttributed')">
          {{ localizeDate(attribution.date_attributed) }}
        </EntityViewTableRow>

        <EntityViewTableRow :label="t('attributions.columns.author')">
          {{ attribution.author }}
        </EntityViewTableRow>

        <EntityViewTableRow
          :label="t('attributions.columns.exceptionalAttribution')"
        >
          {{ attribution.exceptional_attribution ? '✓' : '' }}
        </EntityViewTableRow>

        <EntityViewTableRow :label="t('attributionForms.title', 1)">
          <RouterLink
            v-if="attribution.attribution_form"
            :to="`/attribution-forms/${attribution.attribution_form.id}`"
            class="undecorated-link"
          >
            {{ attribution.attribution_form.name }}
          </RouterLink>
        </EntityViewTableRow>

        <EntityTableViewTimestampRows
          v-if="attribution.created && attribution.modified"
          :created="attribution.created"
          :modified="attribution.modified"
        />
      </EntityViewTable>
    </template>

    <template #action-left>
      <AttributionButtonDelete
        :attribution-id="attribution.attribution_id"
        :attribution-value-id="attribution.id"
        @deleted="
          () => router.push({ path: '/attributions', query: route.query })
        "
      />
    </template>
  </EntityModalContent>

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import AttributionButtonDelete from 'src/components/Attribution/AttributionButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import {
  AttributionsViewFragment,
  attributionsViewFragment,
} from 'src/components/Attribution/attributionsViewFragment';
import { useRefreshAttributionsViewThenQuery } from 'src/composables/useRefreshAttributionsView';
import {
  AttributionFormFragment,
  attributionFormFragment,
} from 'src/components/AttributionForm/attributionFormFragment';
import { computed } from 'vue';
import {
  formatResultColumnValue,
  dataTypeToColumnTypes,
  getAttributionValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import EntityViewAttributionImage from 'src/components/Entity/View/EntityViewAttributionImage.vue';
import EntityLink from 'src/components/Entity/EntityLink.vue';
import { localizeDate } from 'src/utils/dateUtils';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query AttributionsView(
      $id: Int!
      $AttributionsViewWithEntites: Boolean = true
    ) {
      attributions_view(where: { id: { _eq: $id } }) {
        ...attributionsViewFragment
        attribution_form {
          ...attributionFormFragment
        }
      }
    }
  `,
  [attributionsViewFragment, attributionFormFragment],
);

const { data, error, fetching } = useRefreshAttributionsViewThenQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const attribution = computed(
  () =>
    data.value?.attributions_view[0] as AttributionsViewFragment & {
      attribution_form: AttributionFormFragment;
    },
);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/attributions/${props.entityId}/edit`,
    query: route.query,
  });
}

function getValue(row: NonNullable<typeof attribution.value>) {
  const type = dataTypeToColumnTypes(row.data_type);
  const value = getAttributionValue(row);

  if (type === ColumnTypes.Photo) {
    // photo is handled in the template
    return '';
  }

  return formatResultColumnValue({ value, type });
}

const entityName = computed(() => {
  if (attribution.value?.plant) {
    return t('plants.title', 1);
  } else if (attribution.value?.plant_group) {
    return t('plantGroups.title', 1);
  } else if (attribution.value?.cultivar) {
    return t('cultivars.title', 1);
  } else if (attribution.value?.lot) {
    return t('lots.title', 1);
  }

  throw new Error('Unknown entity type');
});
</script>
