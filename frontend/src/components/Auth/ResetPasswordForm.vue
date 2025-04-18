<template>
  <BaseMessage
    v-if="!token"
    :message="t('auth.resetPassword.missingToken')"
    type="error"
    iconSize="xl"
  />
  <form v-else-if="!data" @submit.prevent="onSubmit">
    <EntityInputPassword
      v-model="password"
      @update:model-value="error = undefined"
      :label="t('auth.resetPassword.newPassword')"
      autocomplete="new-password"
      placeholder="*****"
      required
      hint=""
      :error="!!userError"
      :error-message="userError"
      :rules="[
        (val: string | null | undefined) =>
          (!!val && isValidPassword(val)) ||
          t('users.validation.invalidPassword'),
      ]"
    />
    <div class="q-mt-xl q-mt-sm-lg row items-center justify-between">
      <q-btn
        dense
        flat
        :to="{ path: '/forgot-password' }"
        :label="t('base.back')"
      />
      <q-btn
        :label="t('auth.resetPassword.save')"
        :loading="fetching"
        type="submit"
        color="primary"
        :disable="fetching || !!data"
      />
    </div>
  </form>
  <template v-else>
    <BaseMessage
      class="q-mt-md"
      :message="t('auth.resetPassword.passwordChanged')"
      type="success"
      iconSize="xl"
    />
    <q-btn
      :to="{ path: '/sign-in' }"
      :label="t('auth.signInButton')"
      color="primary"
      class="q-mt-md float-right"
    />
  </template>
  <BaseGraphqlError
    v-if="error && !userError"
    style="max-width: 100%"
    :error="error"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import EntityInputPassword from 'src/components/Entity/Edit/EntityInputPassword.vue';
import { isValidPassword } from 'src/utils/validationUtils';
import { useRoute } from 'vue-router';
import BaseMessage from '../Base/BaseMessage.vue';

const { t } = useI18n();
const route = useRoute();

const token = computed(() => (route.query.token as string) || undefined);
const password = ref('');

const { data, error, fetching, ...urql } = useMutation(
  graphql(`
    mutation ResetPassword($token: String!, $password: String!) {
      ResetPassword(token: $token, newPassword: $password) {
        id
      }
    }
  `),
);

async function onSubmit() {
  await urql.executeMutation({
    token: token.value || '',
    password: password.value,
  });
}

const userError = computed(() => {
  switch (error.value?.graphQLErrors[0]?.extensions.code) {
    case 400:
      return t('auth.errors.invalidPasswordOrToken');
    case 401:
      return t('auth.errors.invalidToken');
    case 403:
      return t('auth.errors.tokenExpired');
    case 404:
      return t('auth.errors.404');
    default:
      return '';
  }
});
</script>
