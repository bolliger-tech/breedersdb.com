import { boot } from 'quasar/wrappers';
import urql, {
  cacheExchange,
  Client,
  fetchExchange,
  mapExchange,
  type MapExchangeOpts,
} from '@urql/vue';
import { retryExchange } from '@urql/exchange-retry';
import { requestPolicyExchange } from '@urql/exchange-request-policy';
import { LoadingBar } from 'quasar';

function startLoadingBar() {
  LoadingBar.start();
}

function stopLoadingBar() {
  // for some very strange reason we must sometimes call stop multiple times
  // to actually stop the loading bar. so this is a very dirty hack to solve
  // that.
  const timeout = Date.now() + 100; // 100ms
  while (LoadingBar.isActive && Date.now() < timeout) {
    LoadingBar.stop();
  }
}

export function createUrqlClient() {
  const url = process.env.HASURA_GRAPHQL_URL;

  if (!url) {
    throw new Error('Missing or empty environment variable HASURA_GRAPHQL_URL');
  }

  const retryOptions = {
    initialDelayMs: 50,
    randomDelay: false,
  };

  const loadingBarTriggers: MapExchangeOpts = {
    onOperation: (operation) => {
      if (['query', 'mutation'].includes(operation.kind)) {
        startLoadingBar();
      }
    },
    onResult: () => {
      stopLoadingBar();
    },
    onError: () => {
      stopLoadingBar();
    },
  };

  return new Client({
    url,
    exchanges: [
      requestPolicyExchange({
        ttl: 15 * 60 * 1000, // 15 minutes -- in the field, internet may be slow
      }),
      cacheExchange,
      retryExchange(retryOptions),
      mapExchange(loadingBarTriggers),
      fetchExchange,
    ],
    fetchOptions: {
      headers: {
        // TODO: implement proper authentication
        'x-hasura-admin-secret': 'changeForProduction',
      },
    },
  });
}

export default boot(({ app }) => {
  app.use(urql, createUrqlClient());
});
