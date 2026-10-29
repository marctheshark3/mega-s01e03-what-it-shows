<script lang="ts">
  import source from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { causeOf, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { daysSince, isoDay, STALE_AFTER_DAYS } from '#lib/kb/staleness';
  import { metadata as decision } from '../../routes/kb/decisions/0001-dedupe-by-subject/+page.svx';

  const reports = uniqueById(source as Report[]).filter((r) => r.mergedInto === 4471);
  const mismatches = reports.filter((r) => causeOf(r, tenantOf(r)) !== r.meta.intakeTag);
  const firstReceived = [...reports].sort((a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt))[0];
  const lastReceived = [...reports].sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))[0];
  const merged = reports.filter((r) => r.mergedAt).sort((a, b) => Date.parse(a.mergedAt!) - Date.parse(b.mergedAt!));
  const firstMerge = merged[0]?.mergedAt;
  const backlog = firstMerge ? reports.filter((r) => Date.parse(r.receivedAt) < Date.parse(firstMerge)).length : 0;
  const oneDay = reports.filter((r) => notes.oneDayMove.includes(r.id));
</script>

<h2>How to read the counts</h2>
<p>
  The export has <strong>{source.length}</strong> rows and <strong>{reports.length}</strong> distinct reports
  merged into #4471. The overlap contributes <strong>{source.length - reports.length}</strong> repeated rows;
  count an ID once. Counts use <code>uniqueById</code>, then <code>mergedInto</code>, then <code>groupByCause</code>.
</p>
<p>
  <strong>{mismatches.length}</strong> intake tags disagree with the tenant-based classification.
  The browser locale and intake tag are guesses, not the tenant's locale or a diagnosis.
  Tenant files are discovered by the existing directory glob; the platform determines date order.
</p>

<h2>What the intake snapshot shows</h2>
<p>
  Reports run from <strong>{firstReceived.receivedAt.slice(0, 10)}</strong> to
  <strong>{lastReceived.receivedAt.slice(0, 10)}</strong>.
  {#if firstMerge}
    The first recorded merge was <strong>{firstMerge.slice(0, 10)}</strong>;
    <strong>{backlog}</strong> reports had already arrived before it.
  {/if}
  A merge spike is desk activity, not the start of the failures. A known status and a queued fix
  do not show that the problem stopped. This export cannot establish what happened after its last report.
</p>

<h2>Reports that need follow-up</h2>
<p>
  <strong>{oneDay.length}</strong> reports are flagged by the desk as one-day moves.
  They remain inside their assigned cause's count, not an extra set to add to the total.
  Their words do not establish a month/day swap or a time-zone defect. Keep their evidence and
  reproduce them separately; split a further ticket if the mechanism differs.
</p>
<div class="overflow">
  <table>
    <thead><tr><th>report</th><th>filed cause</th><th>what the reporter said</th></tr></thead>
    <tbody>
      {#each oneDay as report (report.id)}
        <tr><td><code>{report.id}</code></td><td>{causeOf(report, tenantOf(report)) ?? 'unplaced'}</td><td>{report.body}</td></tr>
      {/each}
    </tbody>
  </table>
</div>

<h2>Old guidance needs an explicit replacement</h2>
<p>
  Decision 0001 was last reviewed on <strong>{isoDay(decision.reviewed)}</strong>,
  <strong>{daysSince(decision.reviewed)}</strong> days ago. The kb's review threshold is
  <strong>{STALE_AFTER_DAYS}</strong> days. Its accepted status does not make its subject-only
  merge rule consistent with the running cause model. Preserve it as a historical decision;
  the replacement proposal below records the correction.
</p>

<style>
  .overflow { overflow-x: auto; }
  td { vertical-align: top; }
</style>
