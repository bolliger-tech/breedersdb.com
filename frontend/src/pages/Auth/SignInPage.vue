<template>
  <div class="q-px-md absolute-center column items-center signin-page-content">
    <h1 class="q-mb-lg">{{ orgAbbreviation }}</h1>
    <h2>{{ t('auth.signInTitle') }}</h2>
    <SignInForm />
    <div class="text-h4 text-muted">
      <BaseSpriteIcon :name="'blossom'" size="lg" />
      <span style="margin-left: 8px; vertical-align: middle">
        {{ t('auth.signInFooter') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import SignInForm from 'components/Auth/SignInForm.vue';
import { useI18n } from 'src/composables/useI18n';
import BaseSpriteIcon from 'components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
const { t } = useI18n();
const orgAbbreviation = import.meta.env.VITE_ORG;
</script>

<style lang="scss" scoped>
.signin-page-content {
  width: 100%;
  max-width: 400px;
}
</style>
