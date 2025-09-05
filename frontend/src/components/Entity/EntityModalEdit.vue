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
      keydown: onKeydown,
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
    InsertVariables extends {
      entity: Record<string, any>;
      id?: never;
      [key: string]: any;
    },
    EditResult extends { [key: string]: any },
    EditVariables extends {
      entity: Record<string, any>;
      id: number;
      [key: string]: any;
    }
  "
>
import type { OperationContext } from '@urql/vue';
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
import type { SpriteIcons } from '../Base/BaseSpriteIcon/types';
import type { TadaDocumentNode } from 'gql.tada';
import { usePrint } from 'src/composables/usePrint';
import { captureException } from '@sentry/browser';
import { useQuasar } from 'quasar';
import type { PartialWithUndefined } from 'src/utils/typescriptUtils';
import { HandledError } from './HandledError';

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
  insertMutationContext?: Partial<OperationContext>;
  editMutationContext?: Partial<OperationContext>;
  indexPath: string;
  spriteIcon: SpriteIcons;
  subtitle: string;
  makeLabel?: ((entityId: number) => Promise<string>) | undefined;
  // make emit handler available in template
  onNewFromTemplate?: ((templateId: number) => void) | undefined;
  withInsertData?:
    | ((data: InsertVariables['entity']) => InsertVariables)
    | undefined;
  withEditData?: ((data: EditVariables['entity']) => EditVariables) | undefined;
}>();

const emit = defineEmits<{
  newFromTemplate: [templateId: number];
}>();

const { cancel } = useCancel({ path: props.indexPath });

const validationError = ref<string | null>(null);
const closeModal = useInjectOrThrow(closeModalSymbol);
const makeModalPersistent = useInjectOrThrow(makeModalPersistentSymbol);
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
const formRef = ref<InstanceType<FormRef> | null>(null);

function setFormRef(form: InstanceType<FormRef>) {
  formRef.value = form;
}

const insertData = ref<InsertVariables['entity']>();
const {
  fetching: savingInsert,
  error: saveInsertError,
  data: insertResult,
  ...urqlInsert
} = useMutation(props.insertMutation);

const editedData = ref<EditVariables['entity']>();
const {
  fetching: savingEdit,
  error: saveEditError,
  data: editResult,
  ...urqlEdit
} = useMutation(props.editMutation);

function onFormChange(data: PartialWithUndefined<InsertVariables['entity']>) {
  if (!data) {
    return;
  }
  // remove undefined values
  for (const key in data) {
    if (data[key] === undefined) {
      delete data[key];
    }
  }
  if ('id' in props.entity) {
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
    return Promise.reject(
      new HandledError('Validation failed: Invalid form fields'),
    );
  }

  if ('id' in props.entity) {
    await saveEdit();
  } else {
    await saveInsert();
  }

  await nextTick();

  if (saveError.value) {
    return Promise.reject(saveError.value);
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

  return urqlInsert.executeMutation(data, props.insertMutationContext);
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

  return urqlEdit.executeMutation(data, props.editMutationContext);
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
    return key && saveResult.value[key].id;
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
function newFromTemplate() {
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
      if (e instanceof HandledError) {
        // handled errors are expected, so we don't report them
        return;
      }
      // errors must be handled in the actions
      // promises are just used to chain the actions.
      // but report any unhandled errors
      console.error('Failed to save and execute actions', e);
      captureException(e);
    }
  };
}

function onKeydown(event: KeyboardEvent) {
  // prevent arrow keys from navigating the page when editing
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.stopPropagation();
  }
}

const { t } = useI18n();
</script>
