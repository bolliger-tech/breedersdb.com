<template>
  <EntityModalContent>
    <template #title>
      <BaseSpriteIcon name="user" color="grey-7" size="50px" />
      <div class="q-ma-sm">
        <h2 class="q-ma-none">
          {{ user.email }}
        </h2>
      </div>
    </template>

    <template #default>
      <UserEntityForm ref="formRef" :user="user" @change="onFormChange" />
    </template>

    <template #action-left>
      <UserButtonDelete
        v-if="'id' in user"
        :user-id="user.id"
        @deleted="
          () => router.push({ path: '/more/users', query: route.query })
        "
      />
      <div v-else></div>
    </template>

    <template #action-right>
      <q-btn flat :label="t('base.cancel')" color="primary" @click="cancel" />
      <q-btn
        flat
        :label="t('base.save')"
        color="primary"
        :loading="savingEdit || savingInsert"
        @click="save"
      />
      <q-tooltip
        :model-value="!!saveError || !!validationError"
        max-width="250px"
        anchor="top middle"
        self="bottom middle"
        class="bg-dark shadow-3 entity-modal-content__error-tooltip"
        @update:model-value="
          saveInsertError = undefined;
          saveEditError = undefined;
          validationError = null;
        "
      >
        <BaseGraphqlError v-if="saveError" :error="saveError" />
        <p v-else-if="validationError">
          <q-icon
            name="warning"
            size="2em"
            class="text-negative"
          />&nbsp;&nbsp;{{ validationError }}
        </p>
      </q-tooltip>
    </template>
  </EntityModalContent>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import {
  UserFragment,
  userFragment,
  userFragmentOnFullUserOutput,
} from 'src/components/User/userFragment';
import { VariablesOf, graphql } from 'src/graphql';
import { computed, ref, nextTick } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import UserButtonDelete from 'src/components/User/UserButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import UserEntityForm from 'src/components/User/UserEntityForm.vue';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';

export type UserEditInput = Omit<
  UserFragment,
  'failed_signin_attempts' | 'last_signin' | 'created' | 'modified'
>;
export type UserInsertInput = Omit<UserEditInput, 'id'> & {
  password: string;
};

export interface UserModalEditProps {
  user: UserEditInput | UserInsertInput;
}

const props = defineProps<UserModalEditProps>();

const router = useRouter();
const route = useRoute();
function cancel() {
  const canGoBack = !!router.options.history.state.back;
  if (canGoBack) {
    router.back();
  } else {
    router.push({ path: '/users', query: route.query });
  }
}

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const formRef = ref<InstanceType<typeof UserEntityForm> | null>(null);

const insertMutation = graphql(
  `
    mutation InsertUser($email: citext!, $locale: String, $password: String!) {
      InsertUser(email: $email, locale: $locale, password: $password) {
        ...userFragmentOnFullUserOutput
      }
    }
  `,
  [userFragmentOnFullUserOutput],
);
const insertData = ref<VariablesOf<typeof insertMutation>>();
const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(insertMutation);

const editMutation = graphql(
  `
    mutation UpdateUser($id: Int!, $user: users_set_input!) {
      update_users_by_pk(pk_columns: { id: $id }, _set: $user) {
        ...userFragment
      }
    }
  `,
  [userFragment],
);
const editedData = ref<VariablesOf<typeof editMutation>['user']>();
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(editMutation);

function onFormChange(data: typeof editedData.value | typeof insertData.value) {
  if (!data) {
    return;
  } else if ('id' in props.user) {
    // omit password
    editedData.value = {
      email: data.email,
      locale: data.locale,
    };
  } else {
    if (!('password' in data)) {
      // this should never happen
      throw new Error('Password is missing');
    }
    insertData.value = data;
  }
}

async function save() {
  const isValid = await formRef.value?.validate();
  validationError.value = isValid ? null : t('base.validation.invalidFields');
  if (!isValid) {
    return;
  }

  if ('id' in props.user) {
    await saveEdit();
  } else {
    await saveInsert();
  }

  await nextTick();

  if (!saveError.value) {
    makeModalPersistent(false);
    closeModal();
  }
}

async function saveInsert() {
  if (!insertData.value) {
    closeModal();
    return;
  }

  return executeInsertMutation({
    ...insertData.value,
  });
}

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  if (!('id' in props.user)) {
    // this should never happen
    throw new Error('User ID is missing');
  }

  return executeEditMutation({
    id: props.user.id,
    user: editedData.value,
  });
}

const saveError = computed(() => saveInsertError.value || saveEditError.value);

const { t } = useI18n();
</script>

<style lang="scss" scoped>
:global(.body--dark .entity-modal-content__error-tooltip) {
  border: 1px solid $grey-7;
}
</style>
