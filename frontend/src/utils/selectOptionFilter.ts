import { QSelect } from 'quasar';
import { Ref } from 'vue';

export type FilterSelectOptionsUpdateFn = (
  filterFn: () => void,
  selectFn: (ref: QSelect) => void,
) => void;

export function filterSelectOptions<T>({
  value,
  update,
  allOptions,
  filteredOptions,
  valueExtractorFn,
}: {
  value: string;
  update: FilterSelectOptionsUpdateFn;
  allOptions: T[] | readonly T[];
  filteredOptions: Ref<T[] | readonly T[]>;
  valueExtractorFn: (item: T) => string;
}) {
  update(
    () =>
      setFilteredOptions(value, allOptions, filteredOptions, valueExtractorFn),
    (ref) => selectFirstOption(ref, value),
  );
}

function setFilteredOptions<T>(
  value: string,
  allOptions: T[] | readonly T[],
  filteredOptions: Ref<T[] | readonly T[]>,
  valueExtractorFn: (item: T) => string,
) {
  if (value === '') {
    filteredOptions.value = allOptions;
  } else {
    const needle = value.toLocaleLowerCase();

    filteredOptions.value = allOptions.filter(
      (v) => valueExtractorFn(v).toLocaleLowerCase().indexOf(needle) > -1,
    );
  }
}

function selectFirstOption(ref: QSelect, value: string) {
  if (value !== '' && ref && ref.options && ref.options.length > 0) {
    ref.setOptionIndex(-1); // reset optionIndex in case there is something selected
    ref.moveOptionSelection(1, true); // focus the first selectable option and do not update the input-value
  }
}
