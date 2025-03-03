import { deleteFile, getFiles } from '../lib/storage';
import type { GetFilesOptions } from '@google-cloud/storage';
import { ErrorWithStatus } from '../lib/errors';
import { FILE_NAME_REGEX } from './cache';
import { fetchGraphQL } from '../lib/fetch';
import {
  ReferencedImagesQuery,
  type ReferencedImagesQueryResponse,
} from '../queries';
import type { EventResult } from '../types';

const BATCH_SIZE = 1000;
const WARN_MANY_DELETED = 100;

/**
 * Deletes assets that are not referenced in the database (attribute_values).
 */
export async function pruneImages(): Promise<
  EventResult<{ processed: number; deleted: string[] }>
> {
  let queryArgs: GetFilesOptions = {
    fields: 'items(name),nextPageToken',
    autoPaginate: false,
    maxResults: BATCH_SIZE,
    softDeleted: false,
  };

  let deleted: string[] = [];
  let processed = 0;

  // process file references in batches (paginated)
  while (queryArgs) {
    const [files, argsForNextPage] = await getFiles(queryArgs);
    const d = await deleteNonReferenced(files.map((f) => f.name));
    deleted = deleted.concat(d);
    processed += files.length;

    queryArgs = argsForNextPage;
  }

  if (deleted.length > WARN_MANY_DELETED) {
    console.warn(
      `PruneImages: Deleted ${deleted.length} files. Make sure this was intentional. Files can be restored for a limited time (soft deleted).`,
    );
  }

  return { response: { processed, deleted } };
}

function getDbFileReference(fileName: string) {
  const match = fileName.match(FILE_NAME_REGEX);
  if (!match) {
    console.warn('Ignoring file. File name does not match regex:', fileName);
    return null;
  }
  return `${match[1]}.${match[2]}`;
}

async function deleteNonReferenced(fileNames: string[]) {
  const files = fileNames
    .map((f) => ({
      name: f,
      reference: getDbFileReference(f),
    }))
    .filter((f) => f.reference);

  // unique references
  const references = Array.from(new Set(files.map((f) => f.reference)));

  // get references from db
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

  const referenced = (
    data.data as ReferencedImagesQueryResponse
  ).attribution_values.map((i) => i.photo_note || i.text_value);

  const notReferenced = files.filter((f) => !referenced.includes(f.reference));

  // delete files
  let deleted: string[] = [];
  for (const f of notReferenced) {
    try {
      await deleteFile(f.name);
      deleted.push(f.name);
    } catch (e) {
      throw new ErrorWithStatus(
        500,
        `Error deleting file: ${f.name}\nOriginal error: ${e}`,
      );
    }
  }

  return deleted;
}
