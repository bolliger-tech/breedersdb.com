<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PersonalAccessTokenModalEdit
      v-if="personalAccessToken"
      :personal-access-token="personalAccessToken"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { personalAccessTokenFragment } from 'src/components/PersonalAccessToken/personalAccessTokenFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import PersonalAccessTokenModalEdit from 'src/components/PersonalAccessToken/PersonalAccessTokenModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query PersonalAccessToken($id: Int!) {
      user_tokens_by_pk(id: $id) {
        ...personalAccessTokenFragment
      }
    }
  `,
  [personalAccessTokenFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['user_tokens'] },
});
const personalAccessToken = computed(() => data.value?.user_tokens_by_pk);

const { t } = useI18n();
</script>
