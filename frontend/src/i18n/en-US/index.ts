import { base } from './base';
import { nav } from './nav';
import { errorNotFound } from './error-not-found';
import { trees } from './trees';
import { cultivars } from './cultivars';
import { filter } from './query-filter';
import { result } from './query-result';
import { datetimeFormats } from './datetime-formats';
import { entity } from './entity-shared';
import { attributions } from './attributions';
import { crossings } from './crossings';
import { lots } from './lots';
import { groups } from './groups';
import { motherTrees } from './mother-trees';
import { pollen } from './pollen';
import { graftings } from './graftings';
import { orchards } from './orchards';
import { plantRows } from './plant-rows';
import { rootstocks } from './rootstocks';
import { users } from './users';

const messages = {
  base,
  nav,
  errorNotFound,

  entity,
  crossings,
  lots,
  groups,
  cultivars,
  trees,
  motherTrees,
  pollen,
  attributions,
  graftings,
  orchards,
  plantRows,
  rootstocks,
  users,

  filter,
  result,
};

export default { messages, datetimeFormats };
