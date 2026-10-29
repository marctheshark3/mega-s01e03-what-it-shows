<script lang="ts">
  import update from '#lib/data/engineering-update.json';
  import issues from '#lib/data/issue-links.json';
</script>

<h2>Engineering update: different reasons to close</h2>
<p>
  After the course accepted the separate tickets, its Challenge page revealed this desk update:
  <strong>#{update.ticket} closed {update.closed}</strong>.
  This is an engineering report from <a href={update.source}>the course page</a>, not an independent test of a deployed product.
</p>
<div class="overflow">
  <table>
    <thead><tr><th>cause</th><th>desk disposition</th><th>desk evidence</th><th>GitHub closure</th></tr></thead>
    <tbody>
      {#each update.outcomes as outcome (outcome.cause)}
        <tr>
          <td><a href={issues[outcome.cause as keyof typeof issues]}>{outcome.cause}</a></td>
          <td><strong>{outcome.status}</strong></td>
          <td>{outcome.detail}</td>
          <td>{outcome.githubCloseReason}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<p>
  Retirement is a reason to close the hint ticket as not planned; it is not a shipped hint fix.
  Preserve the historical counts and the one-day reports' uncertainty. The export does not
  verify that those symptoms were reproduced, fixed or eliminated by the parser change.
</p>

<style>
  .overflow { overflow-x: auto; }
  td { vertical-align: top; }
</style>
