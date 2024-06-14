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
