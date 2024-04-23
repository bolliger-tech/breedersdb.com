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

    <q-drawer
      v-if="$q.screen.gt.sm"
      side="left"
      persitent
      no-swipe-open
      no-swipe-close
      show-if-above
      :width="100"
      class="bg-primary"
    >
      <MainNav />
    </q-drawer>

    <q-footer v-else>
      <MainNav />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import BaseSuspense from 'components/base/BaseSuspense/BaseSuspense.vue';
import BaseSpinner from 'components/base/BaseSpinner.vue';
import MainNav from 'components/layout/TheNav/TheNav.vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
</script>
