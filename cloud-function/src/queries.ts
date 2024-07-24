const UserFields = /* GraphQL */ `
  id
  email
  locale
  password_hash
  first_failed_signin_attempt
  failed_signin_attempts
  last_signin
  created
  modified
`;

export const InsertUserMutation = /* GraphQL */ `
  mutation InsertUserMutation($user_object: users_insert_input!) {
    insert_users_one(object: $user_object) {
      ${UserFields}
    }
  }
`;

export const UserQueryByEmail = /* GraphQL */ `
  query UserQueryByEmail($email: citext) {
    users(where: { email: { _eq: $email } }) {
      ${UserFields}
    }
  }
`;

export const InsertUserTokenAndResetFailedSigninAttemptsMutations = /* GraphQL */ `
  mutation InsertUserTokenMutations(
    $user_id: Int!
    $token_hash: String!
    $type: String!
  ) {
    insert_user_tokens_one(
      object: {
        user_id: $user_id
        token_hash: $token_hash
        type: $type
        last_verify: "now()"
      }
    ) {
      id
    }
    update_users_by_pk(
      pk_columns: { id: $user_id }
      _set: {
        last_signin: "now()"
        failed_signin_attempts: 0
        first_failed_signin_attempt: null
      }
    ) {
      id
    }
  }
`;

export const RollTokenLastVerifyMutation = /* GraphQL */ `
  mutation RollTokenLastVerifyMutation($token_id: Int!) {
    update_user_tokens_by_pk(
      pk_columns: { id: $token_id }
      _set: { last_verify: "now()" }
    ) {
      id
      user {
        ${UserFields}
      }
    }
  }
`;

export const SetUserSigninAttemptsMutation = /* GraphQL */ `
  mutation SetUserSigninAttemptsMutation(
    $user_id: Int!
    $first_failed_signin_attempt: timestamptz!
    $failed_signin_attempts: Int!
  ) {
    update_users_by_pk(
      pk_columns: { id: $user_id }
      _set: {
        first_failed_signin_attempt: $first_failed_signin_attempt
        failed_signin_attempts: $failed_signin_attempts
      }
    ) {
      id
    }
  }
`;

export const DeleteUserTokenMutation = /* GraphQL */ `
  mutation DeleteUserTokenMutation($token_id: Int!) {
    delete_user_tokens_by_pk(id: $token_id) {
      id
    }
  }
`;

export const UserTokenQuery = /* GraphQL */ `
  query UserTokenQuery($token_id: Int!) {
    user_tokens_by_pk(id: $token_id) {
      id
      token_hash
      user_id
      type
      last_verify
    }
  }
`;

export const ChangePasswordMutation = /* GraphQL */ `
  mutation ChangePasswordMutation($user_id: Int!, $password_hash: String!) {
    update_users_by_pk(
      pk_columns: { id: $user_id }
      _set: {
        password_hash: $password_hash
        failed_signin_attempts: 0
        first_failed_signin_attempt: null
      }
    ) {
      id
    }
  }
`;
