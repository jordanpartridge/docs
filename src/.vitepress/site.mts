// Site structure and draft handling. A page with `draft: true` in its frontmatter is excluded
// from the build, the sidebar, the sitemap and llms*.txt unless DRAFTS=1. Approving a page =
// deleting that line.
import fs from 'node:fs'
import path from 'node:path'

export const SITE_URL = 'https://docs.jordanpartridge.us'
export const CONTACT_URL = 'https://jordanpartridge.us/#contact'
export const SHOW_DRAFTS = process.env.DRAFTS === '1'

export const srcDir = path.resolve(import.meta.dirname, '..')
export const rootDir = path.resolve(srcDir, '..')

export type Pkg = {
  slug: string; name: string; repo: string; composer: string; description: string; ref: string; sha: string
  placeholder: boolean; pages: { text: string; link: string; items: { text: string; anchor: string }[] }[]
}

const manifestPath = path.join(import.meta.dirname, 'packages.generated.json')
export const packages: Pkg[] = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : []
export const services = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'services.json'), 'utf8'))
const hirePath = path.join(rootDir, 'data', 'hire.json')
// hire.json holds draft copy about Jordan; it stays out of git until approved.
export const hire = fs.existsSync(hirePath) ? JSON.parse(fs.readFileSync(hirePath, 'utf8')) : { draft: true }

export function isDraft(file: string): boolean {
  const p = path.join(srcDir, file)
  if (!fs.existsSync(p)) return true
  const fm = fs.readFileSync(p, 'utf8').match(/^---\n([\s\S]*?)\n---/)
  return !!fm && /^draft:\s*true\s*$/m.test(fm[1])
}

export const draftFiles = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith('.md') && isDraft(f))

// Sidebar groups, laravel.com/docs style. `file` is relative to src/.
type Item = { text: string; link: string; file?: string }
const groups: { text: string; items: Item[] }[] = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Introduction', link: '/introduction', file: 'introduction.md' },
      { text: 'Hiring Jordan', link: '/hiring', file: 'hiring.md' },
    ],
  },
  {
    text: 'Packages',
    items: [
      { text: 'All packages', link: '/' },
      ...packages.map((p) => ({ text: p.name, link: `/${p.slug}` })),
    ],
  },
  {
    text: 'Services',
    items: [
      { text: 'Services & pricing', link: '/services', file: 'services.md' },
      { text: 'Workflow fit', link: '/workflow-fit', file: 'workflow-fit.md' },
    ],
  },
  {
    text: 'The human side',
    items: [
      { text: 'Projects', link: '/projects', file: 'projects.md' },
      { text: 'Interests', link: '/interests', file: 'interests.md' },
      { text: 'Live feed', link: '/feed', file: 'feed.md' },
    ],
  },
  {
    text: 'For AI agents',
    items: [{ text: 'For AI agents', link: '/for-ai-agents', file: 'for-ai-agents.md' }],
  },
]

const visible = (i: Item) => SHOW_DRAFTS || !i.file || !isDraft(i.file)
export const sidebarGroups = groups
  .map((g) => ({
    text: g.text,
    items: g.items.filter(visible).map((i) => ({ text: i.file && isDraft(i.file) ? `${i.text} (draft)` : i.text, link: i.link })),
  }))
  .filter((g) => g.items.length > 0)
