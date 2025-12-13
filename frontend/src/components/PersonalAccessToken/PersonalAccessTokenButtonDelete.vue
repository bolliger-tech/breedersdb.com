<template>
  <EntityButtonDelete
    :message="
      t('base.deleteConfirmation', {
        entity: t('personalAccessTokens.title', 1),
      })
    "
    :error="error"
    :fetching="deleting"
    @delete="deletePersonalAccessToken"
    @reset-errors="resetErrors"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import EntityButtonDelete from 'src/components/Entity/EntityButtonDelete.vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';

export interface PersonalAccessTokenButtonDeleteProps {
  personalAccessTokenId: number;
}
const props = defineProps<PersonalAccessTokenButtonDeleteProps>();

const emit = defineEmits<{
  deleted: [];
}>();

function resetErrors() {
  error.value = undefined;
}

const {
  error,
  fetching: deleting,
  ...urql
} = useMutation(
  graphql(`
    mutation DeleteUserToken($id: Int!) {
      delete_user_tokens_by_pk(id: $id) {
        id
      }
    }
  `),
);

async function deletePersonalAccessToken() {
  await urql
    .executeMutation({ id: props.personalAccessTokenId })
    .then((result) => {
      if (!result.data?.delete_user_tokens_by_pk) {
        console.error(
          `Failed to delete personal access token ${props.personalAccessTokenId}`,
        );
      } else {
        emit('deleted');
      }
    });
}

const { t } = useI18n();
</script>
