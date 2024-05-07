import { base } from './base';
import { nav } from './nav';
import { errorNotFound } from './error-not-found';
import { trees } from './trees';
import { cultivars } from './cultivars';
import { filter } from './filter';
import { datetimeFormats } from './datetime-formats';

const messages = {
  base,
  nav,
  errorNotFound,
  trees,
  cultivars,
  filter,
};

export default { messages, datetimeFormats };
