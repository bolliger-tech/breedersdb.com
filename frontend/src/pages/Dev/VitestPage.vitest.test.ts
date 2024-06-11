import { describe, it, beforeEach, expect } from 'vitest';
import VitestPage from './VitestPage.vue';
import { setActivePinia, createPinia } from 'pinia';
import {
  mountAsync,
  urqlResp,
  addQuasarPlugins,
  mockQuery,
} from 'src/utils/testHelpers';
import { flushPromises } from '@vue/test-utils';

addQuasarPlugins();

describe('VitestPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should mount with api data', async () => {
    const wrapper = await mountAsync(VitestPage, {
      executeQuery: urqlResp('hello tester'),
    });

    expect(wrapper.get('[data-test="query-resp"]').text()).toBe('hello tester');
  });

  it('should show state', async () => {
    const wrapper = await mountAsync(VitestPage, {
      executeQuery: urqlResp(null),
    });

    expect(wrapper.get('[data-test="state"]').text()).toBe('cultivars');
  });

  it('should show translate keyed strings', async () => {
    const wrapper = await mountAsync(VitestPage, {
      executeQuery: urqlResp(null),
    });

    expect(wrapper.get('[data-test="i18n"]').text()).toBe('Crossings');
  });

  it('should change message on button click', async () => {
    const wrapper = await mountAsync(VitestPage, {
      executeQuery: urqlResp('hello tester'),
    });

    mockQuery(wrapper, urqlResp('Another message'));
    const button = wrapper.get('[data-test="change-message"]');
    await button.trigger('click');

    await flushPromises();

    expect(wrapper.get('[data-test="query-resp"]').text()).toBe(
      'Another message',
    );
  });
});
