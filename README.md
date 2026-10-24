# docs.jordanpartridge.us

Documentation for Jordan Partridge's Laravel packages, in the spirit of `spatie.be/docs/<package>`.

- `/` lists every package: name, one-liner, install command, docs, GitHub and Packagist links.
- `/<package>` is the package's docs, with a per-package sidebar, an on-page TOC, search and dark mode.

Built with [VitePress](https://vitepress.dev) and served as static assets on Cloudflare Workers (free plan).

## The package repo is the source of truth

Nothing under `src/<package>` is committed here. `npm run build` runs `scripts/sync.mjs`, which shallow-clones each repo in `packages.json` at its `ref` and copies `docs/*.md` into the site. Write the docs in laravel/docs format and they render cleanly:

- the manual anchor-link TOC under the H1 is dropped (VitePress draws its own),
- `<a name="x"></a>` before a heading becomes that heading's id, so `#x` links keep working,
- GitHub alerts (`> [!NOTE]`, `> [!WARNING]`, ...) and older `> {note}` callouts render as callout boxes,
- links between a package's own pages (`other.md`) are rewritten to `/<package>/other`.

The file named by `index` (or the first `.md`) is served at `/<package>`; other files at `/<package>/<file>`. A package with no `docs/` yet gets a clearly marked placeholder built from its README.

## Add a package

Add one entry to `packages.json`:

```json
{ "slug": "laravel-git-agent", "name": "Laravel Git Agent", "repo": "jordanpartridge/laravel-git-agent", "composer": "jordanpartridge/laravel-git-agent", "description": "One-line description.", "ref": "main", "docsDir": "docs", "index": "git-agent.md" }
```

Push to `main`. To preview an unmerged docs branch, set `ref` to it, or build with `PKG_REF_LARAVEL_GIT_AGENT=my-branch npm run build`.

## Local

```shell
npm install
npm run dev      # sync + dev server
npm test         # markdown transform tests
npm run build    # sync + static build into src/.vitepress/dist
npx wrangler deploy   # manual deploy (needs `wrangler login`)
```

## Deploys

Cloudflare Worker `docs` on the free plan, custom domain `docs.jordanpartridge.us`.

- **Today (manual):** the live version was uploaded through the Cloudflare API as a self-contained Worker built by `node scripts/bundle-worker.mjs` (no wrangler login or API token needed). Re-run `npm run build && node scripts/bundle-worker.mjs` and upload `.worker/worker.js` the same way to redeploy.
- **Auto-deploy on push (needs one dashboard click):** connect this repo under Workers & Pages → `docs` → Settings → Build → Connect (Cloudflare's GitHub app, free). Build command `npm run build`, deploy command `npx wrangler deploy`. From then on every push to `main` deploys, using `wrangler.jsonc` (static assets).
- **Locally:** `npx wrangler login` once, then `npm run deploy`.

## Drafts

A page with `draft: true` in its frontmatter is left out of the build, sidebar, sitemap, search and `llms*.txt`. Preview everything with `DRAFTS=1 npm run dev`. To publish a page, delete its `draft: true` line. Copy about Jordan himself (Introduction, Hiring Jordan, Workflow fit, For AI agents, `data/hire.json`) is also git-ignored until he approves it, so it is neither deployed nor in this public repo.

## Discovery

The build writes `/llms.txt`, `/llms-full.txt`, `/robots.txt` (AI crawlers allowed), `/sitemap.xml`, OpenGraph tags, and schema.org JSON-LD on every page (Person, WebSite, `SoftwareSourceCode` per package, `Service`/`Offer` per published tier). `/hire.json` is generated from `data/hire.json` once that file is approved.
