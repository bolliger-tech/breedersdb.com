<template>
  <form class="form" @submit.prevent="onSubmit">
    <EntityInput
      v-model="email"
      :label="t('auth.email')"
      type="email"
      autocomplete="username"
      placeholder="mail@example.com"
      required
      hint=""
      :error="error?.graphQLErrors[0]?.extensions.code === 404"
      :error-message="t('auth.errors.404')"
    />
    <EntityInputPassword
      v-model="password"
      :label="t('auth.password')"
      autocomplete="current-password"
      placeholder="*****"
      required
      hint=""
      bottom-slots
      :error="
        error &&
        [401, 429].includes(error.graphQLErrors[0]?.extensions.code as number)
      "
    >
      <template #error>
        {{ error && formatFromNowErrorMessage(error) }}
      </template>
    </EntityInputPassword>
    <div class="q-mt-md row items-center justify-between">
      <q-btn
        dense
        no-caps
        flat
        :to="{ path: '/forgot-password', state: { email } }"
        :label="t('auth.forgotPassword.link')"
      />
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
import type { CombinedError } from '@urql/vue';
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import { onBeforeUnmount, ref } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { useI18n } from 'src/composables/useI18n';
import type { Locale } from 'src/composables/useI18n';
import { toLocaleRelativeTimeString } from 'src/utils/dateUtils';
import { useInterval } from 'quasar';
import EntityInputPassword from 'src/components/Entity/Edit/EntityInputPassword.vue';
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import { useRedirectAuthenticatedUsers } from 'src/composables/useRedirectAuthenticatedUsers';

const i18n = useI18n({ useScope: 'global' });
const { t, locale } = i18n;
const { registerInterval, removeInterval } = useInterval();
const { redirect } = useRedirectAuthenticatedUsers();

const email = ref(history.state.email || '');
const password = ref('');

const { error, fetching, ...urql } = useMutation(
  graphql(`
    mutation SignIn($email: citext!, $password: String!) {
      SignIn(email: $email, password: $password) {
        id
        locale
      }
    }
  `),
);

async function onSubmit() {
  await urql
    .executeMutation({ email: email.value, password: password.value })
    .then(async (result) => {
      if (result.error) {
        return;
      }
      if (result.data?.SignIn.locale) {
        i18n.setAndPersistLocale(result.data.SignIn.locale as Locale);
      } else {
        console.error('No locale in SignIn response');
      }
      await redirect();
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
  width: clamp(200px, calc(100svw - 32px), 400px);
}
.graphql-error {
  max-width: 100%;
}
</style>
