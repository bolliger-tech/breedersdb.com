<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PersonalAccessTokenModalEdit
      v-if="userToken"
      :personal-access-token="userToken"
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
import { userTokenFragment } from 'src/components/PersonalAccessToken/userTokenFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyUserToken: PersonalAccessTokenInsertInput = {
  name: '',
  hash: '',
  expires: null,
};

const query = graphql(
  `
    query UserTokens($id: Int!) {
      user_tokens_by_pk(id: $id) {
        ...userTokenFragment
      }
    }
  `,
  [userTokenFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: {
    additionalTypenames: ['user_tokens', 'CreatePersonalAccessTokenOutput'],
  },
  pause: !props.templateId,
});

const userToken = computed(() => {
  if (props.templateId) {
    if (!data.value?.user_tokens_by_pk) {
      return;
    }
    const expires = data.value.user_tokens_by_pk.expires
      ? new Date(data.value.user_tokens_by_pk.expires)
      : null;
    return {
      ...emptyUserToken,
      expires: expires?.toISOString().slice(0, 16) || null,
    };
  } else {
    return emptyUserToken;
  }
});

const { t } = useI18n();
</script>
