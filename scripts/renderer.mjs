import path from 'node:path';
import { compile, preprocess } from 'svelte/compiler';
import { render } from 'svelte/server';
import { mdsvex } from 'mdsvex';
import { createServer } from 'vite';
import { root } from './context.mjs';

export function config() {
  const markdown = mdsvex({
    extensions: ['.svx'],
    layout: { runbook: path.join(root, 'src/lib/layouts/runbook.svelte') },
  });
  return {
    configFile: false,
    root,
    logLevel: 'error',
    resolve: { alias: { '#lib': path.join(root, 'src/lib') } },
    plugins: [{
      name: 'kb-svelte',
      async transform(source, id, options) {
        if (!/\.(svelte|svx)$/.test(id)) return;
        const prepared = id.endsWith('.svx')
          ? (await preprocess(source, markdown, { filename: id })).code
          : source;
        const result = compile(prepared, {
          filename: id,
          generate: options?.ssr ? 'server' : 'client',
          css: 'injected',
        });
        return { code: result.js.code, map: result.js.map };
      },
    }],
  };
}

export async function renderer() {
  const server = await createServer({ ...config(), server: { middlewareMode: true } });
  return {
    async page(route) {
      const mod = await server.ssrLoadModule(`/src/routes${route}/+page.svx`);
      const result = render(mod.default);
      return { body: result.body, head: result.head, metadata: mod.metadata };
    },
    close: () => server.close(),
  };
}
