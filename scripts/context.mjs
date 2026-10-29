import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { groupByCause, uniqueById } from '../src/lib/kb/causes.ts';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

export function context() {
  const raw = readJson('src/lib/data/reports-4471.json');
  const tenants = fs.readdirSync(path.join(root, 'src/lib/data/tenants'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => readJson(`src/lib/data/tenants/${file}`));
  const tenantOf = (r) => tenants.find((t) => t.handle === r.tenant);
  const reports = uniqueById(raw).filter((r) => r.mergedInto === 4471);
  return { raw, reports, tenants, tenantOf, groups: groupByCause(reports, tenantOf) };
}
