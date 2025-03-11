import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import { messages, datetimeFormats, DEFAULT_LOCALE } from 'src/i18n';
import { getPersistedLocale } from 'src/composables/useI18n';

// Type-define DEFAULT_LOCALE as the master schema for the resource
export type MessageSchema = (typeof messages)[typeof DEFAULT_LOCALE];
export type DateTimeFormats = (typeof datetimeFormats)[typeof DEFAULT_LOCALE];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat extends DateTimeFormats {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

// export for testing
/**
 * if not all languages contain all keys, this will fail
 *
 * @ts-ignore: No overload matches this call.
 */
export const i18n = createI18n({
  locale: getPersistedLocale() || DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  legacy: false,
  messages,
  datetimeFormats,
});

export default defineBoot(({ app }) => {
  // Set i18n instance on app
  app.use(i18n);
});
