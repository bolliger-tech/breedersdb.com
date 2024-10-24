<template>
  <q-layout view="lhr Lpr fFf">
    <q-page-container>
      <q-pull-to-refresh @refresh="reloadPage">
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
      </q-pull-to-refresh>
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
      :model-value="true"
      behavior="desktop"
    >
      <MainNav />
    </q-drawer>

    <q-footer v-else>
      <MainNav />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import BaseSuspense from 'components/Base/BaseSuspense/BaseSuspense.vue';
import BaseSpinner from 'components/Base/BaseSpinner.vue';
import MainNav from 'components/Layout/TheNav/TheNav.vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

function reloadPage() {
  window.location.reload();
}
</script>
