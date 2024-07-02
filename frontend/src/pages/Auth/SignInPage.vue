<template>
  <div class="q-pa-md absolute-center column signin-page-content">
    <h1 class="q-mb-lg">{{ orgAbbreviation }}</h1>
    <h2>{{ t('auth.signInTitle') }}</h2>
    <SignInForm />
    <h4 class="text-muted">
      <BaseSpriteIcon :name="icon" size="lg" />
      <span style="margin-left: 8px; vertical-align: middle">
        {{ t('auth.signInFooter') }}
      </span>
    </h4>
  </div>
</template>

<script setup lang="ts">
import SignInForm from 'components/Auth/SignInForm.vue';
import { useI18n } from 'src/composables/useI18n';
import BaseSpriteIcon from 'components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import { SpriteIcons } from 'src/components/Base/BaseSpriteIcon/types';
const { t } = useI18n();
const orgAbbreviation = import.meta.env.VITE_ORG_ABBREVIATION;
const icons = [
  'tree',
  'tree-group',
  'cultivar',
  'blossom',
  'lot',
  'orchard',
  'rootstock',
] as SpriteIcons[];
let icon = icons[Math.floor(Math.random() * icons.length)];
</script>

<style lang="scss" scoped>
.signin-page-content {
  width: 100%;
  max-width: 400px;
  padding: 0 16px;

  @media screen and (min-width: 300px) {
    align-items: center;
  }
}
</style>
