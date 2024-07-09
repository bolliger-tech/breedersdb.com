<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="user"
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
          {{ localizeDate(user.last_signin) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(user.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{ localizeDate(user.modified) }}
        </EntityViewTableRow>
      </EntityViewTable>
    </template>

    <template #action-left>
      <UserButtonDelete
        :user-id="user.id"
        @deleted="() => router.push({ path: '/users', query: route.query })"
      />
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import UserButtonDelete from 'src/components/User/UserButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { userFragment } from 'src/components/User/userFragment';
import { useI18n, Locale } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';

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

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const user = computed(() => data.value?.users_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/users/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
