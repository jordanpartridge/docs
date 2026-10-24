<script setup lang="ts">
import data from '../../../data/services.json'
const money = (n: number) => `$${n.toLocaleString('en-US')}`
</script>

<template>
  <section v-for="s in data.services" :key="s.slug" class="svc">
    <h2 :id="s.slug" tabindex="-1">{{ s.name }} <a class="header-anchor" :href="`#${s.slug}`" aria-hidden="true">&#8203;</a></h2>
    <p>{{ s.summary }} <a :href="s.url">Details on jordanpartridge.us</a>.</p>
    <div class="svc-tiers">
      <article v-for="t in s.tiers" :key="t.name" class="svc-tier">
        <h3>{{ t.name }}</h3>
        <p class="svc-price">{{ money(t.price) }} <span>· {{ t.delivery }}</span></p>
        <ul><li v-for="i in t.includes" :key="i">{{ i }}</li></ul>
        <a v-if="t.bookUrl" class="svc-book" :href="t.bookUrl">Book</a>
        <a v-else class="svc-start" :href="data.contact">Start with the contact form</a>
      </article>
    </div>
  </section>
</template>
