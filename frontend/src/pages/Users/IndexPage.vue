<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('users.title', 2)"
      :search-placeholder="t('users.searchPlaceholder')"
      :rows="data?.users || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/users"
      add-entity-path="/users/new"
      :view-entity-path-getter="(id) => `/users/${id}`"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n, Locale } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { userFragment } from 'src/components/User/userFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';

const { t } = useI18n();

const query = graphql(
  `
    query Users(
      $limit: Int!
      $offset: Int!
      $orderBy: [users_order_by!]
      $where: users_bool_exp
    ) {
      users_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      users(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
        ...userFragment
      }
    }
  `,
  [userFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'email',
  searchColumns: ['email'],
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['users', 'FullUserOutput'] },
});

const usersCount = computed(
  () => data.value?.users_aggregate?.aggregate?.count || 0,
);

type User = ResultOf<typeof query>['users'][0];

const columns = [
  {
    name: 'email',
    label: t('users.fields.email'),
    align: 'left' as const,
    field: 'email',
    sortable: true,
  },
  {
    name: 'locale',
    label: t('users.fields.locale'),
    align: 'left' as const,
    field: (row: User) => t(`base.locales.${row.locale as Locale}`),
    sortable: true,
  },
  {
    name: 'failed_signin_attempts',
    label: t('users.fields.failedSigninAttempts'),
    align: 'right' as const,
    field: 'failed_signin_attempts',
    sortable: true,
  },
  {
    name: 'last_signin',
    label: t('users.fields.lastSignin'),
    align: 'left' as const,
    field: 'last_signin',
    sortable: true,
    timestamp: true,
  },
  ...useTimestampColumns(),
];

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name).slice(0, 4),
  replace: true,
});

watch(
  error,
  (newValue) => {
    if (newValue) {
      throw newValue;
    }
  },
  { immediate: true },
);

watch(
  usersCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
