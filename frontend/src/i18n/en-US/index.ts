import { base } from './base';
import { nav } from './nav';
import { errorNotFound } from './error-not-found';
import { plants } from './plants';
import { cultivars } from './cultivars';
import { filter } from './query-filter';
import { result } from './query-result';
import { datetimeFormats } from './datetime-formats';
import { entity } from './entity-shared';
import { attributions } from './attributions';
import { crossings } from './crossings';
import { lots } from './lots';
import { groups } from './groups';
import { motherPlants } from './mother-plants';
import { pollen } from './pollen';
import { graftings } from './graftings';
import { orchards } from './orchards';
import { plantRows } from './plant-rows';
import { rootstocks } from './rootstocks';
import { users } from './users';
import { entity } from './entity';

const messages = {
  base,
  nav,
  errorNotFound,

  entity,
  crossings,
  lots,
  groups,
  cultivars,
  plants,
  motherPlants,
  pollen,
  attributions,
  graftings,
  orchards,
  plantRows,
  rootstocks,
  users,

  entity,

  filter,
  result,
};

export default { messages, datetimeFormats };
