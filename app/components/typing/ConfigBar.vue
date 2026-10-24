<script setup lang="ts">
import { amountOptions, type TestConfig } from '#shared/config/modes'
import { availableLanguages, codeLanguages } from '#shared/config/languages'

const props = defineProps<{ config: TestConfig; disabled?: boolean }>()
const emit = defineEmits<{ update: [patch: Partial<TestConfig>] }>()

const modeGroup = computed(() => props.config.mode)
const amounts = computed(() => amountOptions[props.config.mode] ?? [])

function setMode(mode: 'time' | 'words' | 'quote' | 'code' | 'zen' | 'custom') {
  if (mode === 'time') emit('update', { mode, contentType: 'words', amount: props.config.mode === 'time' ? props.config.amount : 30 })
  else if (mode === 'words') emit('update', { mode, contentType: 'words', amount: [10, 25, 50, 100].includes(props.config.amount) ? props.config.amount : 25 })
  else if (mode === 'quote') emit('update', { mode, contentType: 'quotes', amount: 0 })
  else if (mode === 'code') emit('update', { mode, contentType: 'code', amount: 0 })
  else if (mode === 'zen') emit('update', { mode, contentType: 'words', amount: 0 })
  else emit('update', { mode: 'custom', contentType: 'words', amount: 0 })
}

function customAmount(kind: 'time' | 'words') {
  const label = kind === 'time' ? 'Seconds (10–1800)' : 'Words (1–500)'
  const value = Number(window.prompt(label))
  if (!Number.isFinite(value)) return
  const amount = Math.round(value)
  if (kind === 'time' && (amount < 10 || amount > 1800)) return
  if (kind === 'words' && (amount < 1 || amount > 500)) return
  emit('update', { mode: kind, contentType: 'words', amount })
}
</script>

<template>
  <div class="chrome mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 rounded-box border border-base-300/80 bg-base-200/80 px-3.5 py-2 text-xs backdrop-blur-xs">
    <div class="flex items-center gap-0.5">
      <button
        v-for="m in (['time', 'words', 'quote', 'code', 'zen', 'custom'] as const)"
        :key="m"
        type="button"
        class="btn btn-ghost btn-xs font-normal"
        :class="modeGroup === m ? 'bg-base-300 text-primary font-medium shadow-xs' : 'text-base-content/60 hover:text-base-content'"
        :disabled="disabled"
        @click="setMode(m)"
      >{{ m }}</button>
    </div>

    <span class="mx-1 h-3.5 w-px bg-base-content/15" />

    <div v-if="modeGroup === 'time' || modeGroup === 'words'" class="flex items-center gap-0.5">
      <button
        v-for="amount in amounts"
        :key="amount"
        type="button"
        class="btn btn-ghost btn-xs font-normal"
        :class="config.amount === amount ? 'bg-base-300 text-primary font-medium shadow-xs' : 'text-base-content/60 hover:text-base-content'"
        :disabled="disabled"
        @click="emit('update', { amount })"
      >{{ amount }}</button>
      <button
        v-if="modeGroup === 'time'"
        type="button"
        class="btn btn-ghost btn-xs font-normal"
        :class="config.amount === 180 ? 'bg-base-300 text-primary font-medium shadow-xs' : 'text-base-content/60 hover:text-base-content'"
        :disabled="disabled"
        @click="emit('update', { amount: 180 })"
      >3m</button>
      <button
        v-if="modeGroup === 'time'"
        type="button"
        class="btn btn-ghost btn-xs font-normal"
        :class="config.amount === 300 ? 'bg-base-300 text-primary font-medium shadow-xs' : 'text-base-content/60 hover:text-base-content'"
        :disabled="disabled"
        @click="emit('update', { amount: 300 })"
      >5m</button>
      <button type="button" class="btn btn-ghost btn-xs font-normal text-base-content/60 hover:text-base-content" :disabled="disabled" @click="customAmount(modeGroup === 'time' ? 'time' : 'words')">custom</button>
    </div>

    <template v-else-if="modeGroup === 'quote'">
      <select
        class="select select-ghost select-xs text-base-content/75 hover:text-primary font-medium focus:outline-none"
        :value="config.quoteLength"
        :disabled="disabled"
        aria-label="Quote length"
        @change="emit('update', { quoteLength: ($event.target as HTMLSelectElement).value as TestConfig['quoteLength'] })"
      >
        <option value="any">any length</option>
        <option value="short">short (&lt; 100)</option>
        <option value="medium">medium (100–300)</option>
        <option value="long">long (&gt; 300)</option>
      </select>
    </template>

    <template v-else-if="modeGroup === 'code'">
      <select
        class="select select-ghost select-xs text-base-content/75 hover:text-primary font-medium focus:outline-none"
        :value="config.codeLanguage"
        :disabled="disabled"
        aria-label="Code language"
        @change="emit('update', { codeLanguage: ($event.target as HTMLSelectElement).value })"
      >
        <option v-for="language in codeLanguages" :key="language.code" :value="language.code">{{ language.label }}</option>
      </select>
      <select
        class="select select-ghost select-xs text-base-content/75 hover:text-primary font-medium focus:outline-none"
        :value="config.codeLength"
        :disabled="disabled"
        aria-label="Code length"
        @change="emit('update', { codeLength: ($event.target as HTMLSelectElement).value as TestConfig['codeLength'] })"
      >
        <option value="short">short</option>
        <option value="medium">medium</option>
        <option value="long">long</option>
      </select>
    </template>

    <span class="mx-1 h-3.5 w-px bg-base-content/15" />

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="btn btn-ghost btn-xs font-normal transition-all"
        :class="config.punctuation ? 'bg-primary/15 text-primary border border-primary/30 font-medium' : 'text-base-content/50 hover:text-base-content'"
        :disabled="disabled"
        @click="emit('update', { punctuation: !config.punctuation })"
      >punctuation</button>
      <button
        type="button"
        class="btn btn-ghost btn-xs font-normal transition-all"
        :class="config.numbers ? 'bg-primary/15 text-primary border border-primary/30 font-medium' : 'text-base-content/50 hover:text-base-content'"
        :disabled="disabled"
        @click="emit('update', { numbers: !config.numbers })"
      >numbers</button>
    </div>

    <span class="mx-1 h-3.5 w-px bg-base-content/15" />

    <div class="flex items-center gap-1">
      <select
        class="select select-ghost select-xs text-base-content/75 hover:text-primary font-medium focus:outline-none"
        :value="config.language"
        :disabled="disabled"
        aria-label="Language"
        @change="emit('update', { language: ($event.target as HTMLSelectElement).value })"
      >
        <option v-for="language in availableLanguages" :key="language.code" :value="language.code">{{ language.label }}</option>
      </select>

      <select
        class="select select-ghost select-xs text-base-content/75 hover:text-primary font-medium focus:outline-none"
        :value="config.order"
        :disabled="disabled"
        aria-label="Word order"
        @change="emit('update', { order: ($event.target as HTMLSelectElement).value as TestConfig['order'] })"
      >
        <option value="random">random</option>
        <option value="sequential">sequential</option>
      </select>
    </div>

    <textarea
      v-if="modeGroup === 'custom'"
      class="textarea textarea-bordered textarea-sm mt-1 w-full bg-base-100 font-typing text-sm focus:border-primary"
      rows="3"
      placeholder="Paste or type your own text…"
      :value="config.customText"
      :disabled="disabled"
      @input="emit('update', { customText: ($event.target as HTMLTextAreaElement).value })"
    />
  </div>
</template>
