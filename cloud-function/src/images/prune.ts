import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import { pruneUnreferencedFiles, type PruneConfig } from '../lib/prune';
import {
  ReferencedImagesQuery,
  type ReferencedImagesQueryResponse,
} from '../queries';
import { IMAGE_FILE_NAME_REGEX, IMAGE_STORAGE_PREFIX } from './fileName';

/**
 * Deletes images that are not referenced in the database (attribute_values).
 */
export function pruneImages() {
  return pruneUnreferencedFiles(imagePruneConfig);
}

async function getReferenced(fileNames: string[]) {
  const data = await fetchGraphQL({
    query: ReferencedImagesQuery,
    variables: {
      imagesCi: fileNames,
      imagesStr: fileNames,
    },
  });

  if (data.errors) {
    const firstError = data.errors[0];
    throw new ErrorWithStatus(
      500,
      `ReferencedImagesQuery failed: ${firstError.message}`,
    );
  }

  return (data.data as ReferencedImagesQueryResponse).attribution_values
    .flatMap((i) => [i.photo_note, i.text_value])
    .filter(Boolean) as string[];
}

export const imagePruneConfig: PruneConfig = {
  name: 'PruneImages',
  storagePrefix: IMAGE_STORAGE_PREFIX,
  fileNameRegex: IMAGE_FILE_NAME_REGEX,
  getReferenced,
};
