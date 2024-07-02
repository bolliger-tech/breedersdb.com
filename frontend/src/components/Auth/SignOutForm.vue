<template>
  <form @submit.prevent="onSubmit">
    <button type="submit">Sign Out</button>
  </form>
  <template v-if="error">
    <BaseGraphqlError :error="error" />
  </template>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const { error, executeMutation: signOut } = useMutation(
  graphql(`
    mutation SignOut {
      SignOut {
        user_id
      }
    }
  `),
);

const onSubmit = () => {
  signOut({}).then(() => {
    router.push({ path: '/' });
  });
};
</script>
