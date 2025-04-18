<template>
  <h2 class="text-center">{{ t('auth.resetPassword.title') }}</h2>
  <ResetPasswordForm />
</template>

<script setup lang="ts">
import ResetPasswordForm from 'components/Auth/ResetPasswordForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRedirectAuthenticatedUsers } from 'src/composables/useRedirectAuthenticatedUsers';

const { t } = useI18n();

await useRedirectAuthenticatedUsers().redirectIfAuthenticated();
</script>
