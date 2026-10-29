# booking-v3 date hint says MM/DD/YYYY but the form reads tenant date order

Source: MEGA.dev S01E03, support desk merged ticket #4471. These reports are from the course dataset.

## Scope

**Reports covered: 33 distinct report IDs.**

3 tenants; received 2026-04-17 through 2026-09-22.
Intake tags in this group: parser: 15; hint: 18.

For day-first tenants on booking-v3, the date hint prints MM/DD/YYYY while the form reads dates in the tenant locale. Only the form channel is assigned to this cause; app/email from the same tenants still use the parser path.

## Evidence and reproduction

R-41230 at copper.studio (es-ES, booking-v3, form) reports a client coming on 1 June instead of 6 January. Following MM/DD/YYYY, 01/06 for 6 January can be read day first as 1 June.

Open booking-v3 for a day-first tenant. Follow its MM/DD/YYYY hint and enter 01/06 for 6 January. Inspect the booking date. Expected: hint and reader agree on 6 January. Reported behavior: 1 June. This is a reproduction specification from the export, not a test run against product code.

## Acceptance criteria

- Derive the visible hint and input reader from the same locale/date contract.
- Verify all day-first booking-v3 tenants discovered in the directory, including alder.physio, copper.studio and pale.harbour in this snapshot.
- Test ambiguous dates, impossible dates and explicit calendar selection.
- Verify separately from the shared parser fix; changing that parser alone does not repair this form contract.

## Counting and limits

The export has 427 rows but 412 distinct reports in #4471. Overlapping export pages contribute 15 repeated rows. Counts run the supplied uniqueById and groupByCause logic against the tenant directory, rather than trusting browser-based intake tags or subject wording.

No desk-noted one-day reports fall in this cause.

The provided product code and runtime are absent. This ticket documents the desk model and reported behavior; it does not claim a reproduced product defect or a verified fix.

The machine-readable assignment is in evidence/report-classification.csv; evidence/summary.json contains the full membership and source hash. The signed kb page is src/routes/kb/incidents/4471-review/+page.svx, with its rendered counterpart at rendered/kb/incidents/4471-review/index.html.

<details><summary>Report IDs (33)</summary>

R-41230, R-41241, R-41251, R-41259, R-41262, R-41275, R-41294, R-41305, R-41308, R-41366, R-41372, R-41384, R-41387, R-41396, R-41400, R-41406, R-41415, R-41416, R-41418, R-41428, R-41439, R-41441, R-41449, R-41453, R-41456, R-41460, R-41472, R-41485, R-41493, R-41539, R-41572, R-41582, R-41584

</details>
