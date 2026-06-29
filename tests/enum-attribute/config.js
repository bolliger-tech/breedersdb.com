const path = require('path');

// Dev-only credentials. These belong to a throwaway local account that is never
// used in any production setup; env vars still override them if set.
//   BREEDERSDB_EMAIL     (default: tester@breedersdb.com)
//   BREEDERSDB_PASSWORD  (default: the local dev password below)
module.exports = {
  BASE_URL: process.env.BREEDERSDB_URL || 'http://localhost',
  EMAIL: process.env.BREEDERSDB_EMAIL || 'tester@breedersdb.com',
  PASSWORD: process.env.BREEDERSDB_PASSWORD || 'Asdfasdf.1',

  STATE_PATH: path.join(__dirname, '.auth', 'state.json'),
  SHOTS_DIR: path.join(__dirname, 'shots'),

  // Seeded dev-DB assumptions — see README. The sample attribute is kept by the
  // handoff; PLANT_LABEL must be an existing plant label id in the dev DB.
  SAMPLE_ATTRIBUTE: 'Fruit shape (sample)',
  PLANT_LABEL: '00000004',
  AUTHOR: 'E2E enum test',

  // Names of throwaway artifacts the suite creates (cleanup.js removes these).
  TEST_ATTRIBUTE: 'Texture (test)',
  TEST_FORM: 'E2E enum form (test)',
};
