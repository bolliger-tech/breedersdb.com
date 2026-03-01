import { defineBoot } from '#q-app/wrappers';
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

// must match with cloud-function/src/lib/cookies.ts
const FE_COOKIE_NAME = 'breedersdb.user';

/**
 * GraphQL introspection query to wake up the server.
 * This is a lightweight query used to ensure the server is responsive.
 */
const WAKEUP_QUERY = `query IntrospectionQuery {
  __schema {
    types {
      name
    }
  }
}`;

/**
 * Creates a custom fetch function that wakes up the server before sending
 * non-idempotent requests after inactivity.
 *
 * The GraphQL server shuts down
 * after ~15 minutes of inactivity and may fail on the first request after
 * rebooting. This function sends a lightweight introspection query to wake
 * up the server before sending mutations if the last request was more than
 * 5 minutes ago. Queries are not affected since they are idempotent and can
 * be retried by the user if they fail.
 */
function fetchWithWakeUp() {
  let lastRequestTime = Date.now();
  const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  return async (uri: string | URL | Request, options?: RequestInit) => {
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    lastRequestTime = Date.now();

    const requestBody = options?.body;

    // Requests without a string body are no mutations
    if (typeof requestBody !== 'string') {
      return fetch(uri, options);
    }

    const bodyObj = JSON.parse(requestBody);
    const query = bodyObj.query || '';
    const isMutation = query.trim().startsWith('mutation');

    if (!isMutation) {
      return fetch(uri, options);
    }

    // For mutations after 5+ minutes of inactivity, wake up the server first
    if (isMutation && timeSinceLastRequest >= INACTIVITY_THRESHOLD) {
      try {
        await fetch(uri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: WAKEUP_QUERY }),
        });
      } catch (error) {
        console.warn(
          'Wake-up query failed, but proceeding with original request',
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Send the actual request
    return fetch(uri, options);
  };
}

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
  const retryOptions = {
    initialDelayMs: 50,
    randomDelay: false,
    maxNumberAttempts: 5,
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

  const invalidAuthCookieHandler: MapExchangeOpts = {
    onResult: (result) => {
      if (
        result.error?.graphQLErrors[0]?.extensions?.code === 'access-denied'
      ) {
        // our token is invalid, remove fe cookie and reload to trigger router
        document.cookie = `${FE_COOKIE_NAME}=; SameSite=Lax; Max-Age=0; Path=/`;
        window.location.reload();
      }
    },
  };

  return new Client({
    url: '/api/hasura/v1/graphql',
    fetch: fetchWithWakeUp(),
    exchanges: [
      requestPolicyExchange({
        ttl: 15 * 60 * 1000, // 15 minutes -- in the field, internet may be slow
      }),
      cacheExchange,
      retryExchange(retryOptions),
      mapExchange(loadingBarTriggers),
      mapExchange(invalidAuthCookieHandler),
      fetchExchange,
    ],
  });
}

export default defineBoot(({ app }) => {
  app.use(urql, createUrqlClient());
});
