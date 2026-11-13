export const IMAGE_STORAGE_PREFIX = 'images/';

// must correspond to the PHOTO check in sanitize_and_validate_attribution_value()
// the legacy photos have a 32 character filename, the new ones have 64
export const IMAGE_FILE_NAME_REGEX = /^(\w{32}|\w{64})\.(jpe?g|avif)$/;
