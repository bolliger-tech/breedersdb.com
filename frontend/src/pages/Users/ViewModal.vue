<!-- TODO: discuss: shouldn't this file be named UserViewModal? -->
<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="user" @edit="edit">
    <template #title>
      <BaseSpriteIcon name="user" color="grey-7" size="50px" />
      <div class="q-ma-sm">
        <h2 class="q-ma-none">
          {{ user.email }}
        </h2>
      </div>
    </template>

    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <UserEntityTable :user="user" row-padding-side="16px" />
    </template>

    <template #action-left>
      <EntityButtonDelete
        :disabled="deleteDisabled"
        :message="t('users.deleteConfirmation')"
        :error="deleteError"
        :fetching="deleting"
        @delete="deleteUser"
      />
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import { computed } from 'vue';
import { userFragment } from 'src/components/User/userFragment';
import UserEntityTable from 'src/components/User/UserEntityTable.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import { getUserFromCookie } from 'src/utils/authUtils';

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

const {
  error: deleteError,
  executeMutation: executeDeleteUser,
  fetching: deleting,
} = useMutation(
  graphql(`
    mutation DeleteUser($id: Int!) {
      delete_users_by_pk(id: $id) {
        id
      }
    }
  `),
);

function deleteUser() {
  executeDeleteUser({ id: parseInt(props.entityId.toString()) }).then(
    (result) => {
      // TODO discuss
      // in case no user is found, we don't get an error
      // currently the error is not displayed as creating a
      // GraphQL error is cumbersome
      if (!result.data?.delete_users_by_pk) {
        console.error(`Failed to delete user ${props.entityId}`);
      } else {
        if (!result.error) {
          router.push({
            path: '/more/users',
            query: route.query,
          });
        }
      }
    },
  );
}

const deleteDisabled = computed(() => {
  // TODO: refactor into useMe
  const me = getUserFromCookie();
  return me?.id === parseInt(props.entityId.toString());
});

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/more/users/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
