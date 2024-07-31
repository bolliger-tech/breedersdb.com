import { computed, ref } from 'vue';
import { LocalStorage } from 'quasar';
import type { AttributableEntities } from 'src/components/Attribution/attributableEntities';

const STORAGE_KEY = 'breedersdb-attribute-repeat-count';

type Counter = {
  lastModified: string; // ISO date
  formId: number;
  entityId: number;
  entityType: AttributableEntities;
  count: number;
};

type useRepeatCounterProps = {
  formId: number;
  entityId: number;
  entityType: AttributableEntities;
};

function getCounters() {
  return LocalStorage.getItem<Counter[]>(STORAGE_KEY) || [];
}

async function garbageCollect() {
  const validCounters = getCounters().filter((counter) => {
    const date = new Date(counter.lastModified);
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    return diff < 1000 * 60 * 60 * 24; // 24 hours
  });
  LocalStorage.setItem(STORAGE_KEY, validCounters);
}

export function useRepeatCounter({
  formId,
  entityId,
  entityType,
}: useRepeatCounterProps) {
  const _count = ref(0);

  function getCurrentCounter() {
    garbageCollect();
    return getCounters().find((counter) => {
      return (
        counter.formId === formId &&
        counter.entityId === entityId &&
        counter.entityType === entityType
      );
    });
  }

  function get() {
    _count.value = getCurrentCounter()?.count || 0;
  }

  function set(value: number) {
    const counter = {
      lastModified: new Date().toISOString(),
      formId,
      entityId,
      entityType,
      count: value,
    };

    const otherCounters = getCounters().filter((counter) => {
      return (
        counter.formId !== formId ||
        counter.entityId !== entityId ||
        counter.entityType !== entityType
      );
    });

    const newCounters = [counter, ...otherCounters];

    LocalStorage.setItem(STORAGE_KEY, newCounters);
    get();
  }

  const count = computed<number>({
    get: () => {
      get();
      // use count.value to trigger reactivity
      return _count.value;
    },
    set: (value: number) => set(value),
  });

  const lastChanged = computed<Date | null>(() => {
    const counter = getCurrentCounter();
    return counter ? new Date(counter.lastModified) : null;
  });

  return { count, lastChanged };
}
