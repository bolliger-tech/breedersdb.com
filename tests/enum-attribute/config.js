const path = require('path');

// Credentials come from the environment so no secret lives in the repo.
//   BREEDERSDB_EMAIL     (default: tester@breedersdb.com)
//   BREEDERSDB_PASSWORD  (required — auth.setup.js fails without it)
module.exports = {
  BASE_URL: process.env.BREEDERSDB_URL || 'http://localhost',
  EMAIL: process.env.BREEDERSDB_EMAIL || 'tester@breedersdb.com',
  PASSWORD: process.env.BREEDERSDB_PASSWORD || '',

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
