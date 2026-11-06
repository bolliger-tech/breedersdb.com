import { describe, it, expect } from 'vitest';
import { QFile } from 'quasar';
import AttributionInputAttachment from './AttributionInputAttachment.vue';
import { addQuasarPlugins, mount } from 'src/utils/testHelpers';
import { ATTACHMENT_MAX_SIZE } from 'src/utils/attachmentUtils';

addQuasarPlugins();

describe('AttributionInputAttachment', () => {
  it('clears a previously selected file when a too large one is picked', async () => {
    const valid = new File(['x'], 'report.pdf');
    const tooLarge = new File(
      [new Uint8Array(ATTACHMENT_MAX_SIZE + 1)],
      'huge.bin',
    );
    const wrapper = mount(AttributionInputAttachment, {
      props: { modelValue: valid, attributeName: 'Lab report' },
    });

    wrapper.getComponent(QFile).vm.$emit('update:modelValue', tooLarge);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
    expect(wrapper.text()).toContain('The file is larger than 10 MB.');
  });
});
