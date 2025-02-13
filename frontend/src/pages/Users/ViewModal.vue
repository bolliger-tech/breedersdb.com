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
        <EntityViewTable>
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
          <EntityTableViewTimestampRows
            :created="user.created"
            :modified="user.modified"
          />
        </EntityViewTable>
      </template>

      <template #action-left>
        <UserButtonDelete
          :user-id="user.id"
          @deleted="() => router.push({ path: '/users', query: route.query })"
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import UserButtonDelete from 'src/components/User/UserButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { userFragment } from 'src/components/User/userFragment';
import { useI18n, Locale } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query User($id: Int!) {
      users_by_pk(id: $id) {
        ...userFragment
      }
    }
  `,
  [userFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['users'] },
});

const user = computed(() => data.value?.users_by_pk);

const { t, d } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/users/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
