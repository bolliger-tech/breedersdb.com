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
        :hide-bottom-space="true"
        :error="
          error &&
          [401, 429].includes(
            error?.graphQLErrors[0]?.extensions.code as number,
          )
        "
        :error-message="formatFromNowErrorMessage(error as CombinedError)"
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
      ![401, 404, 429].includes(
        error?.graphQLErrors[0]?.extensions.code as number,
      )
    "
    class="graphql-error"
    :error="error"
  />
</template>

<script setup lang="ts">
import { CombinedError, useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import { onBeforeUnmount, ref } from 'vue';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import { useRoute, useRouter } from 'vue-router';
import { getUserFromCookie } from 'src/utils/authUtils';
import { useI18n } from 'src/composables/useI18n';
import type { Locale } from 'src/composables/useI18n';
import { useInputBackground } from 'src/composables/useInputBackground';
import { toLocaleRelativeTimeString } from 'src/utils/dateUtils';
import { useInterval } from 'quasar';
const i18n = useI18n({ useScope: 'global' });
const { t, locale } = i18n;
const { inputBgColor } = useInputBackground();
const { registerInterval, removeInterval } = useInterval();

const route = useRoute();
const router = useRouter();

function redirect() {
  const redirect = route.query.redirect as string | undefined;
  router.push({ path: redirect || '/' });
}

if (getUserFromCookie()) {
  redirect();
}

const email = ref('');
const password = ref('');

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
    if (result.data?.SignIn.locale) {
      i18n.setAndPersistLocale(result.data.SignIn.locale as Locale);
    } else {
      console.error('No locale in SignIn response');
    }
    redirect();
  });
}

const now = ref(new Date());

function formatFromNowErrorMessage(error: CombinedError | null): string {
  if (!error) {
    return '';
  }
  now.value = new Date();

  const nextPossibleSignIn =
    typeof error.graphQLErrors[0]?.extensions.nextPossibleSignIn === 'string'
      ? new Date(error.graphQLErrors[0]?.extensions.nextPossibleSignIn)
      : null;

  let nextTry = '';
  if (nextPossibleSignIn) {
    const diffSecs =
      (nextPossibleSignIn.getTime() - now.value.getTime()) / 1000;

    if (diffSecs > 1) {
      nextTry = t('auth.errors.nextTry', {
        fromNow: toLocaleRelativeTimeString(
          nextPossibleSignIn,
          locale.value,
          undefined,
          true,
        ),
      });

      registerInterval(
        () => {
          now.value = new Date();
        },
        diffSecs > 120 ? 30000 : 1000,
      );
    } else {
      removeInterval();
    }
  }

  const code = error.graphQLErrors[0]?.extensions.code as 401 | 429;
  return t(`auth.errors.${code}`, { nextTry });
}

onBeforeUnmount(() => {
  removeInterval();
});
</script>

<style lang="scss" scoped>
.form {
  width: 100%;
  min-width: 200px;
  max-width: 400px;
}
.graphql-error {
  max-width: 100%;
}
</style>
