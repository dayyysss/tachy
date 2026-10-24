<script setup lang="ts">
defineProps<{ error: { statusCode: number; statusMessage?: string; message?: string } }>()
const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
    <p class="text-6xl font-semibold text-primary">{{ error.statusCode }}</p>
    <h1 class="text-xl">{{ error.statusMessage || 'Something went wrong' }}</h1>
    <p class="max-w-md text-sm opacity-60">{{ error.message }}</p>
    <button type="button" class="btn btn-primary btn-sm" @click="handleError">Back to Tachy</button>
  </div>
</template>
