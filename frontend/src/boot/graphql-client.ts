import { boot } from 'quasar/wrappers';
import urql, { cacheExchange, fetchExchange } from '@urql/vue';
import { retryExchange } from '@urql/exchange-retry';
import { requestPolicyExchange } from '@urql/exchange-request-policy';

export default boot(({ app }) => {
  const url = process.env.HASURA_GRAPHQL_URL;

  if (!url) {
    throw new Error('Missing or empty environment variable HASURA_GRAPHQL_URL');
  }

  const retryOptions = {
    initialDelayMs: 50,
    randomDelay: false,
  };

  app.use(urql, {
    url,
    exchanges: [
      requestPolicyExchange({
        ttl: 15 * 60 * 1000, // 15 minutes -- in the field, internet may be slow
      }),
      cacheExchange,
      retryExchange(retryOptions),
      fetchExchange,
    ],
    fetchOptions: {
      headers: {
        // TODO: implement proper authentication
        'x-hasura-admin-secret': 'changeForProduction',
      },
    },
  });
});
