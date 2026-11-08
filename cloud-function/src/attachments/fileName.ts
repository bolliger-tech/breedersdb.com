export const ATTACHMENT_STORAGE_PREFIX = 'attachments/';

// must correspond to the check in sanitize_and_validate_attribution_value()
export const ATTACHMENT_FILE_NAME_REGEX =
  /^[0-9a-f]{64}(?:\.([a-z0-9]{1,10}))?$/;

const EXTENSION_REGEX = /^[a-z0-9]{1,10}$/;

export function parseExtension(clientFileName: string | undefined) {
  const parts = clientFileName?.split('.') ?? [];
  if (parts.length < 2 || !parts[0]) {
    return undefined;
  }
  const ext = parts.pop()!.toLowerCase();
  return EXTENSION_REGEX.test(ext) ? ext : undefined;
}
