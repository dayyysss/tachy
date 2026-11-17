<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  category?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200/50 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
    <div class="space-y-1">
      <div v-if="category" class="flex items-center gap-2">
        <span class="badge badge-primary badge-outline badge-xs font-mono font-semibold uppercase tracking-wider">
          {{ category }}
        </span>
      </div>
      <h1 class="text-xl font-bold tracking-tight text-base-content sm:text-2xl">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-xs text-base-content/60 sm:text-sm max-w-2xl leading-relaxed">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
