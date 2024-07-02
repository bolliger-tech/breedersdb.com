<template>
  <div>
    <h1>{{ t('auth.signOutTitle') }}</h1>
    <SignOutForm />
  </div>
</template>

<script setup lang="ts">
import SignOutForm from 'components/Auth/SignOutForm.vue';
import { useI18n } from 'src/composables/useI18n';
const { t } = useI18n();
</script>
