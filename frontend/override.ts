import path from 'node:path';
import { existsSync } from 'node:fs';
import type { Alias, AliasOptions } from 'vite';
import { fileURLToPath } from 'node:url';
import type { UserConfig } from './node_modules/@quasar/app-vite/node_modules/vite/dist/node/index';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function getClientId() {
  const raw = process.env.VITE_CLIENT_ID?.trim();
  if (!raw) return null;
  return /^[A-Za-z0-9]+$/.test(raw) ? raw : null;
}

function resolveFromRoot(...segments: string[]) {
  return path.resolve(rootDir, ...segments);
}

function collectOverrideAliases(clientId: string | null): Alias[] {
  if (!clientId) return [];

  const candidates = [
    {
      find: 'src/components/Plant/PlantPicker.vue',
      override: `overrides/${clientId}/components/Plant/PlantPicker.vue`,
    },
  ];

  return candidates.flatMap(({ find, override }) => {
    const absOverride = resolveFromRoot(override);
    return existsSync(absOverride)
      ? [{ find, replacement: absOverride } satisfies Alias]
      : [];
  });
}

function isAliasObject(value: unknown): value is Alias {
  return (
    typeof value === 'object' &&
    value !== null &&
    'find' in value &&
    'replacement' in (value as Record<string, unknown>)
  );
}

function normalizeAliases(alias?: AliasOptions): Alias[] {
  if (!alias) return [];
  if (Array.isArray(alias)) return alias.map((a) => ({ ...a }));
  if (isAliasObject(alias)) return [{ ...alias }];
  return Object.entries(alias as Record<string, string>).map(
    ([find, replacement]) => ({ find, replacement }),
  );
}

function overrideAliasesInViteConfig(viteConf: UserConfig): UserConfig {
  const clientId = getClientId();
  const overrideAliases = collectOverrideAliases(clientId);

  if (!overrideAliases.length) return viteConf;

  const normalizedAlias = normalizeAliases(viteConf.resolve?.alias);

  // Override-specific aliases must come before broad ones (like "src")
  const alias: AliasOptions = [...overrideAliases, ...normalizedAlias];

  viteConf.resolve = {
    ...viteConf.resolve,
    alias,
  };

  return viteConf;
}

export { overrideAliasesInViteConfig };
