<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('users.title', 2)"
      :search-placeholder="t('plants.searchPlaceholder')"
      :rows="data?.users || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/users"
      add-entity-path="/users/new"
      :view-entity-path-getter="(id) => `/users/${id}`"
    />
  </PageLayout>
  <router-view name="modal" />
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { UseQueryArgs, useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, provide, watch } from 'vue';
import { useI18n, Locale } from 'src/composables/useI18n';
import { usePagination } from 'src/components/Entity/List/usePagination';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { userFragment } from 'src/components/User/userFragment';
import { userReexecuteQuerySymbol } from './userProvideSymbols';

const { t, d } = useI18n();

const query = graphql(
  `
    query Users(
      $limit: Int!
      $offset: Int!
      $orderBy: [users_order_by!]
      $where: users_bool_exp
    ) {
      users_aggregate {
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

const { queryArg: search } = useQueryArg<string>({
  key: 's',
  defaultValue: '',
  replace: true,
});

const { queryArg: subset } = useQueryArg<'all'>({
  key: 'tab',
  defaultValue: 'all',
  replace: true,
});

const { pagination } = usePagination({
  sortBy: 'id',
  descending: true,
  page: 1,
  rowsPerPage: 100,
  rowsNumber: 0,
});

const orderBy = computed(() => {
  const order = pagination.value.descending ? 'desc' : 'asc';
  const column = pagination.value.sortBy;

  return [{ [column]: order }];
});

const where = computed(() => {
  const where: UseQueryArgs<typeof query>['variables'] = { _and: [] };

  if (search.value) {
    const or: UseQueryArgs<typeof query>['variables'] = { _or: [] };

    if (Number.isInteger(Number(search.value))) {
      or._or.push({
        id: { _eq: Number(search.value) },
      });
    }

    or._or.push({
      email: { _ilike: `%${search.value}%` },
    });

    where._and.push(or);
  }

  return where;
});

const variables = computed(() => ({
  limit: pagination.value.rowsPerPage,
  offset: (pagination.value.page - 1) * pagination.value.rowsPerPage,
  orderBy: orderBy.value,
  where: where.value,
}));

const { data, fetching, error, executeQuery } = await useQuery({
  query,
  variables,
});

provide(userReexecuteQuerySymbol, () =>
  executeQuery({ requestPolicy: 'network-only' }),
);

const usersCount = computed(
  () => data.value?.users_aggregate?.aggregate?.count || 0,
);

type User = ResultOf<typeof query>['users'][0];

const columns = [
  {
    name: 'id',
    label: t('users.fields.id'),
    align: 'left' as const,
    field: 'id',
    sortable: true,
  },
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
    align: 'left' as const,
    field: 'failed_signin_attempts',
    sortable: true,
  },
  {
    name: 'last_signin',
    label: t('users.fields.lastSignin'),
    align: 'left' as const,
    field: (row: User) =>
      row.last_signin ? d(row.last_signin as string, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: User) =>
      row.modified ? d(row.modified as string, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: User) => d(row.created as string, 'ymdHis'),
    sortable: true,
  },
];

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name).slice(0, 6),
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
