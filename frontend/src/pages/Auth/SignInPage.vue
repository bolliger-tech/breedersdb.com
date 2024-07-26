<template>
  <div class="q-pa-md column items-center signin-page-content">
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
</template>

<script setup lang="ts">
import SignInForm from 'components/Auth/SignInForm.vue';
import { useI18n } from 'src/composables/useI18n';
import BaseSpriteIcon from 'components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
const { t } = useI18n();
const orgName = import.meta.env.VITE_ORG;
</script>

<style lang="scss" scoped>
.signin-page-content {
  width: 100%;

  // absolute-center only when no graphql-error (set by SignInForm)
  // otherwise the top and bottom escape the viewport on small screens
  &:not(:has(.graphql-error)) {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    position: absolute;
  }
}
</style>
