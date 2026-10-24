// Pull each package's docs/*.md from its own repo (the source of truth) into src/.
// Usage: node scripts/sync.mjs   (env PKG_REF_<SLUG_UPPER_SNAKE>=branch overrides a ref)
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { transform } from './transform.mjs'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, 'src', '_packages')
const cache = path.join(root, '.cache')
const packages = JSON.parse(fs.readFileSync(path.join(root, 'packages.json'), 'utf8'))

fs.mkdirSync(cache, { recursive: true })
fs.rmSync(src, { recursive: true, force: true })
fs.mkdirSync(src, { recursive: true })

const slugify = (s) =>
  s.toLowerCase().replace(/<[^>]+>/g, '').replace(/`/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')

function headings(md) {
  const items = []
  for (const line of md.split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*(?:\{#([^}]+)\})?\s*$/)
    if (m) items.push({ text: m[1].replace(/`/g, ''), anchor: m[2] || slugify(m[1]) })
  }
  return items
}

function fetchRepo(pkg) {
  const envKey = 'PKG_REF_' + pkg.slug.toUpperCase().replace(/-/g, '_')
  const ref = process.env[envKey] || pkg.ref || 'main'
  const dir = path.join(cache, pkg.slug)
  fs.rmSync(dir, { recursive: true, force: true })
  execFileSync('git', ['clone', '--quiet', '--depth', '1', '--branch', ref, `https://github.com/${pkg.repo}.git`, dir], {
    stdio: 'inherit',
  })
  const sha = execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD']).toString().trim()
  return { dir, ref, sha }
}

const manifest = []
for (const pkg of packages) {
  const { dir, ref, sha } = fetchRepo(pkg)
  const docsDir = path.join(dir, pkg.docsDir || 'docs')
  const pkgOut = path.join(src, pkg.slug)
  fs.rmSync(pkgOut, { recursive: true, force: true })
  fs.rmSync(path.join(src, `${pkg.slug}.md`), { force: true })

  const files = fs.existsSync(docsDir) ? fs.readdirSync(docsDir).filter((f) => f.endsWith('.md')).sort() : []
  const source = `https://github.com/${pkg.repo}/tree/${ref}/${pkg.docsDir || 'docs'}`
  const editBase = `https://github.com/${pkg.repo}/edit/${ref}/${pkg.docsDir || 'docs'}`
  const pages = []

  if (files.length === 0) {
    // Placeholder until the package repo ships docs/*.md.
    const readme = fs.existsSync(path.join(dir, 'README.md')) ? fs.readFileSync(path.join(dir, 'README.md'), 'utf8') : ''
    const body = readme.replace(/^#\s+.*\n/, '')
    const md = `---\ntitle: ${pkg.name}\nplaceholder: true\neditLink: https://github.com/${pkg.repo}/blob/${ref}/README.md\n---\n\n# ${pkg.name}\n\n::: warning PLACEHOLDER\nFull documentation for this package is not published yet. Until \`${pkg.docsDir || 'docs'}/\` lands in [${pkg.repo}](https://github.com/${pkg.repo}), this page mirrors the package README (\`${ref}@${sha}\`).\n:::\n\n${body}\n`
    fs.writeFileSync(path.join(src, `${pkg.slug}.md`), md)
    pages.push({ text: 'README (placeholder)', link: `/${pkg.slug}`, items: headings(md) })
  } else {
    const indexFile = files.includes(pkg.index) ? pkg.index : files[0]
    const pageMap = Object.fromEntries(
      files.map((f) => [f.replace(/\.md$/, ''), f === indexFile ? `/${pkg.slug}` : `/${pkg.slug}/${f.replace(/\.md$/, '')}`]),
    )
    for (const f of [indexFile, ...files.filter((x) => x !== indexFile)]) {
      const raw = fs.readFileSync(path.join(docsDir, f), 'utf8')
      const body = transform(raw, { slug: pkg.slug, pageMap })
      const title = (body.match(/^#\s+(.+)$/m) || [, f.replace(/\.md$/, '')])[1].trim()
      const fm = `---\ntitle: ${JSON.stringify(title)}\neditLink: ${JSON.stringify(`${editBase}/${f}`)}\n---\n\n`
      const isIndex = f === indexFile
      const target = isIndex ? path.join(src, `${pkg.slug}.md`) : path.join(pkgOut, f)
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, fm + body)
      pages.push({ text: title, link: pageMap[f.replace(/\.md$/, '')], items: headings(body) })
    }
  }

  manifest.push({ ...pkg, ref, sha, source, placeholder: files.length === 0, pages })
  console.log(`synced ${pkg.slug} @ ${ref} (${sha}): ${files.length ? files.join(', ') : 'placeholder from README'}`)
}

fs.writeFileSync(path.join(root, 'src', '.vitepress', 'packages.generated.json'), JSON.stringify(manifest, null, 2))
