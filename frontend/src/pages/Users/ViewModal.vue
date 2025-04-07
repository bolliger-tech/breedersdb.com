<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="user"
      sprite-icon="user"
      :title="user.email"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <UserEntityTable :user="user" />
      </template>

      <template #action-left>
        <UserButtonDelete
          :user-id="user.id"
          @deleted="() => $router.push({ path: '/users', query: route.query })"
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import UserButtonDelete from 'src/components/User/UserButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { userFragment } from 'src/components/User/userFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import UserEntityTable from 'src/components/User/UserEntityTable.vue';

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

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['users'] },
});

const user = computed(() => data.value?.users_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/users/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
