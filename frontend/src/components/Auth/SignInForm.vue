<template>
  <form class="form" @submit.prevent="onSubmit">
    <div class="q-mb-md">
      <q-input
        v-bind="$props"
        id="email"
        ref="emailRef"
        v-model="email"
        :label="t('auth.email')"
        :bg-color="inputBgColor"
        dense
        outlined
        :clearable="false"
        :dark="$q.dark.isActive"
        type="email"
        required
      />
    </div>
    <div class="q-mb-md">
      <q-input
        v-bind="$props"
        id="password"
        ref="passwordRef"
        v-model="password"
        :label="t('auth.password')"
        :bg-color="inputBgColor"
        dense
        outlined
        :clearable="false"
        :dark="$q.dark.isActive"
        type="password"
        required
      />
    </div>
    <div class="q-mb-md text-right">
      <q-btn :label="t('auth.signInButton')" type="submit" color="primary" />
    </div>
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
import { useI18n } from 'src/composables/useI18n';
import { useInputBackground } from 'src/composables/useInputBackground';
const { t } = useI18n();
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

function onSubmit() {
  signIn({ email: email.value, password: password.value }).then((result) => {
    if (result.data?.SignIn?.user_id) {
      redirect();
    }
  });
}

watch(error, () => {
  if (error.value?.graphQLErrors.length === 1) {
    const firstError = error.value?.graphQLErrors[0];
    const code =
      typeof firstError?.extensions.code === 'number'
        ? firstError?.extensions.code
        : 0;
    if (code === 401 || code === 404) {
      errorMessage.value = t(`auth.errors.${code}`);
    }
  }
});
</script>

<style lang="scss" scoped>
.form {
  width: 100%;
  min-width: 200px;
}
</style>
