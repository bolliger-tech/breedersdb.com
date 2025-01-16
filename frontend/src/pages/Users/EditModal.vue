<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <UserModalEdit v-if="user" :user="user" :title="t('base.edit')" />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { userFragment } from 'src/components/User/userFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import UserModalEdit from 'src/components/User/UserModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

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
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['users'] },
});
const user = computed(() => data.value?.users_by_pk);

const { t } = useI18n();
</script>
