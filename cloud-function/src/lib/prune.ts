import { deleteFile, getFiles } from './storage';
import type { GetFilesOptions } from '@google-cloud/storage';
import { ErrorWithStatus } from './errors';

const BATCH_SIZE = 1000;
const WARN_MANY_DELETED = 100;
// uploads happen before the db insert, so recent files may not be referenced yet
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

type ListedFile = { name: string; timeCreated: string };

export type PruneConfig = {
  name: string;
  storagePrefix: string;
  // files not matching are ignored. must match the file names stored in the db.
  fileNameRegex: RegExp;
  // returns the given file names that are used in the db
  getReferenced: (fileNames: string[]) => Promise<string[]>;
};

/**
 * Deletes files that are not referenced in the database (attribute_values).
 */
export async function pruneUnreferencedFiles({
  name,
  storagePrefix,
  fileNameRegex,
  getReferenced,
  storage = { getFiles, deleteFile },
}: PruneConfig & {
  // injectable for tests
  storage?: {
    getFiles: (options: GetFilesOptions) => Promise<[unknown[], ...unknown[]]>;
    deleteFile: (fileName: string) => Promise<unknown>;
  };
}) {
  let queryArgs: GetFilesOptions = {
    prefix: storagePrefix,
    fields: 'items(name,timeCreated),nextPageToken',
    autoPaginate: false,
    maxResults: BATCH_SIZE,
    softDeleted: false,
  };

  let deleted: string[] = [];
  let processed = 0;

  // process file references in batches (paginated)
  while (queryArgs) {
    // with `fields` set, the items are plain objects instead of File instances
    const [files, argsForNextPage] = (await storage.getFiles(queryArgs)) as [
      ListedFile[],
      GetFilesOptions,
    ];
    const createdBefore = Date.now() - GRACE_PERIOD_MS;
    const d = await deleteNonReferenced(
      files
        .filter((f) => Date.parse(f.timeCreated) < createdBefore)
        .map((f) => f.name),
      (fileName) => getDbFileReference(fileName, storagePrefix, fileNameRegex),
      getReferenced,
      storage.deleteFile,
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

// maps a file name in the bucket to the value stored in the db, or null to ignore the file
function getDbFileReference(
  fileName: string,
  storagePrefix: string,
  fileNameRegex: RegExp,
) {
  const reference = fileName.slice(storagePrefix.length);
  if (!fileNameRegex.test(reference)) {
    console.warn('Ignoring file. File name does not match regex:', fileName);
    return null;
  }
  return reference;
}

async function deleteNonReferenced(
  fileNames: string[],
  getDbFileReference: (fileName: string) => string | null,
  getReferenced: (references: string[]) => Promise<string[]>,
  deleteFile: (fileName: string) => Promise<unknown>,
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
