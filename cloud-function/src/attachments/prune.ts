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

async function getReferenced(fileNames: string[]) {
  const data = await fetchGraphQL({
    query: ReferencedAttachmentsQuery,
    variables: { attachments: fileNames },
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
  storagePrefix: ATTACHMENT_STORAGE_PREFIX,
  fileNameRegex: ATTACHMENT_FILE_NAME_REGEX,
  getReferenced,
};
