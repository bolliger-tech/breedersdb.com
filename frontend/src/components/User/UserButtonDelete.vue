<template>
  <EntityButtonDelete
    :disabled="me?.id === props.userId"
    :message="t('users.deleteConfirmation')"
    :error="error"
    :fetching="deleting"
    @delete="deleteUser"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { useMe } from 'src/composables/useMe';

export interface UserButtonDeleteProps {
  userId: number;
}
const props = defineProps<UserButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  error.value = undefined;
}

const {
  error,
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
  executeDeleteUser({ id: props.userId }).then((result) => {
    // in case no user is found (which shouldn't happen) we don't get an error
    // currently the error is not displayed as creating a
    // GraphQL error is cumbersome
    if (!result.data?.delete_users_by_pk) {
      console.error(`Failed to delete user ${props.userId}`);
    }
    emit('deleted');
  });
}

const me = useMe();

const { t } = useI18n();
</script>
