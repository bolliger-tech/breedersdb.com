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

  const deleted: string[] = [];
  let processed = 0;

  // process file references in batches (paginated)
  while (queryArgs) {
    // with `fields` set, the items are plain objects instead of File instances
    const [files, argsForNextPage] = (await storage.getFiles(queryArgs)) as [
      ListedFile[],
      GetFilesOptions,
    ];
    const createdBefore = Date.now() - GRACE_PERIOD_MS;
    // the listing is limited to the prefix, so the rest is the db reference
    const references = files
      .filter((f) => Date.parse(f.timeCreated) < createdBefore)
      .map((f) => f.name.slice(storagePrefix.length))
      .filter((reference) => {
        if (fileNameRegex.test(reference)) return true;
        console.warn(
          'Ignoring file. File name does not match regex:',
          storagePrefix + reference,
        );
        return false;
      });

    const referenced = new Set(
      references.length ? await getReferenced(references) : [],
    );

    for (const reference of references) {
      if (referenced.has(reference)) continue;
      const fileName = storagePrefix + reference;
      try {
        await storage.deleteFile(fileName);
        deleted.push(fileName);
      } catch (e) {
        throw new ErrorWithStatus(
          500,
          `Error deleting file: ${fileName}\nOriginal error: ${e}`,
        );
      }
    }
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
