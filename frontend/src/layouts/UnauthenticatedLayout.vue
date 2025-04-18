<template>
  <q-layout>
    <q-page-container>
      <div
        style="min-height: 100svh"
        class="column items-center justify-center"
      >
        <BaseSuspense>
          <template #default>
            <router-view />
          </template>
          <template #fallback>
            <div class="fixed-center">
              <BaseSpinner size="xl" />
            </div>
          </template>
        </BaseSuspense>

        <div class="text-h4 text-muted q-mt-xl q-mb-md">
          <BaseSpriteIcon name="blossom" size="lg" />
          <span style="margin-left: 8px; vertical-align: middle">
            {{ t('auth.signInFooter') }}
          </span>
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import BaseSuspense from 'components/Base/BaseSuspense/BaseSuspense.vue';
import BaseSpinner from 'components/Base/BaseSpinner.vue';
import BaseSpriteIcon from 'components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import { useI18n } from 'src/composables/useI18n';

const { t } = useI18n();
</script>
