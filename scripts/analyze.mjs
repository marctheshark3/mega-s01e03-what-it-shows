import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { causeOf } from '../src/lib/kb/causes.ts';
import { context, readJson, root } from './context.mjs';

const { raw, reports, tenantOf, groups } = context();
const notes = readJson('src/lib/data/desk-notes.json');
const evidenceDir = path.join(root, 'evidence');
await fs.mkdir(evidenceDir, { recursive: true });
await fs.mkdir(path.join(root, 'tickets'), { recursive: true });

const summary = {
  source: 'MEGA.dev S01E03 kb export, exported 2026-10-04',
  sourceSha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, 'src/lib/data/reports-4471.json'))).digest('hex'),
  rows: raw.length,
  distinctReports: reports.length,
  repeatedRows: raw.length - reports.length,
  intakeDisagreements: reports.filter((r) => r.meta.intakeTag !== causeOf(r, tenantOf(r))).length,
  groups: groups.map(({ reports: rs, ...group }) => ({
    ...group, count: rs.length,
    oneDayReports: rs.filter((r) => notes.oneDayMove.includes(r.id)).map((r) => r.id),
    reportIds: rs.map((r) => r.id),
  })),
};
await fs.writeFile(path.join(evidenceDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');

const csv = (cells) => cells.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',');
const rows = reports.map((r) => csv([
  r.id, r.tenant, tenantOf(r)?.locale, tenantOf(r)?.form, r.channel,
  causeOf(r, tenantOf(r)) ?? 'unplaced', r.meta.intakeTag,
  notes.oneDayMove.includes(r.id), r.receivedAt, r.mergedAt,
]));
await fs.writeFile(path.join(evidenceDir, 'report-classification.csv'), [
  'id,tenant,tenantLocale,form,channel,cause,intakeTag,oneDayNote,receivedAt,mergedAt', ...rows,
].join('\n') + '\n');

const fixes = {
  parser: {
    title: 'Shared date parser treats day-first tenant input as month first',
    mechanism: 'The shared parser reads month first although the tenant writes day first. In the exported desk model, app/email reports and day-first forms without the booking-v3 hint mismatch are assigned to this cause.',
    example: 'R-41200 at harbour.dental (en-GB, booking-v2, app) reports 7 April becoming 4 July. Day-first input 07/04 is consistent with a month-first parser reading 4 July.',
    reproduction: 'For a day-first tenant, submit an unambiguous intended date such as 7 April using its expected 07/04 date order through the shared parser path. Inspect the stored booking and generated invite. Expected: 7 April. Reported behavior: 4 July. This is a reproduction specification from the export, not a test run against product code.',
    acceptance: '- Parse input according to the tenant contract; use explicit date fields or an unambiguous format across boundaries.\n- Validate impossible dates and preserve the intended calendar date through storage and invitation generation.\n- Cover app, email and booking-v2 inputs plus day-first tenant paths on booking-v3 outside its form.\n- Verify independently of the separate form-hint ticket.',
  },
  hint: {
    title: 'booking-v3 date hint says MM/DD/YYYY but the form reads tenant date order',
    mechanism: 'For day-first tenants on booking-v3, the date hint prints MM/DD/YYYY while the form reads dates in the tenant locale. Only the form channel is assigned to this cause; app/email from the same tenants still use the parser path.',
    example: 'R-41230 at copper.studio (es-ES, booking-v3, form) reports a client coming on 1 June instead of 6 January. Following MM/DD/YYYY, 01/06 for 6 January can be read day first as 1 June.',
    reproduction: 'Open booking-v3 for a day-first tenant. Follow its MM/DD/YYYY hint and enter 01/06 for 6 January. Inspect the booking date. Expected: hint and reader agree on 6 January. Reported behavior: 1 June. This is a reproduction specification from the export, not a test run against product code.',
    acceptance: '- Derive the visible hint and input reader from the same locale/date contract.\n- Verify all day-first booking-v3 tenants discovered in the directory, including alder.physio, copper.studio and pale.harbour in this snapshot.\n- Test ambiguous dates, impossible dates and explicit calendar selection.\n- Verify separately from the shared parser fix; changing that parser alone does not repair this form contract.',
  },
};

for (const group of groups) {
  const fix = fixes[group.cause];
  if (!fix) throw new Error(`Unplaced reports require investigation: ${group.cause}`);
  const oneDay = group.reports.filter((r) => notes.oneDayMove.includes(r.id));
  const body = `# ${fix.title}\n\nSource: MEGA.dev S01E03, support desk merged ticket #4471. These reports are from the course dataset.\n\n## Scope\n\n**Reports covered: ${group.reports.length} distinct report IDs.**\n\n${group.tenants} tenants; received ${group.firstSeen} through ${group.lastSeen}.\nIntake tags in this group: ${Object.entries(group.taggedAs).map(([tag, n]) => `${tag}: ${n}`).join('; ')}.\n\n${fix.mechanism}\n\n## Evidence and reproduction\n\n${fix.example}\n\n${fix.reproduction}\n\n## Acceptance criteria\n\n${fix.acceptance}\n\n## Counting and limits\n\nThe export has ${raw.length} rows but ${reports.length} distinct reports in #4471. Overlapping export pages contribute ${raw.length - reports.length} repeated rows. Counts run the supplied uniqueById and groupByCause logic against the tenant directory, rather than trusting browser-based intake tags or subject wording.\n\n${oneDay.length ? `The ${oneDay.length} one-day reports (${oneDay.map((r) => r.id).join(', ')}) remain included in this count because the exported rules place them here. Their actual mechanism is unconfirmed: preserve them for separate reproduction and split a further ticket if warranted. They are not an additional count on top of this ticket.` : 'No desk-noted one-day reports fall in this cause.'}\n\nThe provided product code and runtime are absent. This ticket documents the desk model and reported behavior; it does not claim a reproduced product defect or a verified fix.\n\nThe machine-readable assignment is in evidence/report-classification.csv; evidence/summary.json contains the full membership and source hash. The signed kb page is src/routes/kb/incidents/4471-review/+page.svx, with its rendered counterpart at rendered/kb/incidents/4471-review/index.html.\n\n<details><summary>Report IDs (${group.reports.length})</summary>\n\n${group.reports.map((r) => r.id).join(', ')}\n\n</details>\n`;
  await fs.writeFile(path.join(root, 'tickets', `${group.cause}.md`), body);
}
console.log(JSON.stringify({ rows: summary.rows, reports: summary.distinctReports, groups: summary.groups.map((g) => [g.cause, g.count]), intakeDisagreements: summary.intakeDisagreements }));
