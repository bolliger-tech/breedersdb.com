// Remove everything the suite created and restore the sample attribute.
// Deletes are by the distinctive AUTHOR / TEST_* names from config.js, so review
// those before running against any DB that isn't a throwaway dev database.
const { cfg } = require('./lib');
const { hasura } = require('./db');

const q = (s) => JSON.stringify(s);

(async () => {
  // 1) test attributions (and their values) by author
  const a = await hasura(
    `{ attributions(where:{author:{_eq:${q(cfg.AUTHOR)}}}){ id } }`,
  );
  const attrIds = a.attributions.map((x) => x.id);
  if (attrIds.length) {
    await hasura(
      `mutation{ delete_attribution_values(where:{attribution_id:{_in:[${attrIds.join(',')}]}}){ affected_rows } }`,
    );
    await hasura(
      `mutation{ delete_attributions(where:{id:{_in:[${attrIds.join(',')}]}}){ affected_rows } }`,
    );
  }
  console.log(`deleted ${attrIds.length} test attribution(s)`);

  // 2) test form (and its fields)
  const f = await hasura(
    `{ attribution_forms(where:{name:{_eq:${q(cfg.TEST_FORM)}}}){ id } }`,
  );
  const formIds = f.attribution_forms.map((x) => x.id);
  if (formIds.length) {
    await hasura(
      `mutation{ delete_attribution_form_fields(where:{attribution_form_id:{_in:[${formIds.join(',')}]}}){ affected_rows } }`,
    );
    await hasura(
      `mutation{ delete_attribution_forms(where:{id:{_in:[${formIds.join(',')}]}}){ affected_rows } }`,
    );
  }
  console.log(`deleted ${formIds.length} test form(s)`);

  // 3) test attribute (and its enum options)
  const at = await hasura(
    `{ attributes(where:{name:{_eq:${q(cfg.TEST_ATTRIBUTE)}}}){ id } }`,
  );
  const atIds = at.attributes.map((x) => x.id);
  if (atIds.length) {
    await hasura(
      `mutation{ delete_attribute_enum_options(where:{attribute_id:{_in:[${atIds.join(',')}]}}){ affected_rows } }`,
    );
    await hasura(
      `mutation{ delete_attributes(where:{id:{_in:[${atIds.join(',')}]}}){ affected_rows } }`,
    );
  }
  console.log(`deleted ${atIds.length} test attribute(s)`);

  // 4) restore the sample attribute: rename "Elongated" back to "Conical"
  const sa = await hasura(
    `{ attributes(where:{name:{_eq:${q(cfg.SAMPLE_ATTRIBUTE)}}}){ id } }`,
  );
  if (sa.attributes[0]) {
    const sid = sa.attributes[0].id;
    const eo = await hasura(
      `{ attribute_enum_options(where:{attribute_id:{_eq:${sid}}, label:{_eq:"Elongated"}}){ id } }`,
    );
    for (const o of eo.attribute_enum_options) {
      await hasura(
        `mutation{ update_attribute_enum_options_by_pk(pk_columns:{id:${o.id}}, _set:{label:"Conical"}){ id } }`,
      );
    }
    console.log(
      `restored ${eo.attribute_enum_options.length} sample option label(s)`,
    );
  }

  console.log('cleanup done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
