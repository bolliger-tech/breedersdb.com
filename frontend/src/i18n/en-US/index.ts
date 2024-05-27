import { base } from './base';
import { nav } from './nav';
import { errorNotFound } from './error-not-found';
import { trees } from './trees';
import { cultivars } from './cultivars';
import { filter } from './filter';
import { datetimeFormats } from './datetime-formats';
import { entity } from './entity-shared';
import { attributions } from './attributions';
import { crossings } from './crossings';

const messages = {
  base,
  nav,
  errorNotFound,

  entity,
  crossings,
  cultivars,
  trees,
  attributions,

  filter,
};

export default { messages, datetimeFormats };
