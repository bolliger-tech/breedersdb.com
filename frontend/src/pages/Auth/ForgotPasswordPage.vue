<template>
  <h1 class="q-mb-md">{{ orgName }}</h1>
  <div style="width: clamp(200px, calc(100svw - 32px), 400px)">
    <p>
      {{ t('auth.forgotPassword.description') }}
    </p>
    <ForgotPasswordForm />
  </div>
</template>

<script setup lang="ts">
import ForgotPasswordForm from 'components/Auth/ForgotPasswordForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRedirectAuthenticatedUsers } from 'src/composables/useRedirectAuthenticatedUsers';

const { t } = useI18n();
const orgName = import.meta.env.VITE_ORG;

await useRedirectAuthenticatedUsers().redirectIfAuthenticated();
</script>
