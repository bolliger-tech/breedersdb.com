<template>
  <EntityButtonDelete
    :disabled="disabled"
    :message="t('users.deleteConfirmation')"
    :error="error"
    :fetching="deleting"
    @delete="deleteUser"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { getUserFromCookie } from 'src/utils/authUtils';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';

export interface UserButtonDeleteProps {
  userId: number;
}
const props = defineProps<UserButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

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
    // TODO discuss
    // in case no user is found, we don't get an error
    // currently the error is not displayed as creating a
    // GraphQL error is cumbersome
    if (!result.data?.delete_users_by_pk) {
      console.error(`Failed to delete user ${props.userId}`);
    } else {
      emit('deleted');
    }
  });
}

const disabled = computed(() => {
  // TODO: refactor into useMe
  const me = getUserFromCookie();
  return me?.id === props.userId;
});

const { t } = useI18n();
</script>
