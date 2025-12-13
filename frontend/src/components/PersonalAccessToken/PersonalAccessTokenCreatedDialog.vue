<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card>
      <q-card-section>
        <h3 class="q-my-sm">
          {{ t('personalAccessTokens.created.title') }}
        </h3>
      </q-card-section>

      <q-card-section>
        <BaseMessage
          type="info"
          class="q-mb-md"
          iconSize="md"
          iconColor="primary"
        >
          {{ t('personalAccessTokens.created.message') }}
        </BaseMessage>
        <EntityInput
          v-model="token"
          label="Token"
          readonly
          @click="onInputClick"
          :hint="expiresHint"
        >
          <template #append>
            <q-btn flat dense icon="content_copy" @click="onCopyTokenClick" />
          </template>
        </EntityInput>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          :label="t('base.close')"
          color="primary"
          @click="modelValue = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityInput from 'components/Entity/Edit/EntityInput.vue';
import { useQuasar } from 'quasar';
import BaseMessage from 'components/Base/BaseMessage.vue';

export interface PersonalAccessTokenCreatedDialogProps {
  createdTokenData: {
    token: string;
    expires: string | null;
  };
}
const props = defineProps<PersonalAccessTokenCreatedDialogProps>();
const modelValue = defineModel<boolean>({
  required: true,
});

const token = props.createdTokenData.token;

const { t } = useI18n();
const { notify } = useQuasar();

function onInputClick(e: Event) {
  if (
    e.target &&
    'select' in e.target &&
    typeof e.target.select === 'function'
  ) {
    e.target.select();
    void onCopyTokenClick();
  }
}

async function onCopyTokenClick() {
  try {
    await navigator.clipboard.writeText(token);
  } catch {
    notify({
      type: 'negative',
      message: t('personalAccessTokens.created.tokenCopyFailed'),
    });
    return;
  }
  notify({
    type: 'positive',
    message: t('personalAccessTokens.created.tokenCopied'),
  });
}

const expiresHint = props.createdTokenData.expires
  ? t('personalAccessTokens.created.validUntilDate', {
      date: new Date(props.createdTokenData.expires).toLocaleDateString(
        undefined,
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      ),
    })
  : t('personalAccessTokens.created.validUntilDeleted');
</script>
