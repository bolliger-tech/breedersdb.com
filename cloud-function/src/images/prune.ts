import { ErrorWithStatus } from '../lib/errors';
import { FILE_NAME_REGEX } from './cache';
import { fetchGraphQL } from '../lib/fetch';
import { pruneUnreferencedFiles } from '../lib/prune';
import {
  ReferencedImagesQuery,
  type ReferencedImagesQueryResponse,
} from '../queries';

/**
 * Deletes images that are not referenced in the database (attribute_values).
 */
export function pruneImages() {
  return pruneUnreferencedFiles({
    name: 'PruneImages',
    // images are stored at the root of the bucket, skip the folders (e.g. attachments)
    listOptions: { delimiter: '/' },
    getDbFileReference,
    getReferenced,
  });
}

function getDbFileReference(fileName: string) {
  const match = fileName.match(FILE_NAME_REGEX);
  if (!match) {
    console.warn('Ignoring file. File name does not match regex:', fileName);
    return null;
  }
  return `${match[1]}.${match[2]}`;
}

async function getReferenced(references: string[]) {
  const data = await fetchGraphQL({
    query: ReferencedImagesQuery,
    variables: {
      imagesCi: references,
      imagesStr: references,
    },
  });

  if (data.errors) {
    const firstError = data.errors[0];
    throw new ErrorWithStatus(
      500,
      `ReferencedImagesQuery failed: ${firstError.message}`,
    );
  }

  return (data.data as ReferencedImagesQueryResponse).attribution_values.map(
    (i) => i.photo_note || i.text_value,
  ) as string[];
}
