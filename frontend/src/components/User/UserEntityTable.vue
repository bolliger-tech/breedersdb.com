<template>
  <table
    class="user-entity-table"
    :class="{
      'user-entity-table--dark': dark,
      'user-entity-table--no-border': noBorder,
    }"
  >
    <tr>
      <th>{{ t('users.fields.email') }}</th>
      <td>{{ user.email }}</td>
    </tr>
    <tr>
      <th>{{ t('users.fields.locale') }}</th>
      <td>{{ user.locale }}</td>
    </tr>
    <tr>
      <th>{{ t('users.fields.failedSigninAttempts') }}</th>
      <td>{{ user.failed_signin_attempts }}</td>
    </tr>
    <tr>
      <th>{{ t('users.fields.lastSignin') }}</th>
      <td>{{ localizeDate(user.last_signin) }}</td>
    </tr>
    <tr>
      <th>{{ t('entity.commonColumns.created') }}</th>
      <td>{{ localizeDate(user.created) }}</td>
    </tr>
    <tr>
      <th>{{ t('entity.commonColumns.modified') }}</th>
      <td>{{ localizeDate(user.modified) }}</td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { localizeDate } from 'src/utils/dateUtils';
import { type UserFragment } from './userFragment';

export interface UserEntityTableProps {
  user: UserFragment;
  dark?: boolean;
  rowPaddingSide: string;
  noBorder?: boolean;
}

defineProps<UserEntityTableProps>();

const { t } = useI18n();
</script>

<!-- TODO: don't repeat CSS in PlantEntityTable -->
<style lang="scss" scoped>
$border: 1px solid $grey-4;

tr {
  white-space: nowrap;
  border-bottom: $border;
}
tr:hover {
  background: rgba(0, 0, 0, 0.03);
}
.body--dark tr,
.user-entity-table--dark tr {
  border-color: $grey-8;
}
.body--dark tr:hover {
  background: rgba(255, 255, 255, 0.07);
}
tr:first-child {
  border-top: $border;
}

.user-entity-table--no-border tr {
  border-bottom: none;
  border-top: none;
}

th {
  text-align: left;
  padding: 4px 8px;
  font-weight: bold;
}

td {
  text-align: right;
  padding: 4px 8px;
}
th:first-child {
  padding-left: v-bind(rowPaddingSide);
}
td:last-child {
  padding-right: v-bind(rowPaddingSide);
}

.user-entity-table__note {
  text-align: left;
  padding-left: v-bind(rowPaddingSide);
  padding-right: v-bind(rowPaddingSide);
}

.user-entity-table--no-border :is(td, th) {
  padding-top: 0;
  padding-bottom: 0;
}

.user-entity-table--no-border tr:hover {
  background: none;
}

.user-entity-table {
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
}
</style>
