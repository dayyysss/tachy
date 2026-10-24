<script setup lang="ts">
const { type } = useTheme()
</script>

<template>
  <NuxtLink to="/" class="inline-flex items-center gap-2" aria-label="Tachy home">
    <img
      v-if="type === 'light'"
      src="/brand/logo-on-light.png"
      alt="Tachy"
      class="h-7 w-auto"
      width="120"
      height="28"
    >
    <img
      v-else
      src="/brand/logo-on-dark.png"
      alt="Tachy"
      class="h-7 w-auto"
      width="120"
      height="28"
    >
  </NuxtLink>
</template>
