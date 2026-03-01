import { config } from './config';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(attempt: number): number {
  const jitter = Math.floor(Math.random() * 100);
  return config.FETCH_HASURA_INITIAL_DELAY_MS * Math.pow(2, attempt) + jitter;
}

function shouldRetry(status: number): boolean {
  return [429, 502, 503, 504].includes(status);
}

async function fetchWithRetry(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Promise<Response> {
  for (let attempt = 0; attempt < config.FETCH_HASURA_RETRIES; attempt++) {
    try {
      const response = await fetch(input, init);

      if (!response.ok) {
        if (
          shouldRetry(response.status) &&
          attempt < config.FETCH_HASURA_RETRIES
        ) {
          await wait(getRetryDelayMs(attempt));
          continue;
        }
      }

      return response;
    } catch (err) {
      if (attempt < config.FETCH_HASURA_RETRIES) {
        await wait(getRetryDelayMs(attempt));
      }
    }
  }
  throw new Error(
    `Failed to fetch after ${config.FETCH_HASURA_RETRIES} retries`,
  );
}

export async function fetchGraphQL({
  query,
  variables,
}: {
  query: string;
  variables: any;
}) {
  try {
    const response = await fetchWithRetry(config.HASURA_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'x-hasura-admin-secret': config.HASURA_GRAPHQL_ADMIN_SECRET,
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error(result.errors);
    }

    return result;
  } catch (e) {
    console.error('Error fetching from Hasura:', e);
    return {
      errors: [
        {
          message: 'Error fetching from Hasura',
          details: e instanceof Error ? e.message : String(e),
        },
      ],
    };
  }
}
