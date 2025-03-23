<template>
  <div style="min-height: 100svh" class="column items-center justify-center">
    <div class="q-pa-md column items-center">
      <h1 class="q-mb-lg">{{ orgName }}</h1>
      <h2>{{ t('auth.signInTitle') }}</h2>
      <SignInForm />
      <div class="text-h4 text-muted">
        <BaseSpriteIcon name="blossom" size="lg" />
        <span style="margin-left: 8px; vertical-align: middle">
          {{ t('auth.signInFooter') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SignInForm from 'components/Auth/SignInForm.vue';
import { useI18n } from 'src/composables/useI18n';
import BaseSpriteIcon from 'components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
const { t } = useI18n();
const orgName = import.meta.env.VITE_ORG;
</script>
