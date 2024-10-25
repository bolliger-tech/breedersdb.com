import { base } from './base';
import { nav } from './nav';
import { errorNotFound } from './error-not-found';
import { auth } from './auth';
import { plants } from './plants';
import { cultivars } from './cultivars';
import { datetimeFormats } from './datetime-formats';
import { attributions } from './attributions';
import { attributes } from './attributes';
import { attributionForms } from './attribution-forms';
import { crossings } from './crossings';
import { lots } from './lots';
import { plantGroups } from './plant-groups';
import { motherPlants } from './mother-plants';
import { pollen } from './pollen';
import { graftings } from './graftings';
import { orchards } from './orchards';
import { plantRows } from './plant-rows';
import { rootstocks } from './rootstocks';
import { users } from './users';
import { entity } from './entity';
import { analyze } from './analyze';
import { pwa } from './pwa';
import { settings } from './settings';

const messages = {
  base,
  nav,
  errorNotFound,
  auth,
  pwa,
  settings,

  entity,
  attributes,
  attributionForms,
  crossings,
  lots,
  plantGroups,
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

  analyze,
};

export default { messages, datetimeFormats };
