import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import { config, renderer } from './renderer.mjs';
import { root } from './context.mjs';

const result = await build({
  ...config(),
  build: {
    write: false,
    minify: true,
    lib: { entry: path.join(root, 'scripts/client.mjs'), formats: ['es'], fileName: 'kb' },
  },
});
const code = [result].flat().flatMap((bundle) => bundle.output)
  .filter((item) => item.type === 'chunk').map((item) => item.code).join('\n');
const sourceDir = path.join(root, 'src/routes');
const pageFiles = (await fs.readdir(sourceDir, { recursive: true }))
  .filter((file) => file.endsWith('+page.svx'));
const view = await renderer();
try {
  for (const file of pageFiles) {
    const route = '/' + path.dirname(file);
    const page = await view.page(route);
    const html = `<!doctype html>\n<html lang="en" data-route="${route}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${page.head}</head><body><div id="page">${page.body}</div><script type="module">${code.replaceAll('</script', '<\\/script')}</script></body></html>\n`;
    const output = path.join(root, 'rendered', route, 'index.html');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, html);
    console.log(`${route} → ${path.relative(root, output)}`);
  }
} finally {
  await view.close();
}
