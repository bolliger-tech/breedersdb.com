export const personalAccessTokens = {
  title: 'Personal Access Token | Personal Access Tokens',
  searchPlaceholder: 'Search by name',

  fields: {
    expires: 'Expires',
    lastVerify: 'Last verify',
    token: 'Token',
  },

  expiresHint: 'Leave empty for indefinite validity.',

  visibility: {
    own: 'Only you can see your tokens.',
    others:
      'You can not see tokens of other users. They are only visible to their owner.',
  },

  created: {
    title: 'Personal Access Token Created',
    message:
      "Make sure to copy your new personal access token now. You won't be able to see it again!",
    tokenCopied: 'Personal access token copied to clipboard.',
    tokenCopyFailed: 'Failed to copy personal access token.',
    validUntilDate: 'Valid until deleted, at most until {date}',
    validUntilDeleted: 'Valid until deleted',
  },
};
