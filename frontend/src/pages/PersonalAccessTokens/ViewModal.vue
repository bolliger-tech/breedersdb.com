<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="personalAccessToken"
      sprite-icon="key"
      :title="personalAccessToken.name ?? ''"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <PersonalAccessTokenEntityTable
          :personal-access-token="personalAccessToken"
        />
      </template>

      <template #action-left>
        <PersonalAccessTokenButtonDelete
          :personal-access-token-id="personalAccessToken.id"
          @deleted="
            () =>
              $router.push({
                path: '/personal-access-tokens',
                query: route.query,
              })
          "
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import PersonalAccessTokenButtonDelete from 'src/components/PersonalAccessToken/PersonalAccessTokenButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { personalAccessTokenFragment } from 'src/components/PersonalAccessToken/personalAccessTokenFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import PersonalAccessTokenEntityTable from 'src/components/PersonalAccessToken/PersonalAccessTokenEntityTable.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query UserTokens($id: Int!) {
      user_tokens_by_pk(id: $id) {
        ...personalAccessTokenFragment
      }
    }
  `,
  [personalAccessTokenFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['user_tokens'] },
});

const personalAccessToken = computed(() => data.value?.user_tokens_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/personal-access-tokens/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
