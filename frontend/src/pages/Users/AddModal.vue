<template>
  <UserModalEdit :user="user" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import UserModalEdit, {
  UserInsertInput,
} from 'src/components/User/UserModalEdit.vue';

const user: UserInsertInput = {
  email: null,
  locale: '',
  password: '',
};

const { t } = useI18n();
</script>
