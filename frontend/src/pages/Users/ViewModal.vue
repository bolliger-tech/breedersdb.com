<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="user" @edit="edit">
    <template #title>
      <BaseSpriteIcon name="user" color="grey-7" size="50px" />
      <div class="q-ma-sm">
        <h2 class="q-ma-none">
          {{ user.email }}
        </h2>
      </div>
    </template>

    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <UserEntityTable :user="user" row-padding-side="16px" />
    </template>

    <template #action-left>
      <UserButtonDelete
        :user-id="user.id"
        @deleted="
          () => router.push({ path: '/more/users', query: route.query })
        "
      />
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import UserButtonDelete from 'src/components/User/UserButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import { computed } from 'vue';
import { userFragment } from 'src/components/User/userFragment';
import UserEntityTable from 'src/components/User/UserEntityTable.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';

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

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const user = computed(() => data.value?.users_by_pk);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/more/users/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
