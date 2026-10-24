<script setup lang="ts">
defineProps<{ label: string; value: string | number; hint?: string }>()
</script>

<template>
  <div class="rounded-box border border-base-300/80 bg-base-200/50 p-4 transition-all">
    <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-base-content/40">{{ label }}</p>
    <p class="mt-1 font-mono text-3xl font-semibold tabular-nums text-base-content tracking-tight">{{ value }}</p>
    <p v-if="hint" class="mt-1 font-mono text-xs text-base-content/40">{{ hint }}</p>
  </div>
</template>
