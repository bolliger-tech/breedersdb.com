<template>
  <form class="form" @submit.prevent="onSubmit">
    <div class="q-mb-md">
      <q-input
        v-model="email"
        :label="t('auth.email')"
        :bg-color="inputBgColor"
        type="email"
        autocomplete="username"
        required
        dense
        outlined
        :error="error?.graphQLErrors[0]?.extensions.code === 404"
        :error-message="t('auth.errors.404')"
      />
    </div>
    <div class="q-mb-md">
      <q-input
        v-model="password"
        :label="t('auth.password')"
        :bg-color="inputBgColor"
        type="password"
        autocomplete="current-password"
        required
        dense
        outlined
        :error="error?.graphQLErrors[0]?.extensions.code === 401"
        :error-message="t('auth.errors.401')"
      />
    </div>
    <div class="q-mb-md text-right">
      <q-btn
        :label="t('auth.signInButton')"
        :loading="fetching"
        type="submit"
        color="primary"
      />
    </div>
  </form>
  <BaseGraphqlError
    v-if="
      error &&
      ![401, 404].includes(error?.graphQLErrors[0]?.extensions.code as number)
    "
    :error="error"
  />
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import { ref } from 'vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import { useRoute, useRouter } from 'vue-router';
import { getUserFromCookie } from 'src/utils/authUtils';
import { useI18n } from 'src/composables/useI18n';
import { useInputBackground } from 'src/composables/useInputBackground';
const i18n = useI18n({ useScope: 'global' });
const { t } = i18n;
const { inputBgColor } = useInputBackground();

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

const {
  error,
  fetching,
  executeMutation: signIn,
} = useMutation(
  graphql(`
    mutation SignIn($email: citext!, $password: String!) {
      SignIn(email: $email, password: $password) {
        id
        locale
      }
    }
  `),
);

function onSubmit() {
  signIn({ email: email.value, password: password.value }).then((result) => {
    if (result.error) {
      return;
    }
    // @ts-expect-error locale is not typed in db
    i18n.locale.value = result.data.SignIn.locale;
    redirect();
  });
}
</script>

<style lang="scss" scoped>
.form {
  width: 100%;
  min-width: 200px;
}
</style>
