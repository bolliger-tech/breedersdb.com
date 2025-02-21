<template>
  <div class="q-pa-md fixed-center column items-center text-center">
    <p>{{ t('auth.signOutMessage') }}</p>
    <SignOutForm />
  </div>
</template>

<script setup lang="ts">
import SignOutForm from 'components/Auth/SignOutForm.vue';
import { useI18n } from 'src/composables/useI18n';
const { t } = useI18n();
</script>
