import { mount as VTUmount, type VueWrapper } from '@vue/test-utils';
import { vi } from 'vitest';
import { never, fromValue, type Source } from 'wonka';
import { defineComponent, type Component } from 'vue';
import { i18n } from 'src/boot/i18n';
import urql, {
  Client,
  CombinedError,
  type AnyVariables,
  type GraphQLRequest,
  type OperationContext,
} from '@urql/vue';
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { LocalStorage, SessionStorage } from 'quasar';

export type AsyncComponentWrapper = Omit<VueWrapper, 'exists'>;

export async function mountAsync(
  AsyncComponent: Component,
  urqlMock?: Parameters<typeof createUrqlMockClient>[0],
): Promise<AsyncComponentWrapper> {
  const TestComponent = defineComponent({
    components: { AsyncComponent },
    template: '<Suspense><AsyncComponent/></Suspense>',
  });

  const asyncWrapper = mount(TestComponent, urqlMock);
  await waitUntilMounted(asyncWrapper, AsyncComponent);
  return asyncWrapper.getComponent(AsyncComponent);
}

export function mount(
  Component: Component,
  urqlMock?: Parameters<typeof createUrqlMockClient>[0],
) {
  return VTUmount(Component, {
    global: {
      plugins: [i18n, [urql, createUrqlMockClient(urqlMock)]],
    },
  });
}

export function urqlResp<T = unknown>(data?: T): () => MockFnReturnType<T> {
  if (data instanceof CombinedError) {
    return () => fromValue({ error: data });
  }
  if (typeof data !== 'undefined') {
    return () => fromValue({ data });
  }
  return () => never as Source<never>;
}

type MockFnReturnType<T> = Source<
  | {
      error: CombinedError;
    }
  | {
      data: T;
    }
>;
export type MockQuery<T = unknown> = (
  query: GraphQLRequest,
  opts?: Partial<OperationContext> | undefined,
) => MockFnReturnType<T>;
export type MockMutation<T = unknown, V extends AnyVariables = AnyVariables> = (
  variables: V,
  context?: Partial<OperationContext>,
) => MockFnReturnType<T>;
export type MockSubscription<T = unknown> = (
  opts?: Partial<OperationContext>,
) => MockFnReturnType<T>;

export function mockQuery<T>(
  wrapper: VueWrapper | AsyncComponentWrapper,
  mockFn: MockQuery<T>,
) {
  const client = wrapper.vm.$.appContext.provides.$urql.value;
  client.executeQuery = vi.fn(mockFn);
}

export function mockMutation<T, V extends AnyVariables>(
  wrapper: VueWrapper | AsyncComponentWrapper,
  mockFn: MockMutation<T, V>,
) {
  const client = wrapper.vm.$.appContext.provides.$urql.value;
  client.executeMutation = vi.fn(mockFn);
}

export function mockSubscription<T>(
  wrapper: VueWrapper | AsyncComponentWrapper,
  mockFn: MockSubscription<T>,
) {
  const client = wrapper.vm.$.appContext.provides.$urql.value;
  client.executeSubscription = vi.fn(mockFn);
}

export function addQuasarPlugins() {
  installQuasarPlugin({
    plugins: { LocalStorage, SessionStorage },
  });
}

export function waitPromise(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ugly hack to wait for async components to be loaded.
 *
 * the recommended way would be to use flushPromises(), but it doesn't work
 * in this case for some unknown reason
 */
function waitUntilMounted(wrapper: VueWrapper, Component: Component) {
  return new Promise<void>((resolve) => {
    try {
      wrapper.findComponent(Component).vm;
      resolve();
    } catch {}
    setTimeout(() => waitUntilMounted(wrapper, Component).then(resolve), 10);
  });
}

function createUrqlMockClient<
  Q = unknown,
  M = unknown,
  S = unknown,
  V extends AnyVariables = AnyVariables,
>({
  executeQuery,
  executeMutation,
  executeSubscription,
}: {
  executeQuery?: MockQuery<Q>;
  executeMutation?: MockMutation<M, V>;
  executeSubscription?: MockSubscription<S>;
} = {}) {
  const client = new Client({
    url: 'http://test.local/v1/graphql',
    exchanges: [],
  });

  // @ts-expect-error executeQuery would expect an OperationResult, however the
  // docs suggest to return a Source: https://commerce.nearform.com/open-source/urql/docs/advanced/testing/
  client.executeQuery = executeQuery
    ? vi.fn(executeQuery)
    : vi.fn(() => {
        throw new Error(
          'Query executed but no query mock provided. Mock with `() => never` to ignore this error.',
        );
      });
  // @ts-expect-error executeMutation would expect an OperationResult, however the
  // docs suggest to return a Source: https://commerce.nearform.com/open-source/urql/docs/advanced/testing/
  client.executeMutation = executeMutation
    ? vi.fn(executeMutation)
    : vi.fn(() => {
        throw new Error(
          'Mutation executed but no query mock provided. Mock with `() => never` to ignore this error.',
        );
      });
  // @ts-expect-error executeSubscription would expect an OperationResult, however the
  // docs suggest to return a Source: https://commerce.nearform.com/open-source/urql/docs/advanced/testing/
  client.executeSubscription = executeSubscription
    ? vi.fn(executeSubscription)
    : vi.fn(() => {
        throw new Error(
          'Subscription executed but no query mock provided. Mock with `() => never` to ignore this error.',
        );
      });

  return client;
}
