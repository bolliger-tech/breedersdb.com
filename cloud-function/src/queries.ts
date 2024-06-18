export const InsertUserMutation = /* GraphQL */ `
  mutation InsertUserMutation($user_object: users_insert_input!) {
    insert_users_one(object: $user_object) {
      email
      locale
      password_hash
      id
      signin_attempts
      created
      last_login
      modified
    }
  }
`;

export const UserQuery = /* GraphQL */ `
  query UserQuery($email: citext) {
    users(where: { email: { _eq: $email } }) {
      id
      email
      password_hash
      signin_attempts
      last_login
    }
  }
`;

export const InsertUserTokenMutations = /* GraphQL */ `
  mutation InsertUserTokenMutations(
    $user_id: Int!
    $token_hash: String!
    $type: String!
  ) {
    insert_user_tokens_one(
      object: { user_id: $user_id, token_hash: $token_hash, type: $type }
    ) {
      id
    }
    update_users_by_pk(
      pk_columns: { id: $user_id }
      _set: { last_login: "now()", signin_attempts: 0 }
    ) {
      id
    }
  }
`;

export const IncUserSigninAttemptsMutation = /* GraphQL */ `
  mutation IncUserSigninAttemptsMutation($user_id: Int!) {
    update_users_by_pk(
      pk_columns: { id: $user_id }
      _inc: { signin_attempts: 1 }
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
      token_hash
      user_id
      type
      created
      last_verify
    }
  }
`;

export const ChangePasswordMutation = /* GraphQL */ `
  mutation ChangePasswordMutation($user_id: Int!, $password_hash: String!) {
    update_users_by_pk(
      pk_columns: { id: $user_id }
      _set: { password_hash: $password_hash }
    ) {
      id
    }
  }
`;
