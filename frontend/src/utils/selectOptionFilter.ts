import { QSelect } from 'quasar';
import { Ref } from 'vue';
import { escapeRegExp } from './stringUtils';

export type FilterSelectOptionsUpdateFn = (
  filterFn: () => void,
  selectFn: (ref: QSelect) => void,
) => void;

export function filterSelectOptions<T>({
  searchValue,
  update,
  allOptions,
  filteredOptions,
  valueExtractorFn,
  withWildcardsAroundDots = false,
}: {
  searchValue: string;
  update: FilterSelectOptionsUpdateFn;
  allOptions: T[] | readonly T[];
  filteredOptions: Ref<T[] | readonly T[]>;
  valueExtractorFn: (item: T) => string;
  withWildcardsAroundDots?: boolean;
}) {
  update(
    () =>
      (filteredOptions.value = filterOptions({
        searchValue,
        allOptions,
        valueExtractorFn,
        withWildcardsAroundDots,
      })),
    (ref) => selectFirstOption(ref, searchValue),
  );
}

export function filterOptions<T>({
  searchValue,
  allOptions,
  valueExtractorFn,
  withWildcardsAroundDots,
}: {
  searchValue: string;
  allOptions: T[] | readonly T[];
  valueExtractorFn: (item: T) => string;
  withWildcardsAroundDots: boolean;
}) {
  searchValue = searchValue.trim();

  if (searchValue === '') {
    return allOptions;
  }

  if (!withWildcardsAroundDots) {
    const needle = searchValue.toLocaleLowerCase();

    return allOptions.filter(
      (v) => valueExtractorFn(v).toLocaleLowerCase().indexOf(needle) > -1,
    );
  }

  const term = new RegExp(
    // add wildcard (except dot) before and after each dot
    // e.g. 'foo.bar' -> 'foo.[^.]\.[^.]*bar'
    searchValue
      .toLocaleLowerCase()
      .split('.')
      .map(escapeRegExp)
      .join('[^.]*\\.[^.]*'),
  );

  return allOptions.filter((v) =>
    term.test(valueExtractorFn(v).toLocaleLowerCase()),
  );
}

export function selectFirstOption(ref: QSelect, value: string) {
  if (value !== '' && ref && ref.options && ref.options.length > 0) {
    ref.setOptionIndex(-1); // reset optionIndex in case there is something selected
    ref.moveOptionSelection(1, true); // focus the first selectable option and do not update the input-value
  }
}
