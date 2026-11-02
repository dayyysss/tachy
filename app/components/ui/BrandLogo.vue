<script setup lang="ts">
import { bundledBrand } from '#shared/config/brand'

const props = withDefaults(defineProps<{
  to?: string
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
      || bundledBrand['favicon']
      || bundledBrand['logo-on-light']
  }
  return brand.value?.['logo-on-light']?.url
    || brand.value?.['logo-on-dark']?.url
    || bundledBrand['logo-on-light']
})

const darkLogo = computed(() => {
  if (props.mark) {
    return brand.value?.['logo-mark']?.url
      || brand.value?.['favicon']?.url
      || bundledBrand['favicon']
      || bundledBrand['logo-on-dark']
  }
  return brand.value?.['logo-on-dark']?.url
    || brand.value?.['logo-on-light']?.url
    || bundledBrand['logo-on-dark']
})
</script>

<template>
  <Motion
    as="div"
    class="inline-flex items-center"
    :while-hover="{ scale: 1.03 }"
    :while-press="{ scale: 0.97 }"
  >
    <NuxtLink :to="to" class="inline-flex items-center gap-2" aria-label="Tachy home">
      <img
        v-if="variant === 'light'"
        :src="lightLogo"
        alt="Tachy"
        class="object-contain"
        :class="[mark ? 'size-7' : 'h-7 w-auto', imgClass]"
        :width="mark ? 28 : 120"
        height="28"
      >
      <img
        v-else-if="variant === 'dark'"
        :src="darkLogo"
        alt="Tachy"
        class="object-contain"
        :class="[mark ? 'size-7' : 'h-7 w-auto', imgClass]"
        :width="mark ? 28 : 120"
        height="28"
      >
      <template v-else>
        <img
          :src="lightLogo"
          alt="Tachy"
          class="brand-logo--light object-contain"
          :class="[mark ? 'size-7' : 'h-7 w-auto', imgClass]"
          :width="mark ? 28 : 120"
          height="28"
        >
        <img
          :src="darkLogo"
          alt="Tachy"
          class="brand-logo--dark object-contain"
          :class="[mark ? 'size-7' : 'h-7 w-auto', imgClass]"
          :width="mark ? 28 : 120"
          height="28"
        >
      </template>
    </NuxtLink>
  </Motion>
</template>
