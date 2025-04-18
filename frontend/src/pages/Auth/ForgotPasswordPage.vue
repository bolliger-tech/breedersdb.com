<template>
  <p>
    {{ t('auth.forgotPassword.description') }}
  </p>
  <ForgotPasswordForm />
</template>

<script setup lang="ts">
import ForgotPasswordForm from 'components/Auth/ForgotPasswordForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRedirectAuthenticatedUsers } from 'src/composables/useRedirectAuthenticatedUsers';

const { t } = useI18n();

await useRedirectAuthenticatedUsers().redirectIfAuthenticated();
</script>
