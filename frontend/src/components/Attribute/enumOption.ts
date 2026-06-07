/**
 * Editable shape of an enum option.
 *
 * Unlike the server `attributeFragment` shape (where `id` is always present),
 * options being edited may be unsaved (no `id`) and carry a transient, client-only
 * `_uid` used as a stable v-for key during drag reorder; `_uid` is never persisted.
 */
export type EnumOptionInput = {
  id?: number;
  label: string;
  position: number;
  disabled: boolean;
  is_default: boolean;
  _uid?: number;
};
