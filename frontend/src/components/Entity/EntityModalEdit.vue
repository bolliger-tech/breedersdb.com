<template>
  <EntityModalContent
    :loading="
      validating ||
      savingEdit ||
      savingInsert ||
      printing ||
      preparingNewFromTemplate
    "
    :save-error="saveError"
    :validation-error="validationError"
    :sprite-icon="spriteIcon"
    :title="t('base.edit')"
    :subtitle="subtitle"
    :save-then-print="!!makeLabel"
    v-on="{
      save: createSaveThen(close),
      cancel,
      resetErrors,
      ...(makeLabel && { saveThenPrint: createSaveThen(printLabel, close) }),
      ...(onNewFromTemplate && {
        saveThenNewFromTemplate: createSaveThen(newFromTemplate),
      }),
      saveThenPrintThenNewFromTemplate: createSaveThen(
        printLabel,
        newFromTemplate,
      ),
    }"
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
  // make emit handler available in template
  onNewFromTemplate?: (templateId: number) => void;
  withInsertData?: (data: InsertVariables['entity']) => InsertVariables;
  withEditData?: (data: EditVariables['entity']) => EditVariables;
}>();

const emit = defineEmits<{
  newFromTemplate: [templateId: number];
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

async function save() {
  validating.value = true;
  const isValid = await formRef.value?.validate();
  validating.value = false;

  validationError.value = isValid ? null : t('base.validation.invalidFields');
  if (!isValid) {
    return Promise.reject();
  }

  if ('id' in props.entity) {
    await saveEdit();
  } else {
    await saveInsert();
  }

  await nextTick();

  if (saveError.value) {
    return Promise.reject();
  }
}

function close() {
  makeModalPersistent(false);
  closeModal();
}

async function saveInsert() {
  if (!insertData.value) {
    return;
  }

  const data =
    props.withInsertData?.(insertData.value) ??
    ({ entity: insertData.value } as InsertVariables);

  return executeInsertMutation(data);
}

async function saveEdit() {
  if (!editedData.value) {
    return;
  }

  if (!('id' in props.entity)) {
    // this should never happen
    throw new Error('Entity ID is missing');
  }

  const data =
    props.withEditData?.(editedData.value) ??
    ({
      id: props.entity.id,
      entity: editedData.value,
    } as EditVariables);

  return executeEditMutation(data);
}

const saveError = computed(() => saveInsertError.value || saveEditError.value);
const saveResult = computed(() => insertResult.value || editResult.value);

function resetErrors() {
  saveInsertError.value = undefined;
  saveEditError.value = undefined;
  validationError.value = null;
}

const entityId = computed<EditInput['id'] | undefined>(() => {
  if ('id' in props.entity) {
    return props.entity.id;
  } else if (saveResult.value) {
    const key = Object.keys(saveResult.value)[0];
    return saveResult.value[key].id;
  }
  return undefined;
});

const printing = ref(false);
const $q = useQuasar();
const { print } = usePrint();

async function printLabel() {
  if (!props.makeLabel) {
    return;
  }

  printing.value = true;

  try {
    if (!entityId.value) {
      throw new Error('Failed to print: Missing entity id');
    }
    await print(await props.makeLabel(entityId.value));
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

const preparingNewFromTemplate = ref(false);
async function newFromTemplate() {
  if (!entityId.value) {
    throw new Error('Failed to prepare new from template: Missing entity id');
  }
  preparingNewFromTemplate.value = true;
  emit('newFromTemplate', entityId.value);
}

function createSaveThen(...actions: (() => Promise<void> | void)[]) {
  return async () => {
    try {
      await save();
      for (const action of actions) {
        await action();
      }
    } catch (e) {
      // ignore. errors must be handled in the actions
      // promises are just used to chain the actions
    }
  };
}

const { t } = useI18n();
</script>
