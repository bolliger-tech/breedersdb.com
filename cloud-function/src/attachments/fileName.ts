export const ATTACHMENT_STORAGE_PREFIX = 'attachments/';

// must correspond to the check in sanitize_and_validate_attribution_value()
export const EXTENSION_PATTERN = '[a-z0-9]{1,10}';

export const ATTACHMENT_FILE_NAME_REGEX = new RegExp(
  `^[0-9a-f]{64}(?:\\.(${EXTENSION_PATTERN}))?$`,
);

const EXTENSION_REGEX = new RegExp(`^${EXTENSION_PATTERN}$`);

export function parseExtension(clientFileName: string | undefined) {
  const parts = clientFileName?.split('.') ?? [];
  if (parts.length < 2 || !parts[0]) {
    return undefined;
  }
  const ext = parts.pop()!.toLowerCase();
  return EXTENSION_REGEX.test(ext) ? ext : undefined;
}
