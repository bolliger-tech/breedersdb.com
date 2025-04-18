import {
  InsertLoggedActionMutation,
  LoggedActionsQuery,
  type LoggedActionsQueryResponse,
} from '../queries';
import { fetchGraphQL } from './fetch';

export async function rateLimited({
  name,
  subject,
  context,
  limits,
}: {
  name: string;
  subject: string;
  context: any;
  limits: Array<{ intervalMs: number; maxCalls: number }>;
}) {
  const now = Date.now();

  const longestInterval = limits.reduce(
    (acc, cur) => Math.max(acc, cur.intervalMs),
    0,
  );

  const data = await fetchGraphQL({
    query: LoggedActionsQuery,
    variables: {
      name,
      subject,
      after: new Date(now - longestInterval),
    },
  });

  if (data.errors) {
    throw new Error(`Failed to query logged_actions: ${data.errors}`);
  }

  const actions = data.data?.logged_actions as
    | LoggedActionsQueryResponse['logged_actions']
    | undefined;

  if (!actions) {
    // this should never happen
    throw new Error(`Failed to query logged_actions: Empty response`);
  }

  const exceedsAnyLimit = limits.some((limit) => {
    const actionsInInterval = actions.filter(
      (action) => now - new Date(action.created).getTime() < limit.intervalMs,
    );
    return actionsInInterval.length >= limit.maxCalls;
  });

  if (exceedsAnyLimit) {
    return true;
  }

  const insert = await fetchGraphQL({
    query: InsertLoggedActionMutation,
    variables: {
      name,
      subject,
      context,
    },
  });
  if (insert.errors) {
    throw new Error(`Failed to log action: ${insert.errors}`);
  }

  return false;
}
