// Agent/crawler discovery: JSON-LD, llms.txt, llms-full.txt, hire.json, robots.txt.
import fs from 'node:fs'
import path from 'node:path'
import { SITE_URL, CONTACT_URL, SHOW_DRAFTS, packages, services, hire, srcDir, isDraft, sidebarGroups } from './site.mts'

const person = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#jordan`,
  name: 'Jordan Partridge',
  url: 'https://jordanpartridge.us',
  sameAs: ['https://github.com/jordanpartridge', 'https://packagist.org/packages/jordanpartridge/'],
}

const pkgLd = (p: any) => ({
  '@type': 'SoftwareSourceCode',
  '@id': `${SITE_URL}/${p.slug}#package`,
  name: p.composer,
  alternateName: p.name,
  description: p.description,
  url: `${SITE_URL}/${p.slug}`,
  codeRepository: `https://github.com/${p.repo}`,
  programmingLanguage: 'PHP',
  runtimePlatform: 'Laravel',
  license: 'https://opensource.org/licenses/MIT',
  author: { '@id': person['@id'] },
  sameAs: [`https://packagist.org/packages/${p.composer}`],
})

const serviceLd = (s: any) => ({
  '@type': 'Service',
  '@id': `${SITE_URL}/services#${s.slug}`,
  name: s.name,
  description: s.summary,
  url: s.url,
  provider: { '@id': person['@id'] },
  areaServed: { '@type': 'Country', name: 'United States' },
  offers: s.tiers.map((t: any) => ({
    '@type': 'Offer',
    name: `${s.name}: ${t.name}`,
    price: t.price,
    priceCurrency: 'USD',
    description: `${t.delivery}. ${t.includes.join('; ')}.`,
    url: t.bookUrl ?? s.url,
  })),
})

export function jsonLdFor(relativePath: string) {
  const graph: any[] = [person, { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, url: SITE_URL, name: 'Jordan Partridge Docs', publisher: { '@id': person['@id'] } }]
  const page = relativePath.replace(/\.md$/, '')
  if (page === 'index') graph.push({ '@type': 'ItemList', name: 'Packages', itemListElement: packages.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: pkgLd(p) })) })
  const pkg = packages.find((p) => page === `_packages/${p.slug}` || page === p.slug)
  if (pkg) graph.push(pkgLd(pkg))
  if (page === 'services') graph.push(...services.services.map(serviceLd))
  return { '@context': 'https://schema.org', '@graph': graph }
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`

function liveDocPages(): { title: string; url: string; file: string }[] {
  const out: { title: string; url: string; file: string }[] = []
  for (const g of sidebarGroups) for (const i of g.items) {
    if (i.link === '/') continue
    const pkg = packages.find((p) => i.link === `/${p.slug}`)
    const file = pkg ? path.join(srcDir, '_packages', `${pkg.slug}.md`) : path.join(srcDir, `${i.link.slice(1)}.md`)
    out.push({ title: i.text, url: `${SITE_URL}${i.link}`, file })
  }
  return out
}

export function writeDiscovery(outDir: string) {
  const L: string[] = []
  L.push('# Jordan Partridge Docs', '')
  L.push('> Documentation for open-source Laravel packages by Jordan Partridge, plus his published Laravel services. Contact is through the form at ' + CONTACT_URL + ' (no email).', '')
  L.push('## Packages', '')
  for (const p of packages) L.push(`- [${p.composer}](${SITE_URL}/${p.slug}): ${p.description} Install: \`composer require ${p.composer}\`. Source: https://github.com/${p.repo}`)
  L.push('', '## Services', '')
  for (const s of services.services) L.push(`- [${s.name}](${SITE_URL}/services#${s.slug}): ${s.summary} Tiers: ${s.tiers.map((t: any) => `${t.name} ${money(t.price)} (${t.delivery})`).join(', ')}.`)
  L.push(`- How to start: ${CONTACT_URL}`)
  const extra = liveDocPages().filter((p) => !packages.some((k) => p.url.endsWith(`/${k.slug}`)) && !p.url.endsWith('/services'))
  if (extra.length) { L.push('', '## About', ''); for (const p of extra) L.push(`- [${p.title}](${p.url})`) }
  L.push('', '## Optional', '', `- [Full text of every page](${SITE_URL}/llms-full.txt)`, `- [Sitemap](${SITE_URL}/sitemap.xml)`)
  if (SHOW_DRAFTS || !hire.draft) L.push(`- [Machine-readable hiring info](${SITE_URL}/hire.json)`)
  L.push('- [GitHub](https://github.com/jordanpartridge)', '- [Website](https://jordanpartridge.us)')
  fs.writeFileSync(path.join(outDir, 'llms.txt'), L.join('\n') + '\n')

  const full: string[] = ['# Jordan Partridge Docs (full text)', '', `Source: ${SITE_URL}`, '']
  for (const p of liveDocPages()) {
    if (!fs.existsSync(p.file)) continue
    const body = fs.readFileSync(p.file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^<\w+ \/>$/gm, '')
    full.push(`<!-- ${p.url} -->`, body.trim(), '')
    if (p.url.endsWith('/services')) {
      for (const s of services.services) {
        full.push(`## ${s.name}`, '', s.summary, '')
        for (const t of s.tiers) full.push(`- **${t.name}**, ${money(t.price)}, ${t.delivery}: ${t.includes.join('; ')}.`)
        full.push(`- Start: ${CONTACT_URL}`, '')
      }
    }
  }
  fs.writeFileSync(path.join(outDir, 'llms-full.txt'), full.join('\n') + '\n')

  if (SHOW_DRAFTS || !hire.draft) {
    const { draft, $comment, ...pub } = hire
    fs.writeFileSync(path.join(outDir, 'hire.json'), JSON.stringify({ ...pub, ...(draft ? { draft: true } : {}), servicesDetail: services.services }, null, 2) + '\n')
  }

  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Grok', 'xAI-Bot', 'Meta-ExternalAgent', 'Amazonbot', 'DuckAssistBot', 'MistralAI-User', 'cohere-ai']
  const robots = ['# AI crawlers and assistants are welcome here.', ...bots.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']), 'User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, '']
  fs.writeFileSync(path.join(outDir, 'robots.txt'), robots.join('\n'))
}
