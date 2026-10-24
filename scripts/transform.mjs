// Make laravel/docs-style markdown render cleanly in VitePress.
export function transform(md, { slug, pageMap }) {
  let lines = md.replace(/\r\n/g, '\n').split('\n')

  // 1. Drop the manual anchor-link TOC that directly follows the H1 (VitePress renders its own).
  const h1 = lines.findIndex((l) => /^#\s+/.test(l))
  if (h1 !== -1) {
    let i = h1 + 1
    while (i < lines.length && lines[i].trim() === '') i++
    const start = i
    while (i < lines.length && /^\s*[-*+]\s+\[[^\]]+\]\(#[^)]+\)\s*$/.test(lines[i])) i++
    if (i - start >= 2) lines.splice(start, i - start)
  }

  // 2. <a name="x"></a> before a heading -> heading {#x}, so links to #x keep working.
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*<a\s+name=["']([^"']+)["']\s*>\s*<\/a>\s*$/)
    if (m) {
      let j = i + 1
      while (j < lines.length && lines[j].trim() === '') j++
      if (j < lines.length && /^#{2,6}\s+/.test(lines[j]) && !/\{#[^}]+\}\s*$/.test(lines[j])) {
        lines[j] = `${lines[j].trimEnd()} {#${m[1]}}`
        continue
      }
      out.push(`<a id="${m[1]}"></a>`)
      continue
    }
    out.push(lines[i])
  }
  let text = out.join('\n')

  // 3. Rewrite links between a package's own pages (foo.md, ./foo.md, /docs/{{version}}/foo).
  text = text.replace(/\]\((?:\.\/)?(?:\/docs\/\{\{version\}\}\/)?([\w-]+)(?:\.md)?(#[^)]*)?\)/g, (all, name, hash = '') =>
    pageMap[name] !== undefined ? `](${pageMap[name]}${hash})` : all,
  )

  // 4. Older laravel/docs callouts: "> {note} text" / "> {tip} text" -> GitHub alerts.
  text = text.replace(/^>\s*\{(note|tip|warning|important|caution)\}\s*/gim, (_, k) => `> [!${k.toUpperCase()}]\n> `)

  return text
}

