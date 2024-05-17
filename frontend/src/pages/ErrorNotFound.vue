<template>
  <div class="text-center q-pa-md flex flex-center">
    <div>
      <BaseSpriteIcon name="tree-stumps" size="50vh" />
      <h1 class="text-h3 q-mt-none q-mb-sm">{{ t('errorNotFound.title') }}</h1>
      <p>{{ t('errorNotFound.message') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import { useI18n } from 'src/composables/useI18n';

const { t } = useI18n();
</script>
