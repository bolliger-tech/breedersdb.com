import { useQuery } from '@urql/vue';
import { graphql, type ResultOf } from 'src/graphql';
import {
  AttributeSchemaOptionType,
  type AttributeSchema,
  type AttributeSchemaOptions,
} from './filterOptionSchema';

// warning about unused fields is wrong. ignore it.
const query = graphql(`
  query Attributes {
    attributes(where: { disabled: { _eq: false } }, order_by: { name: asc }) {
      id
      name
      validation_rule
      data_type
    }
  }
`);

type Attribute = Omit<
  ResultOf<typeof query>['attributes'][0],
  'validation_rule'
> & {
  validation_rule: {
    min: number;
    max: number;
    step: number;
  } | null;
};

export function useAttributionFilterOptions({
  labelPrefix,
}: {
  labelPrefix: string;
}) {
  return { fetchOptions: () => fetchOptions(labelPrefix) };
}

async function fetchOptions(labelPrefix: string) {
  const { data, fetching, error } = await useQuery({
    query,
  });

  const attributionOptions: AttributeSchema[] =
    data.value?.attributes.map((attribute) =>
      convertAttributeToSchemaOption(attribute as Attribute, labelPrefix),
    ) || [];

  return { data: attributionOptions, fetching, error };
}

function convertAttributeToSchemaOption(
  attribute: Attribute,
  labelPrefix: string,
): AttributeSchema {
  return {
    name: `attribute.${attribute.id}`,
    label: `${labelPrefix} > ${attribute.name}`,
    options: getOptionsFromAttribute(attribute),
  };
}

function getTypeFromDataType(dataType: string): AttributeSchemaOptionType {
  const type = {
    TEXT: AttributeSchemaOptionType.String,
    INTEGER: AttributeSchemaOptionType.Integer,
    FLOAT: AttributeSchemaOptionType.Float,
    BOOLEAN: AttributeSchemaOptionType.Boolean,
    DATE: AttributeSchemaOptionType.Date,
    PHOTO: AttributeSchemaOptionType.Photo,
  }[dataType];

  if (typeof type === 'undefined') {
    throw Error(`Unknown attribute.data_type: ${dataType}`);
  }

  return type;
}

function getOptionsFromAttribute(attribute: Attribute): AttributeSchemaOptions {
  const type = getTypeFromDataType(attribute.data_type);

  switch (type) {
    case AttributeSchemaOptionType.String:
      return {
        type,
        allowEmpty: false,
        validation: {
          maxLen: 2047,
          pattern: null,
        },
      };
    case AttributeSchemaOptionType.Integer:
    case AttributeSchemaOptionType.Float:
      return {
        type,
        allowEmpty: false,
        validation: attribute.validation_rule as NonNullable<
          Attribute['validation_rule']
        >,
      };
    case AttributeSchemaOptionType.Photo:
      return {
        type,
        allowEmpty: true,
      };
    case AttributeSchemaOptionType.Enum:
      throw Error('Enum is not supported yet');
    default:
      return {
        type,
        allowEmpty: false,
      };
  }
}
