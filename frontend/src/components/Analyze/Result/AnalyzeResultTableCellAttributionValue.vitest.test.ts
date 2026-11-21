import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouterLinkStub } from '@vue/test-utils';
import AnalyzeResultTableCellAttributionValue from './AnalyzeResultTableCellAttributionValue.vue';
import AttributionAttachmentLink from 'src/components/Attribution/AttributionAttachmentLink.vue';
import { addQuasarPlugins, mount } from 'src/utils/testHelpers';
import {
  attachmentAttribution,
  attachmentFileName,
} from './attributionFixture.vitest';

addQuasarPlugins();
// the mount helper installs no router
const stubs = { RouterLink: RouterLinkStub };

describe('AnalyzeResultTableCellAttributionValue', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ORG_ABBREVIATION', 'POC');
    return () => vi.unstubAllEnvs();
  });

  it('labels a photo as photo', () => {
    const wrapper = mount(AnalyzeResultTableCellAttributionValue, {
      stubs,
      props: { attribution: { ...attachmentAttribution, data_type: 'PHOTO' } },
    });

    expect(wrapper.text()).toContain('Photo');
    expect(wrapper.findComponent(AttributionAttachmentLink).exists()).toBe(
      false,
    );
  });

  it('links an attachment under its download file name', () => {
    const wrapper = mount(AnalyzeResultTableCellAttributionValue, {
      stubs,
      props: { attribution: attachmentAttribution },
    });

    const href = wrapper
      .findComponent(AttributionAttachmentLink)
      .find('a')
      .attributes('href');
    expect(href).toBe(
      `/api/assets/attachments/bdb-POC_Lab-report_00123_2026-11-06_1.pdf?file=${attachmentFileName}`,
    );
    expect(wrapper.text()).not.toContain('Photo');
  });
});
