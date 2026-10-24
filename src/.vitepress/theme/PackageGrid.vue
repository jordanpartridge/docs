<script setup lang="ts">
import { ref } from 'vue'
import packages from '../packages.generated.json'

const copied = ref<string | null>(null)
function copy(cmd: string) {
  navigator.clipboard?.writeText(cmd)
  copied.value = cmd
  setTimeout(() => (copied.value = null), 1500)
}
</script>

<template>
  <div class="pkg-grid">
    <article v-for="p in packages" :key="p.slug" class="pkg-card">
      <h2 class="pkg-name"><a :href="`/${p.slug}`">{{ p.name }}</a></h2>
      <p class="pkg-desc">{{ p.description }}</p>
      <button class="pkg-install" type="button" :title="'Copy install command'" @click="copy(`composer require ${p.composer}`)">
        <code>composer require {{ p.composer }}</code>
        <span class="pkg-copy">{{ copied === `composer require ${p.composer}` ? 'Copied' : 'Copy' }}</span>
      </button>
      <div class="pkg-links">
        <a class="pkg-docs" :href="`/${p.slug}`">Docs →</a>
        <a :href="`https://github.com/${p.repo}`" target="_blank" rel="noopener">GitHub</a>
        <a :href="`https://packagist.org/packages/${p.composer}`" target="_blank" rel="noopener">Packagist</a>
        <span v-if="p.placeholder" class="pkg-badge">docs coming soon</span>
      </div>
    </article>
  </div>
</template>
