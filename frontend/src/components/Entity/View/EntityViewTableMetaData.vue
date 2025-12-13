<template>
  <EntityViewTableRow no-hover>
    <div
      class="row justify-between text-muted text-caption"
      :class="{ 'q-pt-xs': !dense }"
    >
      <div class="q-pr-md">
        <q-icon name="tag" class="icon" />{{
          t('entity.commonColumns.id')
        }}
        &nbsp;<strong>{{ id }}</strong>
      </div>
      <div class="row">
        <div>
          <q-icon name="schedule" class="icon" />{{
            t('entity.commonColumns.created')
          }}
          <strong><BaseRelativeTime :timestamp="created" /></strong>
        </div>
        <template v-if="modified && modified !== created">
          &nbsp;
          <div>
            &mdash;&nbsp;{{ t('entity.commonColumns.modified') }}
            <strong><BaseRelativeTime :timestamp="modified" /></strong>
          </div>
        </template>
      </div>
    </div>
  </EntityViewTableRow>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import BaseRelativeTime from 'src/components/Base/BaseRelativeTime.vue';

export interface EntityViewTableMetaDataProps {
  id: number;
  created: string;
  modified?: string;
  dense?: boolean;
}

defineProps<EntityViewTableMetaDataProps>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.icon {
  vertical-align: text-top;
  font-size: 1.2em;
  margin-right: 0.25em;
}
</style>
