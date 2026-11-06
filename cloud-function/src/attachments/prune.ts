import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import { pruneUnreferencedFiles, type PruneConfig } from '../lib/prune';
import {
  ReferencedAttachmentsQuery,
  type ReferencedAttachmentsQueryResponse,
} from '../queries';
import {
  ATTACHMENT_FILE_NAME_REGEX,
  ATTACHMENT_STORAGE_PREFIX,
} from './fileName';

/**
 * Deletes attachments that are not referenced in the database (attribute_values).
 */
export function pruneAttachments() {
  return pruneUnreferencedFiles(attachmentPruneConfig);
}

function getDbFileReference(fileName: string) {
  const reference = fileName.slice(ATTACHMENT_STORAGE_PREFIX.length);
  if (!ATTACHMENT_FILE_NAME_REGEX.test(reference)) {
    console.warn('Ignoring file. File name does not match regex:', fileName);
    return null;
  }
  return reference;
}

async function getReferenced(references: string[]) {
  const data = await fetchGraphQL({
    query: ReferencedAttachmentsQuery,
    variables: { attachments: references },
  });

  if (data.errors) {
    const firstError = data.errors[0];
    throw new ErrorWithStatus(
      500,
      `ReferencedAttachmentsQuery failed: ${firstError.message}`,
    );
  }

  return (
    data.data as ReferencedAttachmentsQueryResponse
  ).attribution_values.map((i) => i.text_value);
}

export const attachmentPruneConfig: PruneConfig = {
  name: 'PruneAttachments',
  listOptions: { prefix: ATTACHMENT_STORAGE_PREFIX },
  getDbFileReference,
  getReferenced,
};
