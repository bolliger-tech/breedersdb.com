export const InsertUserMutation = /* GraphQL */ `
  mutation InsertUserMutation($email: citext, $password_hash: String) {
    insert_users_one(object: { email: $email, password_hash: $password_hash }) {
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

export const InsertUserTokenMutation = /* GraphQL */ `
  mutation InsertUserTokenMutation(
    $user_id: Int
    $token: String!
    $type: String!
  ) {
    insert_user_tokens_one(
      object: { user_id: $user_id, token: $token, type: $type }
    ) {
      id
    }
  }
`;

export const DeleteUserTokenMutation = /* GraphQL */ `
  mutation DeleteUserTokenMutation($token: String!) {
    delete_user_tokens(where: { token: { _eq: $token } }) {
      affected_rows
    }
  }
`;

export const UserTokenQuery = /* GraphQL */ `
  query UserTokenQuery($token: String!) {
    user_tokens(where: { token: { _eq: $token } }) {
      user_id
      type
      created
      last_verify
    }
  }
`;
