import { describe, it, expect } from 'vitest';
import { defineComponent } from 'vue';
import { makeSubject } from 'wonka';
import { mount, type MockQuery } from 'src/utils/testHelpers';
import { useIsUnique } from './useIsUnique';

type Orchards = { orchards: { id: number }[] };

// A urql mock that hands back one controllable subject per query, so the test
// decides when - and in which order - the responses arrive.
function makeQueryMock() {
  const pending: { name: unknown; respond: (ids: number[]) => void }[] = [];

  const executeQuery: MockQuery<Orchards> = (request) => {
    const subject = makeSubject<{ data: Orchards }>();
    const where = request.variables as { where: { name: { _eq: unknown } } };
    pending.push({
      name: where.where.name._eq,
      respond: (ids) => {
        subject.next({ data: { orchards: ids.map((id) => ({ id })) } });
        subject.complete();
      },
    });
    return subject.source;
  };

  return { executeQuery, pending };
}

function mountIsUnique(executeQuery: MockQuery<Orchards>) {
  const wrapper = mount(
    defineComponent({
      template: '<div />',
      setup: () => useIsUnique({ tableName: 'orchards', existingId: 1 }),
    }),
    { urqlMock: { executeQuery } },
  );
  const { isUnique } = wrapper.vm as unknown as ReturnType<typeof useIsUnique>;
  return { wrapper, isUnique };
}

// Fail loudly instead of sitting on the default test timeout: the bug under
// test is a promise that never settles.
function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} never resolved`)), 500),
    ),
  ]);
}

// isUnique() dispatches its query asynchronously; give it time to show up.
async function waitForQueries(
  pending: ReturnType<typeof makeQueryMock>['pending'],
  count: number,
) {
  for (let i = 0; i < 50 && pending.length < count; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  expect(pending).toHaveLength(count);
}

// Answer every open query for the name it actually asked for, so a call that
// queried the wrong term shows up as a wrong return value.
function respondAll(pending: ReturnType<typeof makeQueryMock>['pending']) {
  for (const query of pending) {
    query.respond(query.name === 'taken' ? [2] : []);
  }
}

describe('useIsUnique', () => {
  it('resolves sequential calls', async () => {
    const { executeQuery, pending } = makeQueryMock();
    const { isUnique } = mountIsUnique(executeQuery);

    const free = isUnique('free');
    await waitForQueries(pending, 1);
    respondAll(pending);
    expect(await withTimeout(free, 'first call')).toBe(true);

    const taken = isUnique('taken');
    await waitForQueries(pending, 2);
    respondAll(pending);
    expect(await withTimeout(taken, 'second call')).toBe(false);
  });

  it('resolves calls started in the same tick', async () => {
    const { executeQuery, pending } = makeQueryMock();
    const { isUnique } = mountIsUnique(executeQuery);

    const first = isUnique('taken');
    const second = isUnique('free');
    await waitForQueries(pending, 2);
    respondAll(pending);

    expect(await withTimeout(first, 'first call')).toBe(false);
    expect(await withTimeout(second, 'second call')).toBe(true);
  });

  it('resolves a call that is still in flight when the next one starts', async () => {
    const { executeQuery, pending } = makeQueryMock();
    const { isUnique } = mountIsUnique(executeQuery);

    // the debounced input rule has already dispatched its query when the user
    // hits save, which validates the form again
    const first = isUnique('taken');
    await waitForQueries(pending, 1);
    const second = isUnique('free');
    await waitForQueries(pending, 2);
    respondAll(pending);

    expect(await withTimeout(first, 'first call')).toBe(false);
    expect(await withTimeout(second, 'second call')).toBe(true);
  });

  it('resolves a call that is in flight when the scope is torn down', async () => {
    const { executeQuery, pending } = makeQueryMock();
    const { wrapper, isUnique } = mountIsUnique(executeQuery);

    // the modal goes away while save is validating: the query is cancelled,
    // so no response will ever arrive
    const check = isUnique('taken');
    await waitForQueries(pending, 1);
    wrapper.unmount();

    expect(await withTimeout(check, 'call')).toBe(true);
  });

  it('reports the row being edited as unique', async () => {
    const { executeQuery, pending } = makeQueryMock();
    const { isUnique } = mountIsUnique(executeQuery);

    const own = isUnique('own name');
    await waitForQueries(pending, 1);
    pending[0]!.respond([1]);
    expect(await withTimeout(own, 'call')).toBe(true);
  });
});
