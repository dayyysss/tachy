<script setup lang="ts">
const props = withDefaults(defineProps<{
  to?: string | null
  mark?: boolean
  imgClass?: string
  variant?: 'auto' | 'light' | 'dark'
}>(), {
  to: '/',
  mark: false,
  variant: 'auto',
})

const { brand } = useBrand()

const lightLogo = computed(() => {
  if (props.mark) {
    return brand.value?.['logo-mark']?.url
      || brand.value?.['favicon']?.url
      || null
  }
  return brand.value?.['logo-on-light']?.url
    || brand.value?.['logo-on-dark']?.url
    || brand.value?.['logo-mark']?.url
    || null
})

const darkLogo = computed(() => {
  if (props.mark) {
    return brand.value?.['logo-mark']?.url
      || brand.value?.['favicon']?.url
      || null
  }
  return brand.value?.['logo-on-dark']?.url
    || brand.value?.['logo-on-light']?.url
    || brand.value?.['logo-mark']?.url
    || null
})

const defaultSizeClass = computed(() => {
  if (props.mark) return 'size-9 sm:size-10'
  return 'h-9 sm:h-10 w-auto'
})
</script>

<template>
  <Motion
    as="div"
    class="inline-flex items-center"
    :while-hover="{ scale: 1.03 }"
    :while-press="{ scale: 0.97 }"
  >
    <component
      :is="to ? 'NuxtLink' : 'div'"
      :to="to || undefined"
      class="inline-flex items-center gap-2"
      aria-label="Tachy home"
    >
      <img
        v-if="variant === 'light' && lightLogo"
        :src="lightLogo"
        alt="Tachy"
        class="object-contain transition-all"
        :class="[imgClass || defaultSizeClass]"
        :width="mark ? 40 : 160"
        height="40"
      >
      <img
        v-else-if="variant === 'dark' && darkLogo"
        :src="darkLogo"
        alt="Tachy"
        class="object-contain transition-all"
        :class="[imgClass || defaultSizeClass]"
        :width="mark ? 40 : 160"
        height="40"
      >
      <template v-else-if="lightLogo || darkLogo">
        <img
          v-if="lightLogo"
          :src="lightLogo"
          alt="Tachy"
          class="brand-logo--light object-contain transition-all"
          :class="[imgClass || defaultSizeClass]"
          :width="mark ? 40 : 160"
          height="40"
        >
        <img
          v-if="darkLogo"
          :src="darkLogo"
          alt="Tachy"
          class="brand-logo--dark object-contain transition-all"
          :class="[imgClass || defaultSizeClass]"
          :width="mark ? 40 : 160"
          height="40"
        >
      </template>
      <!-- Pure CSS/SVG Dynamic Mark Fallback -->
      <div
        v-else
        class="inline-flex items-center gap-2 font-mono font-bold text-primary"
        :class="[imgClass || defaultSizeClass]"
      >
        <span class="rounded-xl bg-primary/20 px-2 py-1 text-primary border border-primary/30">T</span>
        <span v-if="!mark" class="text-base-content font-sans text-lg font-bold tracking-tight">Tachy</span>
      </div>
    </component>
  </Motion>
</template>
