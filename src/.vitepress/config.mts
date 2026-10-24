import { defineConfig, type DefaultTheme } from 'vitepress'
import fs from 'node:fs'

type Pkg = {
  slug: string; name: string; repo: string; composer: string; description: string
  placeholder: boolean; pages: { text: string; link: string; items: { text: string; anchor: string }[] }[]
}

const manifestUrl = new URL('./packages.generated.json', import.meta.url)
const packages: Pkg[] = fs.existsSync(manifestUrl) ? JSON.parse(fs.readFileSync(manifestUrl, 'utf8')) : []

// One sidebar per package, keyed by its URL prefix: pages, each with its H2 sections.
const sidebar: DefaultTheme.SidebarMulti = Object.fromEntries(
  packages.map((p) => [
    `/${p.slug}`,
    [
      { text: '← All packages', link: '/' },
      ...p.pages.map((page) => ({
        text: page.text,
        link: page.link,
        collapsed: false,
        items: page.items.map((h) => ({ text: h.text, link: `${page.link}#${h.anchor}` })),
      })),
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: `https://github.com/${p.repo}` },
          { text: 'Packagist', link: `https://packagist.org/packages/${p.composer}` },
        ],
      },
    ],
  ]),
)

export default defineConfig({
  title: 'Jordan Partridge',
  titleTemplate: ':title · Jordan Partridge Docs',
  description: 'Documentation for Laravel packages by Jordan Partridge.',
  lang: 'en-US',
  cleanUrls: true,
  // Synced package docs may link to laravel.com-style paths we don't host; don't fail the whole site on them.
  ignoreDeadLinks: true,
  lastUpdated: false,
  appearance: true,
  head: [['meta', { name: 'theme-color', content: '#f53003' }]],
  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
  },
  themeConfig: {
    siteTitle: 'Jordan Partridge · Docs',
    nav: [
      { text: 'Packages', items: packages.map((p) => ({ text: p.name, link: `/${p.slug}` })) },
      { text: 'Hire Jordan', link: 'https://jordanpartridge.us' },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/jordanpartridge' }],
    sidebar,
    outline: { level: [2, 3], label: 'On this page' },
    search: { provider: 'local' },
    editLink: { pattern: ({ frontmatter }: any) => frontmatter.editLink ?? 'https://github.com/jordanpartridge/docs', text: 'Edit this page on GitHub' },
    footer: {
      message: '<a href="https://jordanpartridge.us">Hire Jordan</a> · <a href="https://github.com/jordanpartridge">GitHub</a>',
      copyright: 'Docs are synced from each package repository. MIT licensed packages.',
    },
  },
})
