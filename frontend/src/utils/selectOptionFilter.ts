import { QSelect } from 'quasar';
import { Ref } from 'vue';
import { escapeRegExp } from './stringUtils';

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
  withWildcardsAroundDots = false,
}: {
  value: string;
  update: FilterSelectOptionsUpdateFn;
  allOptions: T[] | readonly T[];
  filteredOptions: Ref<T[] | readonly T[]>;
  valueExtractorFn: (item: T) => string;
  withWildcardsAroundDots?: boolean;
}) {
  update(
    () =>
      setFilteredOptions(
        value,
        allOptions,
        filteredOptions,
        valueExtractorFn,
        withWildcardsAroundDots,
      ),
    (ref) => selectFirstOption(ref, value),
  );
}

function setFilteredOptions<T>(
  value: string,
  allOptions: T[] | readonly T[],
  filteredOptions: Ref<T[] | readonly T[]>,
  valueExtractorFn: (item: T) => string,
  withWildcardsAroundDots: boolean,
) {
  if (value === '') {
    filteredOptions.value = allOptions;
    return;
  }

  if (!withWildcardsAroundDots) {
    const needle = value.toLocaleLowerCase();

    filteredOptions.value = allOptions.filter(
      (v) => valueExtractorFn(v).toLocaleLowerCase().indexOf(needle) > -1,
    );

    return;
  }

  const term = new RegExp(
    // add wildcard (except dot) before and after each dot
    // e.g. 'foo.bar' -> 'foo.[^.]\.[^.]*bar'
    value
      .toLocaleLowerCase()
      .split('.')
      .map(escapeRegExp)
      .join('[^.]*\\.[^.]*'),
  );

  filteredOptions.value = allOptions.filter((v) =>
    term.test(valueExtractorFn(v).toLocaleLowerCase()),
  );
}

export function selectFirstOption(ref: QSelect, value: string) {
  if (value !== '' && ref && ref.options && ref.options.length > 0) {
    ref.setOptionIndex(-1); // reset optionIndex in case there is something selected
    ref.moveOptionSelection(1, true); // focus the first selectable option and do not update the input-value
  }
}
