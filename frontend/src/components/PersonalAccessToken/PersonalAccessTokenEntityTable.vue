<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ personalAccessToken.name }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('personalAccessTokens.fields.token')">
      {{
        combineToPersonalAccessToken({
          tokenId: personalAccessToken.id,
          token: '…',
        })
      }}
      <BaseExplainer>
        {{ t('personalAccessTokens.tokenHidden') }}
      </BaseExplainer>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('personalAccessTokens.fields.expires')">
      {{
        personalAccessToken.expires
          ? d(personalAccessToken.expires, 'YmdHis')
          : t('base.timespan.never')
      }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('personalAccessTokens.fields.lastVerify')">
      {{
        personalAccessToken.last_verify
          ? d(personalAccessToken.last_verify, 'YmdHis')
          : t('base.timespan.never')
      }}
    </EntityViewTableRow>
    <EntityViewTableMetaData
      :id="personalAccessToken.id"
      :created="personalAccessToken.created"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PersonalAccessTokenFragment } from './personalAccessTokenFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityViewTableMetaData from 'src/components/Entity/View/EntityViewTableMetaData.vue';
import { combineToPersonalAccessToken } from 'src/utils/personalAccessToken';
import BaseExplainer from 'src/components/Base/BaseExplainer.vue';

export interface PersonalAccessTokenEntityTableProps {
  personalAccessToken: PersonalAccessTokenFragment;
  dense?: boolean | undefined;
}

defineProps<PersonalAccessTokenEntityTableProps>();

const { t, d } = useI18n();
</script>
