# kb — the support knowledge base

**kb** = knowledge base. What the support desk knows about how our products break, written
down where the code can keep it honest.

One desk takes reports for every product we run: `sched-prod` (calendar invites for about
300k people) and the rest. When something
goes wrong, the reports reach the desk first. This kb is how the desk triages them, what each
incident turned out to be, and why we decided what we decided.

## What's here

```
src/routes/kb/      the pages (.svx: Markdown with components)
  triage/           how the desk handles incoming reports
  incidents/        one page per big ticket
  decisions/        numbered decision records
src/lib/kb/         components and the logic they run
src/lib/layouts/    the frame every page shares
src/lib/data/       exports from the ticket system
```

## Conventions

- Words in the page, logic in `src/lib` (imported as `#lib/…`). A number that can be computed belongs in a component.
- Every page starts with frontmatter: `title`, `owner`, `status`, `reviewed`.
- A decision is never edited after it is accepted. A new record replaces it.
- A page you add is signed: its frontmatter carries your `signature` and it ends with `<RenderStamp {signature} />`, so the desk knows who wrote it.

## Owners

Support desk. Decision records: whoever signed them.

---

Exported 2026-10-04 from the `support` repo, `apps/kb/` → `src/`.

## S01E03 review

This repository contains the course's support-desk dataset and the signed review added by
Codex for `marctheshark3`. It does not contain the scheduling product's implementation.

- Review source: `src/routes/kb/incidents/4471-review/+page.svx`
- Review as rendered: `rendered/kb/incidents/4471-review/index.html`
- Replacement proposal: `src/routes/kb/decisions/0002-dedupe-by-cause/+page.svx`
- Ticket bodies: `tickets/parser.md`, `tickets/hint.md`
- Auditable counts and membership: `evidence/summary.json`, `evidence/report-classification.csv`

The accepted decision 0001, original reports, cause logic and desk-reference function remain
byte-for-byte identical to the export. The incident and triage prose now warn about the
contradictions and link to the review; the new decision is proposed, not falsely marked accepted.

### Reproduce

Use Node 25 (the verified version was 25.6.1):

```sh
npm ci --ignore-scripts
npm test
npm run analyze
npm run render
python -m http.server 8873 --bind 127.0.0.1 --directory rendered
```

Open `http://127.0.0.1:8873/kb/incidents/4471-review/`.
The renderer preprocesses the actual `.svx` files with mdsvex, compiles the actual Svelte
components, and includes the client bundle inline so the cause explorer works without a CDN.
Counts, tables and the desk reference are computed by those components; the HTML is not a
handwritten imitation. To change the report dataset or tenant directory, regenerate both the
evidence and rendered pages. GitHub ticket bodies describe this snapshot and must then be updated.

The tiny Vite plugin in `scripts/renderer.mjs` supplies the missing build scaffolding from the
export. The lockfile pins its dependencies. No hosting service or GitHub Pages is required.

### Work and validation record

- Inspected exported pages, components, tenant files, report examples and the desk-flagged bodies before writing the review.
- Ran the supplied classifier against unique report IDs and checked that overlapping rows were identical.
- Preserved the one-day reports inside their assigned count while marking their mechanism unconfirmed.
- Observed the new page's render test fail before adding the page; it then passed with the real compiler.
- Checked canonical counts, classification independence from subjects and intake guesses, and locale/form boundaries.
- Checked that the actual rendered reference matches the signature-derived value.
- Inspected the wide and narrow layouts and checked the explorer's interactive verdict in the browser.
- Kept publication for a separate, explicit approval covering this public repo and its two issues.
- After publication, the course accepted the tickets but required a further step. Reopened the
  Challenge page and found the newly revealed engineering update: #4471 closed on 2026-10-05,
  parser fixed, hint not fixed because booking-v3 was retired. Recorded the update separately
  from the immutable report snapshot and preserved the distinct closure reasons.

Local setup note: an offline dependency install lacked cached registry metadata. The normal
dependency install succeeded. Vite's build result required handling its array form, and Svelte's
render result required reading its body/head getters explicitly. Both renderer integration issues
were corrected before publication. Companion Crapper, Dryer and Mutator tools were not provided;
the small data/render checks and browser verification establish the behavior used here.
