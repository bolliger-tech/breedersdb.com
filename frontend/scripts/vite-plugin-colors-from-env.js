export default function injectColorsFromEnv() {
  return {
    name: 'vite-plugin-colors-from-env',
    transform: (code, id) => {
      if (id.endsWith('/src/css/app.scss')) {
        const vars = [
          'PRIMARY_COLOR_HUE',
          'PRIMARY_COLOR_SATURATION',
          'PRIMARY_COLOR_LIGHTNESS',
          'SECONDARY_COLOR_HUE',
          'SECONDARY_COLOR_SATURATION',
          'SECONDARY_COLOR_LIGHTNESS',
          'ACCENT_COLOR_HUE',
          'ACCENT_COLOR_SATURATION',
          'ACCENT_COLOR_LIGHTNESS',
        ];

        const cssVars = vars
          .map((name) => ({
            name,
            value: process.env[`VITE_${name}`],
          }))
          .filter((v) => v.value !== undefined)
          .map(({ name, value }) => {
            const k = `--bdb-${name.toLowerCase().replace(/_/g, '-')}`;
            const v = value + (name.endsWith('HUE') ? '' : '%');
            return `${k}: ${v};`;
          });

        return code.replace(
          'COLOR-MAGIC-PLACEHOLDER',
          `:root {${cssVars.join('')}}`,
        );
      }
      return code;
    },
  };
}
