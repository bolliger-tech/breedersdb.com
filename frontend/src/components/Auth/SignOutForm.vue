<template>
  <form @submit.prevent="onSubmit">
    <div class="q-mb-md">
      <q-btn
        type="submit"
        :label="t('auth.signOutButton')"
        :loading="fetching"
        color="primary"
      />
    </div>
  </form>
  <template v-if="error">
    <BaseGraphqlError :error="error" />
  </template>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import BaseGraphqlError from '../Base/BaseGraphqlError.vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'src/composables/useI18n';
const { t } = useI18n();

const router = useRouter();

const { error, fetching, ...urql } = useMutation(
  graphql(`
    mutation SignOut {
      SignOut {
        user_id
      }
    }
  `),
);

async function onSubmit() {
  await urql.executeMutation({}).then(async ({ error }) => {
    if (!error) {
      await router.push({ path: '/' });
    }
  });
}
</script>
