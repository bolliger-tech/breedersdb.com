<template>
  <EntityModalContent
    :loading="savingEdit || savingInsert"
    :save-error="saveError"
    :validation-error="validationError"
    :sprite-icon="spriteIcon"
    :title="t('base.edit')"
    :subtitle="subtitle"
    @cancel="cancel"
    @save="save"
    @reset-errors="resetErrors"
  >
    <template #default>
      <slot
        name="form"
        :set-form-ref="setFormRef"
        :on-change="onFormChange"
      ></slot>
    </template>

    <template #action-left>
      <slot name="action-left"></slot>
    </template>
  </EntityModalContent>
</template>

<script
  setup
  lang="ts"
  generic="
    T extends new (...args: any) => any,
    EditInput extends object,
    InsertInput extends object
  "
>
import { useMutation } from '@urql/vue';
import { VariablesOf } from 'src/graphql';
import { computed, ref, nextTick } from 'vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import { useI18n } from 'src/composables/useI18n';
import {
  closeModalSymbol,
  makeModalPersistentSymbol,
} from 'src/components/Entity/modalProvideSymbols';
import { useInjectOrThrow } from 'src/composables/useInjectOrThrow';
import { useCancel } from 'src/composables/useCancel';
import { SpriteIcons } from '../Base/BaseSpriteIcon/types';
import { TadaDocumentNode } from 'gql.tada';

const props = defineProps<{
  entity: EditInput | InsertInput;
  entityName: string;
  insertMutation: TadaDocumentNode;
  editMutation: TadaDocumentNode;
  indexPath: string;
  spriteIcon: SpriteIcons;
  subtitle: string;
}>();

const { cancel } = useCancel({ path: props.indexPath });

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const formRef = ref<InstanceType<T> | null>(null);

function setFormRef(form: InstanceType<T>) {
  formRef.value = form;
}

const insertData = ref<VariablesOf<typeof props.insertMutation>['entity']>();
const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
} = useMutation(props.insertMutation);

const editedData = ref<VariablesOf<typeof props.editMutation>['entity']>();
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
} = useMutation(props.editMutation);

function onFormChange(data: typeof editedData.value | typeof insertData.value) {
  if (!data) {
    return;
  } else if ('id' in props.entity) {
    editedData.value = data;
  } else {
    insertData.value = data;
  }
}

async function save() {
  const isValid = await formRef.value?.validate();
  validationError.value = isValid ? null : t('base.validation.invalidFields');
  if (!isValid) {
    return;
  }

  if ('id' in props.entity) {
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
    [props.entityName]: insertData.value,
  });
}

async function saveEdit() {
  if (!editedData.value) {
    closeModal();
    return;
  }

  if (!('id' in props.entity)) {
    // this should never happen
    throw new Error('Entity ID is missing');
  }

  return executeEditMutation({
    id: props.entity.id,
    [props.entityName]: editedData.value,
  });
}

const saveError = computed(() => saveInsertError.value || saveEditError.value);

function resetErrors() {
  saveInsertError.value = undefined;
  saveEditError.value = undefined;
  validationError.value = null;
}

const { t } = useI18n();
</script>
