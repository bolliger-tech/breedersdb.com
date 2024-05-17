<template>
  <h1>Page to test out unit testing features</h1>
  <p data-test="query-resp">{{ data }}</p>
  <p data-test="state">{{ state.baseTable }}</p>
  <p data-test="i18n">{{ t('nav.crossings.main') }}</p>
  <button data-test="change-message" @click="fireADifferentQuery">
    Change message
  </button>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { BaseTable } from 'src/components/Query/Filter/query';
import { useQueryStore } from 'src/components/Query/Filter/queryStore';
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';

const initialQuery = await useQuery({
  query: `query WillBeMocked {
    testEntity {
      data
    }
  }`,
});

const data = ref(initialQuery.data);
const differentQuery = useQuery({
  query: `query WillBeMockedAgain {
      differentEntity {
        data
      }
    }`,
  pause: true,
});

async function fireADifferentQuery() {
  await differentQuery.executeQuery();
  data.value = differentQuery.data.value;
}

const state = useQueryStore();
state.baseTable = BaseTable.Crossings;

const { t } = useI18n();
</script>
