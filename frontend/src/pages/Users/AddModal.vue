<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <UserModalEdit v-if="user" :user="user" :title="t('base.new')" />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import UserModalEdit, {
  UserInsertInput,
} from 'src/components/User/UserModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { userFragment } from 'src/components/User/userFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyUser: UserInsertInput = {
  email: '',
  locale: '',
  password: '',
};

const query = graphql(
  `
    query User($id: Int!) {
      users_by_pk(id: $id) {
        ...userFragment
      }
    }
  `,
  [userFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: { additionalTypenames: ['users'] },
  pause: !props.templateId,
});

const user = computed(() => {
  if (props.templateId) {
    if (!data.value?.users_by_pk) {
      return;
    }
    return {
      ...emptyUser,
      locale: data.value.users_by_pk.locale,
    };
  } else {
    return emptyUser;
  }
});

const { t } = useI18n();
</script>
