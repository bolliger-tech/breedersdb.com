<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PersonalAccessTokenModalEdit
      v-if="personalAccessToken"
      :personal-access-token="personalAccessToken"
      :title="t('base.new')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import PersonalAccessTokenModalEdit, {
  type PersonalAccessTokenInsertInput,
} from 'src/components/PersonalAccessToken/PersonalAccessTokenModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { personalAccessTokenFragment } from 'src/components/PersonalAccessToken/personalAccessTokenFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyPersonalAccessToken: PersonalAccessTokenInsertInput = {
  name: '',
  expires: null,
};

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

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: {
    additionalTypenames: ['user_tokens', 'CreatePersonalAccessTokenOutput'],
  },
  pause: !props.templateId,
});

const personalAccessToken = computed(() => {
  if (props.templateId) {
    if (!data.value?.user_tokens_by_pk) {
      return;
    }
    const expires = data.value.user_tokens_by_pk.expires
      ? new Date(data.value.user_tokens_by_pk.expires)
      : null;
    return {
      ...emptyPersonalAccessToken,
      expires: expires?.toISOString().slice(0, 16) || null,
    };
  } else {
    return emptyPersonalAccessToken;
  }
});

const { t } = useI18n();
</script>
