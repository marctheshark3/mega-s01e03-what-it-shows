import { hydrate } from 'svelte';

const pages = import.meta.glob('/src/routes/kb/**/+page.svx', { eager: true });
const route = document.documentElement.dataset.route;
const page = pages[`/src/routes${route}/+page.svx`];
if (!page) throw new Error(`Unknown kb route: ${route}`);
hydrate(page.default, { target: document.getElementById('page') });
