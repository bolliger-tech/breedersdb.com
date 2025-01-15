const labelTemplate = import.meta.env.VITE_LABEL_TEMPLATE;

function getTemplate() {
  if (!labelTemplate) return;
  if (typeof labelTemplate !== 'string') {
    console.error('Invalid label template');
    return;
  }
  return labelTemplate;
}

export function makeLabel({ code, desc }: { code: string; desc: string }) {
  return getTemplate()?.replaceAll('{code}', code).replaceAll('{desc}', desc);
}

export function hasTemplate() {
  return !!getTemplate();
}
