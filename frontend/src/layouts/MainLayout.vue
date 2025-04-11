<template>
  <q-layout view="lhr Lpr fFf">
    <q-page-container>
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
    </q-page-container>

    <template v-if="!noNav">
      <q-drawer
        v-if="$q.screen.gt.sm"
        side="left"
        persitent
        no-swipe-open
        no-swipe-close
        show-if-above
        :width="100"
        class="bg-primary"
        :model-value="true"
        behavior="desktop"
      >
        <MainNav />
      </q-drawer>

      <q-footer v-else>
        <MainNav />
      </q-footer>
    </template>
  </q-layout>
</template>

<script setup lang="ts">
import BaseSuspense from 'components/Base/BaseSuspense/BaseSuspense.vue';
import BaseSpinner from 'components/Base/BaseSpinner.vue';
import MainNav from 'components/Layout/TheNav/TheNav.vue';

interface MainLayoutProps {
  noNav?: boolean;
}

defineProps<MainLayoutProps>();
</script>
