import 'dotenv/config';

if (!process.env.HASURA_GRAPHQL_URL) {
  throw new Error('HASURA_GRAPHQL_URL is not set');
}
if (!process.env.HASURA_GRAPHQL_ADMIN_SECRET) {
  throw new Error('HASURA_GRAPHQL_ADMIN_SECRET is not set');
}
if (!process.env.CLOUD_FUNCTION_SECRET) {
  throw new Error('CLOUD_FUNCTION_SECRET is not set');
}
if (!process.env.CLOUD_FUNCTION_URL) {
  throw new Error('CLOUD_FUNCTION_URL is not set');
}
if (!process.env.PASSWORD_RESET_SECRET) {
  throw new Error('PASSWORD_RESET_SECRET is not set');
}
if (!process.env.PASSWORD_RESET_URL) {
  throw new Error('PASSWORD_RESET_URL is not set');
}
if (!process.env.EMAIL_HOST) {
  throw new Error('EMAIL_HOST is not set');
}
if (!process.env.EMAIL_PORT) {
  throw new Error('EMAIL_PORT is not set');
}
if (!process.env.EMAIL_SECURE) {
  throw new Error('EMAIL_SECURE is not set');
}
if (!process.env.EMAIL_USER) {
  throw new Error('EMAIL_USER is not set');
}
if (!process.env.EMAIL_PASS) {
  throw new Error('EMAIL_PASS is not set');
}
if (!process.env.EMAIL_FROM) {
  throw new Error('EMAIL_FROM is not set');
}

export const config = {
  HASURA_GRAPHQL_URL: process.env.HASURA_GRAPHQL_URL,
  HASURA_GRAPHQL_ADMIN_SECRET: process.env.HASURA_GRAPHQL_ADMIN_SECRET,
  CLOUD_FUNCTION_SECRET: process.env.CLOUD_FUNCTION_SECRET,
  CLOUD_FUNCTION_URL: process.env.CLOUD_FUNCTION_URL,
  PASSWORD_RESET_SECRET: process.env.PASSWORD_RESET_SECRET,
  PASSWORD_RESET_URL: process.env.PASSWORD_RESET_URL,
  NODE_ENV: process.env.NODE_ENV || 'production',
  LOG_REQUESTS: process.env.LOG_REQUESTS === 'true',
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO ?? process.env.EMAIL_FROM,
};
