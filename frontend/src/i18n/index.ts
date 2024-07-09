import enUS from './en-US';
import deCH from './de-CH';

export const messages = {
  'en-US': enUS.messages,
  'de-CH': deCH.messages,
};

export const datetimeFormats = {
  'en-US': enUS.datetimeFormats,
  'de-CH': deCH.datetimeFormats,
};

export type MessageLanguages = keyof typeof messages;

export const locales = Object.keys(messages) as MessageLanguages[];
export const DEFAULT_LOCALE: Extract<MessageLanguages, 'en-US'> = 'en-US';
