<template>
  <BaseMessage type="warning" class="q-mt-xl q-mt-sm-lg" icon-size="md">
    <p class="q-mb-sm">{{ t('users.changePasswordWarning.base') }}</p>
    <ul class="q-mt-sm">
      <li>
        {{
          isMe
            ? t('users.changePasswordWarning.logoutMe')
            : t('users.changePasswordWarning.logoutOthers')
        }}
      </li>
      <li>
        {{
          isMe
            ? t('users.changePasswordWarning.deletePatMe')
            : t('users.changePasswordWarning.deletePatOthers')
        }}
      </li>
    </ul>
  </BaseMessage>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import BaseMessage from 'src/components/Base/BaseMessage.vue';

export interface UserPasswordChangeWarningProps {
  isMe: boolean;
}

defineProps<UserPasswordChangeWarningProps>();

const { t } = useI18n();
</script>
