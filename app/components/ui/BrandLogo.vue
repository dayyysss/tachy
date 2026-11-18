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
let localePath = (p: string) => p
try {
  const lp = useLocalePath()
  if (typeof lp === 'function') localePath = lp
} catch {}

let route = { path: '/' }
try {
  const r = useRoute()
  if (r) route = r
} catch {}

const targetPath = computed(() => {
  if (props.to === null) return null
  if (!props.to || props.to === '/') return localePath('/')
  return props.to
})

function onLogoClick() {
  const homePath = localePath('/')
  if (route.path === homePath || route.path === '/') {
    if (import.meta.client) {
      window.dispatchEvent(new CustomEvent('tachy-restart-test'))
    }
  }
}

const lightLogo = computed(() => {
  if (props.mark) {
    return brand.value?.['logo-mark']?.url
      || brand.value?.['favicon']?.url
      || '/brand/logo-mark.png'
  }
  return brand.value?.['logo-on-light']?.url
    || brand.value?.['logo-on-dark']?.url
    || brand.value?.['logo-mark']?.url
    || '/brand/logo-on-light.png'
})

const darkLogo = computed(() => {
  if (props.mark) {
    return brand.value?.['logo-mark']?.url
      || brand.value?.['favicon']?.url
      || '/brand/logo-mark.png'
  }
  return brand.value?.['logo-on-dark']?.url
    || brand.value?.['logo-on-light']?.url
    || brand.value?.['logo-mark']?.url
    || '/brand/logo-on-dark.png'
})

const defaultSizeClass = computed(() => {
  if (props.mark) return 'size-9 sm:size-10'
  return 'h-9 sm:h-10 w-auto'
})
</script>

<template>
  <NuxtLink
    v-if="targetPath"
    :to="targetPath"
    class="inline-flex items-center gap-2 cursor-pointer select-none group focus:outline-hidden"
    aria-label="Tachy home"
    @click="onLogoClick"
  >
    <Motion
      as="div"
      class="inline-flex items-center gap-2"
      :while-hover="{ scale: 1.03 }"
      :while-press="{ scale: 0.97 }"
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
    </Motion>
  </NuxtLink>

  <div
    v-else
    class="inline-flex items-center gap-2"
    aria-label="Tachy home"
  >
    <Motion
      as="div"
      class="inline-flex items-center gap-2"
      :while-hover="{ scale: 1.03 }"
      :while-press="{ scale: 0.97 }"
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
    </Motion>
  </div>
</template>
