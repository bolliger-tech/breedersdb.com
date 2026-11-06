import { deleteFile, getFiles } from './storage';
import type { GetFilesOptions } from '@google-cloud/storage';
import { ErrorWithStatus } from './errors';

const BATCH_SIZE = 1000;
const WARN_MANY_DELETED = 100;

/**
 * Deletes files that are not referenced in the database (attribute_values).
 */
export async function pruneUnreferencedFiles({
  name,
  listOptions,
  getDbFileReference,
  getReferenced,
}: {
  name: string;
  // narrows down the listed files
  listOptions: GetFilesOptions;
  // maps a file name in the bucket to the value stored in the db, or null to ignore the file
  getDbFileReference: (fileName: string) => string | null;
  // returns the given references that are used in the db
  getReferenced: (references: string[]) => Promise<string[]>;
}) {
  let queryArgs: GetFilesOptions = {
    ...listOptions,
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
    const d = await deleteNonReferenced(
      files.map((f) => f.name),
      getDbFileReference,
      getReferenced,
    );
    deleted = deleted.concat(d);
    processed += files.length;

    queryArgs = argsForNextPage;
  }

  if (deleted.length > WARN_MANY_DELETED) {
    console.warn(
      `${name}: Deleted ${deleted.length} files. Make sure this was intentional. Files can be restored for a limited time (soft deleted).`,
    );
  }

  return { processed, deleted };
}

async function deleteNonReferenced(
  fileNames: string[],
  getDbFileReference: (fileName: string) => string | null,
  getReferenced: (references: string[]) => Promise<string[]>,
) {
  const files = fileNames
    .map((f) => ({
      name: f,
      reference: getDbFileReference(f),
    }))
    .filter((f) => f.reference);

  // unique references
  const references = Array.from(
    new Set(files.map((f) => f.reference as string)),
  );

  const referenced = await getReferenced(references);

  const notReferenced = files.filter((f) => !referenced.includes(f.reference!));

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
