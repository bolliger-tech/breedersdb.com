<template>
  <h1 class="q-mb-md">{{ orgName }}</h1>
  <div style="width: clamp(200px, calc(100svw - 32px), 400px)">
    <h2 class="text-center">{{ t('auth.resetPassword.title') }}</h2>
    <ResetPasswordForm />
  </div>
</template>

<script setup lang="ts">
import ResetPasswordForm from 'components/Auth/ResetPasswordForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRedirectAuthenticatedUsers } from 'src/composables/useRedirectAuthenticatedUsers';

const { t } = useI18n();
const orgName = import.meta.env.VITE_ORG;

await useRedirectAuthenticatedUsers().redirectIfAuthenticated();
</script>
