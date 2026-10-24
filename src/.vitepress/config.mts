import { defineConfig, type HeadConfig } from 'vitepress'
import { SITE_URL, SHOW_DRAFTS, draftFiles, packages, sidebarGroups } from './site.mts'
import { jsonLdFor, writeDiscovery } from './discovery.mts'

const DESCRIPTION = 'Documentation for open-source Laravel packages by Jordan Partridge.'

export default defineConfig({
  title: 'Jordan Partridge Docs',
  titleTemplate: ':title · Jordan Partridge Docs',
  description: DESCRIPTION,
  lang: 'en-US',
  cleanUrls: true,
  // Synced package docs may link to laravel.com-style paths we don't host; don't fail the whole site on them.
  ignoreDeadLinks: true,
  srcExclude: SHOW_DRAFTS ? [] : draftFiles,
  // Package docs are synced into src/_packages/ but served at /<package>.
  rewrites: { '_packages/:page': ':page', '_packages/:pkg/:page': ':pkg/:page' },
  sitemap: { hostname: SITE_URL, transformItems: (items) => items.filter((i) => !/\/404$/.test(i.url) && i.url !== '404') },
  head: [
    ['meta', { name: 'theme-color', content: '#f53003' }],
    ['meta', { property: 'og:site_name', content: 'Jordan Partridge Docs' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:site', content: '@Shadetheory' }],
    ['link', { rel: 'alternate', type: 'text/plain', href: '/llms.txt', title: 'llms.txt' }],
    ...(SHOW_DRAFTS ? [['meta', { name: 'robots', content: 'noindex' }] as HeadConfig] : []),
  ],
  transformHead({ pageData, title, description }) {
    const route = pageData.relativePath.replace(/^_packages\//, '').replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const url = `${SITE_URL}/${route}`
    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description || DESCRIPTION }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:type', content: route === '' ? 'website' : 'article' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description || DESCRIPTION }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(jsonLdFor(pageData.relativePath))],
    ]
  },
  buildEnd(siteConfig) {
    writeDiscovery(siteConfig.outDir)
  },
  markdown: { theme: { light: 'github-light', dark: 'github-dark' } },
  themeConfig: {
    siteTitle: 'Jordan Partridge Docs',
    nav: [
      { text: 'Packages', items: packages.map((p) => ({ text: p.name, link: `/${p.slug}` })) },
      { text: 'Services', link: '/services' },
      { text: 'Hire Jordan', link: 'https://jordanpartridge.us' },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/jordanpartridge' }],
    sidebar: sidebarGroups,
    outline: { level: [2, 3], label: 'On this page' },
    search: { provider: 'local' },
    editLink: {
      pattern: ({ frontmatter, filePath }: any) => frontmatter.editLink ?? `https://github.com/jordanpartridge/docs/edit/main/src/${filePath}`,
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: '<a href="https://jordanpartridge.us">Hire Jordan</a> · <a href="https://github.com/jordanpartridge">GitHub</a> · <a href="/llms.txt">llms.txt</a>',
      copyright: 'Package docs are synced from each package repository.',
    },
  },
})
