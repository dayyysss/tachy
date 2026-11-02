<script setup lang="ts">
import { amountOptions, type TestConfig } from '#shared/config/modes'
import { availableLanguages, codeLanguages } from '#shared/config/languages'

const props = defineProps<{ config: TestConfig; disabled?: boolean }>()
const emit = defineEmits<{ update: [patch: Partial<TestConfig>] }>()

const modeGroup = computed(() => props.config.mode)
const amounts = computed(() => amountOptions[props.config.mode] ?? [])

const dialog = useDialog()

function setMode(mode: 'time' | 'words' | 'quote' | 'code' | 'zen' | 'custom') {
  if (mode === 'time') emit('update', { mode, contentType: 'words', amount: props.config.mode === 'time' ? props.config.amount : 30 })
  else if (mode === 'words') emit('update', { mode, contentType: 'words', amount: [10, 25, 50, 100].includes(props.config.amount) ? props.config.amount : 25 })
  else if (mode === 'quote') emit('update', { mode, contentType: 'quotes', amount: 0 })
  else if (mode === 'code') emit('update', { mode, contentType: 'code', amount: 0 })
  else if (mode === 'zen') emit('update', { mode, contentType: 'words', amount: 0 })
  else emit('update', { mode: 'custom', contentType: 'words', amount: 0 })
}

async function customAmount(kind: 'time' | 'words') {
  const isTime = kind === 'time'
  const input = await dialog.prompt({
    title: isTime ? 'Custom Test Duration' : 'Custom Word Count',
    message: isTime
      ? 'Enter target duration in seconds (10 to 1800):'
      : 'Enter number of words to generate (1 to 500):',
    placeholder: isTime ? '60' : '50',
    defaultValue: String(props.config.amount || (isTime ? 60 : 50)),
    inputType: 'number',
    confirmText: 'Apply',
  })

  if (input === null) return
  const value = Number(input)
  if (!Number.isFinite(value)) return
  const amount = Math.round(value)
  if (isTime && (amount < 10 || amount > 1800)) return
  if (!isTime && (amount < 1 || amount > 500)) return
  emit('update', { mode: kind, contentType: 'words', amount })
}
</script>

