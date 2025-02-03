<template>
  <EntityModalEdit
    :entity="user"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/users"
    sprite-icon="user"
    :subtitle="t('users.title', 1)"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/users/new/${templateId}`,
          query: $route.query,
        });
      }
    "
  >
    <template #form="{ setFormRef, onChange }">
      <UserEntityForm
        :ref="(el) => setFormRef(el)"
        :user="user"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <UserButtonDelete
        v-if="'id' in user"
        :user-id="user.id"
        @deleted="() => $router.push({ path: '/users', query: $route.query })"
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import {
  UserFragment,
  userFragment,
  userFragmentOnFullUserOutput,
} from 'src/components/User/userFragment';
import { graphql } from 'src/graphql';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';

import UserButtonDelete from 'src/components/User/UserButtonDelete.vue';
import UserEntityForm from 'src/components/User/UserEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';

export type UserEditInput = Omit<
  UserFragment,
  'failed_signin_attempts' | 'last_signin' | 'created' | 'modified'
>;
export type UserInsertInput = Omit<UserEditInput, 'id'> & {
  password: string;
};

export interface UserModalEditProps {
  user: UserEditInput | UserInsertInput;
}

defineProps<UserModalEditProps>();

const insertMutation = graphql(
  `
    mutation InsertUser($entity: UserInsertInput!) {
      InsertUser(object: $entity) {
        ...userFragmentOnFullUserOutput
      }
    }
  `,
  [userFragmentOnFullUserOutput],
);

const editMutation = graphql(
  `
    mutation UpdateUser($id: Int!, $entity: users_set_input!) {
      update_users_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...userFragment
      }
    }
  `,
  [userFragment],
);

const { t } = useI18n();
</script>
