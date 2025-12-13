<template>
  <EntityModalEdit
    :entity="personalAccessToken"
    :insert-mutation="insertMutation"
    :edit-mutation="editMutation"
    index-path="/personal-access-tokens"
    sprite-icon="key"
    :subtitle="t('personalAccessTokens.title', 1)"
    @new-from-template="
      (templateId) => {
        $router.push({
          path: `/personal-access-tokens/new/${templateId}`,
          query: $route.query,
        });
      }
    "
  >
    <template #form="{ setFormRef, onChange }">
      <PersonalAccessTokenEntityForm
        :ref="(el) => setFormRef(el)"
        :personal-access-token="personalAccessToken"
        @change="onChange"
      />
    </template>

    <template #action-left>
      <PersonalAccessTokenButtonDelete
        v-if="'id' in personalAccessToken"
        :personal-access-token-id="personalAccessToken.id"
        @deleted="
          () =>
            $router.push({
              path: '/personal-access-tokens',
              query: $route.query,
            })
        "
      />
      <div v-else></div>
    </template>
  </EntityModalEdit>
</template>

<script setup lang="ts">
import { graphql } from 'src/graphql';
import EntityModalEdit from 'src/components/Entity/EntityModalEdit.vue';
import { useI18n } from 'src/composables/useI18n';
import {
  type PersonalAccessTokenFragment,
  personalAccessTokenFragment,
  createPersonalAccessTokenFragment,
} from './personalAccessTokenFragment';
import PersonalAccessTokenButtonDelete from './PersonalAccessTokenButtonDelete.vue';
import PersonalAccessTokenEntityForm from './PersonalAccessTokenEntityForm.vue';

export type PersonalAccessTokenEditInput = Omit<
  PersonalAccessTokenFragment,
  'user_id' | 'type' | 'last_verify' | 'created'
>;
export type PersonalAccessTokenInsertInput = Omit<
  PersonalAccessTokenEditInput,
  'id'
>;

export interface PersonalAccessTokenModalEditProps {
  personalAccessToken:
    | PersonalAccessTokenEditInput
    | PersonalAccessTokenInsertInput;
}

defineProps<PersonalAccessTokenModalEditProps>();

const insertMutation = graphql(
  `
    mutation CreatePersonalAccessToken(
      $entity: CreatePersonalAccessTokenInput!
    ) {
      CreatePersonalAccessToken(object: $entity) {
        ...createPersonalAccessTokenFragment
      }
    }
  `,
  [createPersonalAccessTokenFragment],
);

const editMutation = graphql(
  `
    mutation UpdatePersonalAccessToken(
      $id: Int!
      $entity: user_tokens_set_input!
    ) {
      update_user_tokens_by_pk(pk_columns: { id: $id }, _set: $entity) {
        ...personalAccessTokenFragment
      }
    }
  `,
  [personalAccessTokenFragment],
);

const { t } = useI18n();
</script>