<template>
  <div class="chrome mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 rounded-2xl border border-base-300/70 bg-base-200/60 px-5 py-2.5 text-sm backdrop-blur-md shadow-xs">
    <!-- 1. MODIFIERS (Punctuation & Numbers) -->
    <div class="flex items-center gap-1.5">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors"
        :class="config.punctuation
          ? 'bg-primary/15 text-primary font-semibold'
          : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
        :disabled="disabled"
        title="Toggle punctuation"
        @click="emit('update', { punctuation: !config.punctuation })"
      >
        <svg class="size-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
        </svg>
        <span>punctuation</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors"
        :class="config.numbers
          ? 'bg-primary/15 text-primary font-semibold'
          : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
        :disabled="disabled"
        title="Toggle numbers"
        @click="emit('update', { numbers: !config.numbers })"
      >
        <svg class="size-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
        <span>numbers</span>
      </button>
    </div>

    <!-- Divider -->
    <span class="h-4 w-px bg-base-content/15" />

    <!-- 2. MODE SELECTOR (time, words, quote, code, zen, custom) -->
    <div class="flex items-center gap-1">
      <button
        v-for="m in (['time', 'words', 'quote', 'code', 'zen', 'custom'] as const)"
        :key="m"
        type="button"
        class="rounded-lg px-2.5 py-1 text-sm font-medium transition-colors"
        :class="modeGroup === m
          ? 'bg-base-300 text-primary font-semibold shadow-xs'
          : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
        :disabled="disabled"
        @click="setMode(m)"
      >
        {{ m }}
      </button>
    </div>

    <!-- Divider -->
    <span class="h-4 w-px bg-base-content/15" />

    <!-- 3. AMOUNTS / DYNAMIC SUB-OPTIONS -->
    <!-- Time / Words amounts -->
    <div v-if="modeGroup === 'time' || modeGroup === 'words'" class="flex items-center gap-1">
      <button
        v-for="amount in amounts"
        :key="amount"
        type="button"
        class="rounded-lg px-2.5 py-1 text-sm font-medium transition-colors"
        :class="config.amount === amount
          ? 'bg-base-300 text-primary font-semibold shadow-xs'
          : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
        :disabled="disabled"
        @click="emit('update', { amount })"
      >
        {{ amount }}
      </button>

      <template v-if="modeGroup === 'time'">
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 text-sm font-medium transition-colors"
          :class="config.amount === 180
            ? 'bg-base-300 text-primary font-semibold shadow-xs'
            : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
          :disabled="disabled"
          @click="emit('update', { amount: 180 })"
        >
          3m
        </button>

        <button
          type="button"
          class="rounded-lg px-2.5 py-1 text-sm font-medium transition-colors"
          :class="config.amount === 300
            ? 'bg-base-300 text-primary font-semibold shadow-xs'
            : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
          :disabled="disabled"
          @click="emit('update', { amount: 300 })"
        >
          5m
        </button>
      </template>

      <button
        type="button"
        class="rounded-lg px-2 py-1 text-sm font-medium text-base-content/50 hover:text-base-content hover:bg-base-300/40 transition-colors"
        :disabled="disabled"
        title="Set custom duration or words"
        @click="customAmount(modeGroup === 'time' ? 'time' : 'words')"
      >
        custom
      </button>
    </div>

    <!-- Quote length -->
    <template v-else-if="modeGroup === 'quote'">
      <div class="flex items-center gap-1.5">
        <select
          class="select select-ghost select-sm text-sm font-medium text-base-content/80 hover:text-primary focus:text-primary focus:outline-none pl-2.5 pr-7 bg-transparent border-0 cursor-pointer"
          :value="config.quoteLength"
          :disabled="disabled"
          aria-label="Quote length"
          @change="emit('update', { quoteLength: ($event.target as HTMLSelectElement).value as TestConfig['quoteLength'] })"
        >
          <option value="any">all lengths</option>
          <option value="short">short (&lt; 100)</option>
          <option value="medium">medium (100–300)</option>
          <option value="long">long (&gt; 300)</option>
        </select>
      </div>
    </template>

    <!-- Code language & length -->
    <template v-else-if="modeGroup === 'code'">
      <div class="flex items-center gap-2">
        <select
          class="select select-ghost select-sm text-sm font-medium text-base-content/80 hover:text-primary focus:text-primary focus:outline-none pl-2.5 pr-7 bg-transparent border-0 cursor-pointer"
          :value="config.codeLanguage"
          :disabled="disabled"
          aria-label="Code language"
          @change="emit('update', { codeLanguage: ($event.target as HTMLSelectElement).value })"
        >
          <option v-for="language in codeLanguages" :key="language.code" :value="language.code">{{ language.label }}</option>
        </select>

        <select
          class="select select-ghost select-sm text-sm font-medium text-base-content/80 hover:text-primary focus:text-primary focus:outline-none pl-2.5 pr-7 bg-transparent border-0 cursor-pointer"
          :value="config.codeLength"
          :disabled="disabled"
          aria-label="Code length"
          @change="emit('update', { codeLength: ($event.target as HTMLSelectElement).value as TestConfig['codeLength'] })"
        >
          <option value="short">short</option>
          <option value="medium">medium</option>
          <option value="long">long</option>
        </select>
      </div>
    </template>

    <!-- Divider -->
    <span class="h-4 w-px bg-base-content/15" />

    <!-- 4. LANGUAGE & ORDER -->
    <div class="flex items-center gap-2">
      <div class="relative flex items-center">
        <svg class="pointer-events-none absolute left-2 size-3.5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
        </svg>
        <select
          class="select select-ghost select-sm text-sm font-medium text-base-content/80 hover:text-primary focus:text-primary focus:outline-none pl-7 pr-7 bg-transparent border-0 cursor-pointer"
          :value="config.language"
          :disabled="disabled"
          aria-label="Language"
          @change="emit('update', { language: ($event.target as HTMLSelectElement).value })"
        >
          <option v-for="language in availableLanguages" :key="language.code" :value="language.code">{{ language.label }}</option>
        </select>
      </div>

      <div class="relative flex items-center">
        <svg v-if="config.order === 'random'" class="pointer-events-none absolute left-2 size-3.5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
        </svg>
        <svg v-else class="pointer-events-none absolute left-2 size-3.5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 12h16m-7-7 7 7-7 7" />
        </svg>
        <select
          class="select select-ghost select-sm text-sm font-medium text-base-content/80 hover:text-primary focus:text-primary focus:outline-none pl-7 pr-7 bg-transparent border-0 cursor-pointer"
          :value="config.order"
          :disabled="disabled"
          aria-label="Word order"
          @change="emit('update', { order: ($event.target as HTMLSelectElement).value as TestConfig['order'] })"
        >
          <option value="random">random</option>
          <option value="sequential">sequential</option>
        </select>
      </div>
    </div>

    <!-- Custom text drawer if custom mode -->
    <div v-if="modeGroup === 'custom'" class="w-full mt-3 pt-3 border-t border-base-300/40">
      <textarea
        class="textarea textarea-bordered textarea-sm w-full bg-base-100 font-typing text-sm focus:border-primary"
        rows="3"
        placeholder="Paste or type custom words here…"
        :value="config.customText"
        :disabled="disabled"
        @input="emit('update', { customText: ($event.target as HTMLTextAreaElement).value })"
      />
    </div>
  </div>
</template>
