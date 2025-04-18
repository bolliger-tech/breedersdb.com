<template>
  <h2 class="text-center">{{ t('auth.signInTitle') }}</h2>
  <SignInForm />
</template>

<script setup lang="ts">
import SignInForm from 'components/Auth/SignInForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRedirectAuthenticatedUsers } from 'src/composables/useRedirectAuthenticatedUsers';

const { t } = useI18n();

await useRedirectAuthenticatedUsers().redirectIfAuthenticated();
</script>
