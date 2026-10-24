import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transform } from '../scripts/transform.mjs'

const md = fs.readFileSync(new URL('./fixture.md', import.meta.url), 'utf8')
const out = transform(md, { slug: 'pkg', pageMap: { other: '/pkg/other' } })

test('drops the manual TOC under the H1', () => assert.doesNotMatch(out, /^- \[Introduction\]/m))
test('turns <a name> anchors into heading ids', () => {
  assert.match(out, /^## Introduction \{#introduction\}$/m)
  assert.match(out, /^### Configuration \{#configuration\}$/m)
  assert.doesNotMatch(out, /<a name=/)
})
test('keeps GitHub alerts and in-page links', () => {
  assert.match(out, /> \[!NOTE\]/)
  assert.match(out, /\]\(#installation\)/)
})
test('rewrites sibling page links', () => assert.match(out, /\]\(\/pkg\/other\)/))
