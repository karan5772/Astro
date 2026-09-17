/**
 * Lets the scripts in this directory import application modules directly.
 *
 * Application code uses extensionless imports and the `@/` alias, both of
 * which the Next bundler resolves but bare Node does not. This hook fills that
 * gap so a migration can reuse the exact same code the server runs, rather
 * than a re-implementation that can drift away from it.
 *
 * Registered via scripts/_register.mjs; see any script's header for usage.
 */
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

export async function resolve(specifier, context, next) {
  let spec = specifier;

  if (spec.startsWith('@/')) {
    spec = pathToFileURL(path.join(ROOT, 'src', spec.slice(2))).href;
  }

  try {
    return await next(spec, context);
  } catch (err) {
    const base = spec.startsWith('file:')
      ? new URL(spec)
      : context.parentURL
        ? new URL(spec, context.parentURL)
        : null;
    if (!base) throw err;

    for (const ext of ['.ts', '.tsx', '/index.ts']) {
      const candidate = new URL(base.href + ext);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    throw err;
  }
}
