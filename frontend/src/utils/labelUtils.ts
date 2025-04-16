const qrTemplate = import.meta.env.VITE_LABEL_TEMPLATE_QR;
const textTemplate = import.meta.env.VITE_LABEL_TEMPLATE_TEXT;

function getTemplate(type: 'qr' | 'text') {
  const labelTemplate = type === 'qr' ? qrTemplate : textTemplate;
  if (!labelTemplate) return;
  if (typeof labelTemplate !== 'string') {
    console.error('Invalid label template');
    return;
  }
  return labelTemplate;
}

export function makeQrLabel({ code, desc }: { code: string; desc: string }) {
  return getTemplate('qr')
    ?.replaceAll('{code}', code)
    .replaceAll('{desc}', desc);
}

export function makeTextLabel({
  text,
  caption = '',
}: {
  text: string;
  caption?: string;
}) {
  return getTemplate('text')
    ?.replaceAll('{text}', text)
    .replaceAll('{caption}', caption);
}

export function hasQrTemplate() {
  return !!getTemplate('qr');
}

export function hasTextTemplate() {
  return !!getTemplate('text');
}
