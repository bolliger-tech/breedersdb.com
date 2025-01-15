<template>
  <EntityModalContent
    :loading="validating || savingEdit || savingInsert || printing"
    :save-error="saveError"
    :validation-error="validationError"
    :sprite-icon="spriteIcon"
    :title="t('base.edit')"
    :subtitle="subtitle"
    :save-then-print="!!makeLabel"
    @cancel="cancel"
    @save="save"
    @save-then-print="() => save(true)"
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

<script lang="ts">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormRefConstructor = new (...args: any) => any;
</script>

<script
  setup
  lang="ts"
  generic="
    FormRef extends FormRefConstructor,
    EditInput extends { id: number; [key: string]: any },
    InsertInput extends { [key: string]: any },
    InsertResult extends { [key: string]: any },
    InsertVariables extends { entity: any; id?: never; [key: string]: any },
    EditResult extends { [key: string]: any },
    EditVariables extends { entity: any; id: number; [key: string]: any }
  "
>
import { useMutation } from '@urql/vue';
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
import { usePrint } from 'src/composables/usePrint';
import { captureException } from '@sentry/browser';
import { useQuasar } from 'quasar';

/**
 * NOTE: your mutations must have a variable called $entity
 * that holds your insert / edit input!
 *
 * Example (simplified):
 *
 * mutation InsertOrchard(
 *     $entity: orchards_insert_input!
 *   ) {
 *     insert_orchards_one(object: $entity) {
 *       ...orchardFragment
 *     }
 *   }
 */

const props = defineProps<{
  entity: EditInput | InsertInput;
  insertMutation: TadaDocumentNode<InsertResult, InsertVariables, void>;
  editMutation: TadaDocumentNode<EditResult, EditVariables, void>;
  indexPath: string;
  spriteIcon: SpriteIcons;
  subtitle: string;
  makeLabel?: (entityId: number) => Promise<string>;
}>();

const { cancel } = useCancel({ path: props.indexPath });

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
const formRef = ref<InstanceType<FormRef> | null>(null);

function setFormRef(form: InstanceType<FormRef>) {
  formRef.value = form;
}

const insertData = ref<InsertVariables['entity']>();
const {
  executeMutation: executeInsertMutation,
  fetching: savingInsert,
  error: saveInsertError,
  data: insertResult,
} = useMutation(props.insertMutation);

const editedData = ref<EditVariables['entity']>();
const {
  executeMutation: executeEditMutation,
  fetching: savingEdit,
  error: saveEditError,
  data: editResult,
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

const validating = ref(false);

async function save(print = false) {
  validating.value = true;
  const isValid = await formRef.value?.validate();
  validating.value = false;

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
    if (print) await printLabel();
    makeModalPersistent(false);
    closeModal();
  }
}

async function saveInsert() {
  if (!insertData.value) {
    return;
  }

  return executeInsertMutation({
    entity: insertData.value,
  } as InsertVariables);
}

async function saveEdit() {
  if (!editedData.value) {
    return;
  }

  if (!('id' in props.entity)) {
    // this should never happen
    throw new Error('Entity ID is missing');
  }

  return executeEditMutation({
    id: props.entity.id,
    entity: editedData.value,
  } as EditVariables);
}

const saveError = computed(() => saveInsertError.value || saveEditError.value);
const saveResult = computed(() => insertResult.value || editResult.value);

function resetErrors() {
  saveInsertError.value = undefined;
  saveEditError.value = undefined;
  validationError.value = null;
}

const printing = ref(false);
const $q = useQuasar();
const { print } = usePrint();

async function printLabel() {
  if (!props.makeLabel) {
    return;
  }

  printing.value = true;

  let id: number | undefined = undefined;
  if (saveResult.value) {
    const key = Object.keys(saveResult.value)[0];
    id = saveResult.value[key].id;
  } else if (!editedData.value && 'id' in props.entity) {
    // happens if no changes were made
    id = props.entity.id;
  }

  try {
    if (!id) {
      throw new Error('Failed to print: Missing entity id');
    }
    await print(await props.makeLabel(id));
  } catch (e) {
    if (e instanceof Error) {
      captureException(e);
    }
    console.error('Failed to print label', e);
    $q.notify({
      type: 'negative',
      message: t('base.savedButPrintingFailed'),
      caption: t('base.detailsInConsole'),
    });
  } finally {
    printing.value = false;
  }
}

const { t } = useI18n();
</script>
