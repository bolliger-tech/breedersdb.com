<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="user"
      sprite-icon="user"
      :title="user.email"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <UserEntityTable :user="user" />

        <h3 class="q-my-md">{{ t('personalAccessTokens.title', 2) }}</h3>
        <EntityRelatedTable
          v-if="isMe"
          entity-key="user_tokens"
          :rows="user.user_tokens || []"
          row-key="id"
          :columns="personalAccessTokensColumns"
          default-sort-by="name"
          @row-click="
            (_, row) => $router.push(`/personal-access-tokens/${row.id}`)
          "
        >
          <template #body-cell-name="cellProps">
            <q-td key="name" :props="cellProps">
              <RouterLink
                :to="`/personal-access-tokens/${cellProps.row.id}`"
                class="undecorated-link"
              >
                {{ cellProps.row.name }}
              </RouterLink>
            </q-td>
          </template>
        </EntityRelatedTable>
        <div v-if="isMe" class="text-caption q-my-sm">
          {{ t('personalAccessTokens.visibility.own') }}
        </div>
        <div v-else class="text-caption q-mx-md">
          {{ t('personalAccessTokens.visibility.others') }}
        </div>
      </template>

      <template #action-left>
        <UserButtonDelete
          :user-id="user.id"
          @deleted="() => $router.push({ path: '/users', query: route.query })"
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import UserButtonDelete from 'src/components/User/UserButtonDelete.vue';
import { graphql, type ResultOf } from 'src/graphql';
import { computed } from 'vue';
import { userFragment } from 'src/components/User/userFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import UserEntityTable from 'src/components/User/UserEntityTable.vue';
import { personalAccessTokenFragment } from 'src/components/PersonalAccessToken/personalAccessTokenFragment';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import { useMe } from 'src/composables/useMe';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query User($id: Int!) {
      users_by_pk(id: $id) {
        ...userFragment
        user_tokens {
          ...personalAccessTokenFragment
        }
      }
    }
  `,
  [userFragment, personalAccessTokenFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['users'] },
});

const user = computed(() => data.value?.users_by_pk);

const me = useMe();
const isMe = computed(() => {
  return me.value?.id === user.value?.id;
});

const { t, d } = useI18n();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/users/${props.entityId}/edit`,
    query: route.query,
  });
}

const { localizedSortPredicate } = useLocalizedSort();

type PersonalAccessToken = NonNullable<
  NonNullable<ResultOf<typeof query>['users_by_pk']>['user_tokens']
>[0];

const personalAccessTokensColumns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
    sort: (a: PersonalAccessToken['name'], b: PersonalAccessToken['name']) =>
      localizedSortPredicate(a ?? '', b ?? ''),
  },
  {
    name: 'expires',
    label: t('personalAccessTokens.fields.expires'),
    field: (row: PersonalAccessToken) => row.expires,
    align: 'left' as const,
    sortable: true,
    format: (v: PersonalAccessToken['expires']) => (v ? d(v, 'YmdHis') : ''),
  },
  {
    name: 'last_verify',
    label: t('personalAccessTokens.fields.lastVerify'),
    field: (row: PersonalAccessToken) => row.last_verify,
    align: 'left' as const,
    sortable: true,
    format: (v: PersonalAccessToken['last_verify']) =>
      v ? d(v, 'YmdHis') : '',
  },
];
</script>
