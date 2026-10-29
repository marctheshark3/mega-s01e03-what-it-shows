import assert from 'node:assert/strict';
import { test } from 'node:test';
import { causeOf, dayFirst } from '../src/lib/kb/causes.ts';
import { deskRef } from '../src/lib/kb/desk-ref.ts';
import { context } from './context.mjs';
import { renderer } from './renderer.mjs';

test('overlapping export pages count one report per ID', () => {
  const { raw, reports, groups } = context();
  assert.equal(raw.length, 427);
  assert.equal(reports.length, 412);
  assert.deepEqual(groups.map((g) => [g.cause, g.reports.length]), [['parser', 379], ['hint', 33]]);
  const first = new Map();
  for (const report of raw) {
    if (first.has(report.id)) assert.deepEqual(report, first.get(report.id));
    first.set(report.id, report);
  }
});

test('tenant locale and form determine the cause independently of browser tags and subjects', () => {
  const { reports, tenantOf } = context();
  assert.equal(reports.filter((r) => r.meta.intakeTag !== causeOf(r, tenantOf(r))).length, 38);
  for (const report of reports) {
    const changed = { ...report, subject: 'Same subject', meta: { browserLocale: 'en-US', intakeTag: 'hint' } };
    assert.equal(causeOf(changed, tenantOf(changed)), causeOf(report, tenantOf(report)));
  }
  const tenant = { handle: 'new.tenant', name: 'New tenant', locale: 'fi-FI', form: 'booking-v3' };
  assert.equal(dayFirst(tenant.locale), true);
  assert.equal(causeOf({ channel: 'form' }, tenant), 'hint');
  assert.equal(causeOf({ channel: 'app' }, tenant), 'parser');
  assert.equal(causeOf({ channel: 'form' }, { ...tenant, form: 'booking-v2' }), 'parser');
  assert.equal(causeOf({ channel: 'email' }, undefined), null);
});

test('the actual signed review renders both causes and the derived desk reference', async () => {
  const view = await renderer();
  try {
    const page = await view.page('/kb/incidents/4471-review');
    assert.match(page.body, /379/);
    assert.match(page.body, /33/);
    assert.ok(page.body.includes(deskRef(page.metadata.signature)));
    assert.doesNotMatch(page.body, /no desk ref/);
    assert.match(page.body, /one-day/);
    assert.match(page.body, /2026-04-01/);
    assert.match(page.body, /booking-v3 form retired/);
    assert.match(page.body, /fix\(dates\): parse dd\/mm for eu locales/);
    assert.match(page.body, /not planned/);
  } finally {
    await view.close();
  }
});
