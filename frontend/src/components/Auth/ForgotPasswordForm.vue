<template>
  <form v-if="!data" @submit.prevent="onSubmit">
    <EntityInput
      v-model="email"
      :label="t('auth.email')"
      type="email"
      autocomplete="username"
      placeholder="mail@example.com"
      required
      hint=""
      :error="!!userError"
      :error-message="userError"
    />
    <div class="q-mt-md row items-center justify-between">
      <q-btn
        dense
        flat
        :to="{ path: '/sign-in', state: { email } }"
        :label="t('base.back')"
      />
      <q-btn
        :label="t('auth.forgotPassword.sendEmail')"
        :loading="fetching"
        type="submit"
        color="primary"
        :disable="fetching || !!data"
      />
    </div>
  </form>
  <BaseMessage
    v-else
    class="q-mt-md"
    :message="t('auth.forgotPassword.emailSent')"
    type="success"
    icon="mail"
    iconSize="xl"
  />
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
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import BaseMessage from '../Base/BaseMessage.vue';

const { t } = useI18n();

const email = ref(history.state.email || '');

const { data, error, fetching, ...urql } = useMutation(
  graphql(`
    mutation SendPasswordResetMail($email: citext!) {
      SendPasswordResetMail(email: $email) {
        id
      }
    }
  `),
);

async function onSubmit() {
  await urql.executeMutation({ email: email.value });
}

const userError = computed(() => {
  switch (error.value?.graphQLErrors[0]?.extensions.code) {
    case 400:
      return t('auth.errors.invalidEmail');
    case 404:
      return t('auth.errors.404');
    case 429:
      return t('auth.errors.429');
    default:
      return '';
  }
});
</script>
