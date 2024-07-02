<template>
  <form @submit.prevent="onSubmit">
    <div>
      <label for="email">Email</label>
      <input id="email" v-model="email" type="email" required />
    </div>
    <div>
      <label for="password">Password</label>
      <input id="password" v-model="password" type="password" required />
    </div>
    <button type="submit">Sign In</button>
  </form>
  <div v-if="errorMessage" class="q-my-md text-negative">
    {{ errorMessage }}
  </div>
  <template v-else-if="error">
    <BaseGraphqlError :error="error" />
  </template>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import { ref, watch } from 'vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import { useRoute, useRouter } from 'vue-router';
import { getUserFromCookie } from 'src/utils/authUtils';

const route = useRoute();
const router = useRouter();

function redirect() {
  const redirect = route.query.redirect as string | undefined;
  router.push({ path: redirect || '/' });
}

if (getUserFromCookie()) {
  redirect();
}

// TODO: remove tester
const email = ref('tester1@breedersdb.com');
const password = ref('Asdfasdf1!');
const errorMessage = ref('');

const { error, executeMutation: signIn } = useMutation(
  graphql(`
    mutation SignIn($email: citext!, $password: String!) {
      SignIn(email: $email, password: $password) {
        user_id
      }
    }
  `),
);

const onSubmit = () => {
  signIn({ email: email.value, password: password.value }).then((result) => {
    if (result.data?.SignIn?.user_id) {
      redirect();
    }
  });
};

watch(error, () => {
  if (error.value?.graphQLErrors.length === 1) {
    const firstError = error.value?.graphQLErrors[0];
    const code =
      typeof firstError?.extensions.code === 'number'
        ? firstError?.extensions.code
        : 0;
    if ([404, 401].includes(code)) {
      errorMessage.value = firstError.message;
    }
  }
});
</script>
