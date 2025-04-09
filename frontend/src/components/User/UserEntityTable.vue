<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('users.fields.email')">
      {{ user.email }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('users.fields.locale')">
      {{ t(`base.locales.${user.locale as Locale}`) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('users.fields.failedSigninAttempts')">
      {{ user.failed_signin_attempts }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('users.fields.lastSignin')">
      <template v-if="user.last_signin">{{
        d(user.last_signin, 'YmdHis')
      }}</template>
      <span v-else class="text-body2 text-italic">{{
        t('base.notAvailable')
      }}</span>
    </EntityViewTableRow>
    <EntityViewTableMetaData
      :id="user.id"
      :created="user.created"
      :modified="user.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n, type Locale } from 'src/composables/useI18n';
import { type UserFragment } from './userFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityViewTableMetaData from 'src/components/Entity/View/EntityViewTableMetaData.vue';

export interface UserEntityTableProps {
  user: UserFragment;
  dense?: boolean | undefined;
}

defineProps<UserEntityTableProps>();

const { t, d } = useI18n();
</script>
