<template>
  <BaseInputLabel :label="t('users.fields.password')">
    <q-btn
      color="primary"
      unelevated
      :label="t('users.changePassword')"
      @click="open = true"
    />
  </BaseInputLabel>

  <q-dialog v-model="open">
    <EntityModalContent
      v-if="open"
      :title="t('users.changePassword')"
      :loading="fetching"
      :save-error="error"
      :validation-error="validationError"
      @cancel="open = false"
      @save="changePassword"
      @reset-errors="() => (validationError = null)"
    >
      <EntityInput
        :ref="(el: InputRef) => (refs.passwordRef = el)"
        v-model="data.password"
        :label="t('users.fields.newPassword')"
        type="password"
        :autocomplete="me?.id === userId ? 'new-password' : 'off'"
        :rules="[
          (val: string) =>
            !!isValidPassword(val) || t('users.validation.invalidPassword'),
        ]"
      />

      <div
        class="row items-center q-gutter-md"
        :class="{ 'text-negative': me?.id === userId }"
      >
        <div class="col-auto">
          <q-avatar icon="warning" />
        </div>
        <div class="col">
          {{
            me?.id === userId
              ? t('users.changePasswordWarningMe')
              : t('users.changePasswordWarningOthers')
          }}
        </div>
      </div>
      <template #action-left><div /></template>
    </EntityModalContent>
  </q-dialog>
</template>

<script setup lang="ts">
import { useMutation } from '@urql/vue';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { useMe } from 'src/composables/useMe';
import { VNodeRef, ref, watch } from 'vue';
import { useEntityForm } from 'src/composables/useEntityForm';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { makeModalPersistentSymbol } from '../Entity/modalProvideSymbols';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import EntityModalContent from '../Entity/EntityModalContent.vue';
import { isValidPassword } from 'src/utils/validationUtils';
import { useRouter } from 'vue-router';
import BaseInputLabel from '../Base/BaseInputLabel.vue';

export interface UserButtonChangePasswordProps {
  userId: number;
}
const props = defineProps<UserButtonChangePasswordProps>();

const open = ref(false);

const initialData = {
  password: null,
};

const data = ref({ ...initialData });

type InputRef = VNodeRef & {
  validate: () => boolean | Promise<boolean> | undefined;
  focus: () => void;
};
const refs = ref<{ [key: string]: InputRef | null }>({
  passwordRef: null,
});

const { isDirty, validate } = useEntityForm({
  refs,
  data,
  initialData,
});

defineExpose({ validate });

const validationError = ref<string | null>(null);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
watch(isDirty, () => makeModalPersistent(isDirty.value));

const {
  executeMutation: executeChangePassword,
  error,
  fetching,
} = useMutation(
  graphql(`
    mutation ChangePassword($password: String!, $user_id: Int!) {
      ChangePassword(password: $password, user_id: $user_id) {
        id
      }
    }
  `),
);

const me = useMe();
const router = useRouter();

async function changePassword() {
  const isValid = await validate();
  validationError.value = isValid ? null : t('base.validation.invalidFields');
  if (!isValid || !data.value.password) {
    return;
  }

  return executeChangePassword({
    user_id: props.userId,
    password: data.value.password,
  }).then(() => {
    if (props.userId === me.value?.id) {
      // trigger signin
      router.push({ path: '/users' });
      return;
    }
    open.value = false;
  });
}

const { t } = useI18n();
</script>
