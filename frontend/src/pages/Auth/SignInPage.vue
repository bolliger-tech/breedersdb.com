<template>
  <div>
    <h1>{{ t('auth.signInTitle') }}</h1>
    <SignInForm />
  </div>
</template>
<script setup lang="ts">
import SignInForm from 'components/Auth/SignInForm.vue';
import { useI18n } from 'src/composables/useI18n';
const { t } = useI18n();
</script>
