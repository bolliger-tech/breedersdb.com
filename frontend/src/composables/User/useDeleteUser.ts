import { getUserFromCookie } from 'src/utils/authUtils';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';

export function useDeleteUser(userId: number) {
  const route = useRoute();
  const router = useRouter();

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
    executeDeleteUser({ id: userId }).then((result) => {
      // TODO discuss
      // in case no user is found, we don't get an error
      // currently the error is not displayed as creating a
      // GraphQL error is cumbersome
      if (!result.data?.delete_users_by_pk) {
        console.error(`Failed to delete user ${userId}`);
      } else {
        if (!result.error) {
          router.push({
            path: '/more/users',
            query: route.query,
          });
        }
      }
    });
  }

  const deleteDisabled = computed(() => {
    // TODO: refactor into useMe
    const me = getUserFromCookie();
    return me?.id === userId;
  });

  return {
    deleteError,
    deleteUser,
    deleteDisabled,
    deleting,
  };
}
