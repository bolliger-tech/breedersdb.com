const labelTemplate = import.meta.env.VITE_LABEL_TEMPLATE;

export function makeLabel({ code, desc }: { code: string; desc: string }) {
  if (!labelTemplate) return;
  if (typeof labelTemplate !== 'string') {
    console.error('Invalid label template');
    return;
  }
  return labelTemplate.replaceAll('{code}', code).replaceAll('{desc}', desc);
}
