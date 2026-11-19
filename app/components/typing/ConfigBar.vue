<script setup lang="ts">
import { amountOptions, type TestConfig } from '#shared/config/modes'
import { availableLanguages, codeLanguages } from '#shared/config/languages'
import { Volume2, VolumeX, Keyboard, ChevronDown, Check, Sliders } from 'lucide-vue-next'

const props = defineProps<{ config: TestConfig; disabled?: boolean }>()
const emit = defineEmits<{ update: [patch: Partial<TestConfig>] }>()

const modeGroup = computed(() => props.config.mode)
const amounts = computed(() => amountOptions[props.config.mode] ?? [])

const dialog = useDialog()
const { settings } = storeToRefs(useSettingsStore())
const soundService = useSound()

function setSoundPack(pack: 'mechanical' | 'typewriter' | 'soft') {
  settings.value.sound.pack = pack
  settings.value.sound.enabled = true
  soundService.preview(pack, settings.value.sound.volume)
}

function setCaretStyle(style: 'line' | 'block' | 'underline' | 'outline') {
  settings.value.appearance.caretStyle = style
}

const isLiveHud = computed({
  get: () => settings.value.appearance.showLiveWpm && settings.value.appearance.showLiveAccuracy,
  set: (val: boolean) => {
    settings.value.appearance.showLiveWpm = val
    settings.value.appearance.showLiveAccuracy = val
  },
})

const isStrict = computed({
  get: () => settings.value.behavior.stopOnError !== 'off',
  set: (val: boolean) => {
    settings.value.behavior.stopOnError = val ? 'letter' : 'off'
  },
})

function toggleKeyboard() {
  settings.value.appearance.showKeyboard = !settings.value.appearance.showKeyboard
}

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
  <div class="chrome relative z-30 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 rounded-2xl border border-base-300/70 bg-base-200/90 px-5 py-2.5 text-sm shadow-xs">
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

    <!-- Divider -->
    <span class="h-4 w-px bg-base-content/15" />

    <!-- 5. TACTILE & IMMERSION (Sound & Virtual Keyboard) -->
    <div class="flex items-center gap-1.5">
      <!-- Sound FX Quick Popover -->
      <div class="dropdown dropdown-bottom dropdown-end">
        <button
          tabindex="0"
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors cursor-pointer"
          :class="settings.sound.enabled
            ? 'bg-primary/15 text-primary font-semibold shadow-2xs'
            : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
          :disabled="disabled"
          title="Sound Effects & Switch Packs"
        >
          <Volume2 v-if="settings.sound.enabled" class="size-3.5 shrink-0 text-primary" />
          <VolumeX v-else class="size-3.5 shrink-0 opacity-60" />
          <span class="hidden md:inline capitalize">{{ settings.sound.enabled ? settings.sound.pack : 'sound: off' }}</span>
          <ChevronDown class="size-3 opacity-40 shrink-0" />
        </button>

        <div
          tabindex="0"
          class="dropdown-content z-50 mt-2 w-72 rounded-2xl border border-base-300 bg-base-200 p-3.5 shadow-2xl font-mono text-xs"
          style="background-color: var(--color-base-200) !important;"
        >
          <!-- Master Sound Toggle -->
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-base-300/60">
            <span class="font-bold text-base-content text-xs flex items-center gap-1.5">
              <Volume2 class="size-3.5 text-primary" />
              <span>Sound Effects</span>
            </span>
            <input
              v-model="settings.sound.enabled"
              type="checkbox"
              class="toggle toggle-primary toggle-xs"
              @change="settings.sound.enabled && soundService.preview(settings.sound.pack, settings.sound.volume)"
            >
          </div>

          <!-- Switch Pack Selector -->
          <div class="space-y-1 py-1">
            <span class="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold">Switch Pack:</span>
            <div class="grid grid-cols-1 gap-1 pt-1">
              <button
                v-for="p in ([
                  { id: 'mechanical', label: 'Mechanical', desc: 'Clicky switch (220Hz)' },
                  { id: 'typewriter', label: 'Typewriter', desc: 'Vintage strike (140Hz)' },
                  { id: 'soft', label: 'Soft', desc: 'Creamy linear (320Hz)' },
                ] as const)"
                :key="p.id"
                type="button"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all"
                :class="settings.sound.enabled && settings.sound.pack === p.id
                  ? 'border-primary/50 bg-primary/10 text-primary font-bold shadow-2xs'
                  : 'border-transparent hover:bg-base-300/60 text-base-content/75'"
                @click="setSoundPack(p.id)"
              >
                <div>
                  <div class="text-xs">{{ p.label }}</div>
                  <div class="text-[10px] opacity-60 font-sans">{{ p.desc }}</div>
                </div>
                <Check v-if="settings.sound.enabled && settings.sound.pack === p.id" class="size-3.5 text-primary shrink-0" />
              </button>
            </div>
          </div>

          <!-- Volume Slider -->
          <div class="pt-2 mt-2 border-t border-base-300/60 space-y-1">
            <div class="flex items-center justify-between text-[10px] text-base-content/60">
              <span>Volume</span>
              <span class="font-bold text-primary">{{ Math.round((settings.sound.volume ?? 0.4) * 100) }}%</span>
            </div>
            <input
              v-model.number="settings.sound.volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="range range-primary range-xs w-full"
              @input="settings.sound.enabled && soundService.preview(settings.sound.pack, settings.sound.volume)"
            >
          </div>
        </div>
      </div>

      <!-- Feel & Display Popover (Caret, Live HUD, Blind Mode, Strict Mode) -->
      <div class="dropdown dropdown-bottom dropdown-end">
        <button
          tabindex="0"
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors cursor-pointer"
          :class="(settings.behavior.blindMode || isStrict || isLiveHud || settings.appearance.caretStyle !== 'line')
            ? 'bg-primary/15 text-primary font-semibold shadow-2xs'
            : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
          :disabled="disabled"
          title="Feel & Telemetry Display Controls"
        >
          <Sliders class="size-3.5 shrink-0" />
          <span class="hidden md:inline capitalize">feel: {{ settings.appearance.caretStyle }}</span>
          <ChevronDown class="size-3 opacity-40 shrink-0" />
        </button>

        <div
          tabindex="0"
          class="dropdown-content z-50 mt-2 w-72 rounded-2xl border border-base-300 bg-base-200 p-3.5 shadow-2xl font-mono text-xs"
          style="background-color: var(--color-base-200) !important;"
        >
          <!-- Caret Style Selector -->
          <div class="space-y-1 pb-2 border-b border-base-300/60">
            <span class="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold">Caret Style:</span>
            <div class="grid grid-cols-4 gap-1 pt-1">
              <button
                v-for="c in ([
                  { id: 'line', label: '| Line' },
                  { id: 'block', label: '█ Block' },
                  { id: 'underline', label: '_ Under' },
                  { id: 'outline', label: '▢ Box' },
                ] as const)"
                :key="c.id"
                type="button"
                class="px-1.5 py-1.5 rounded-xl border text-center transition-all text-xs"
                :class="settings.appearance.caretStyle === c.id
                  ? 'border-primary/50 bg-primary/15 text-primary font-bold shadow-2xs'
                  : 'border-base-300/40 bg-base-100/40 hover:bg-base-300/60 text-base-content/75'"
                @click="setCaretStyle(c.id)"
              >
                {{ c.label }}
              </button>
            </div>
          </div>

          <!-- Telemetry HUD Toggle -->
          <div class="flex items-center justify-between py-2 border-b border-base-300/60">
            <div>
              <div class="font-bold text-base-content text-xs">Live Speedometer</div>
              <div class="text-[10px] opacity-60 font-sans">Realtime WPM & Accuracy HUD</div>
            </div>
            <input
              v-model="isLiveHud"
              type="checkbox"
              class="toggle toggle-primary toggle-xs"
            >
          </div>

          <!-- Blind Mode Toggle -->
          <div class="flex items-center justify-between py-2 border-b border-base-300/60">
            <div>
              <div class="font-bold text-base-content text-xs">Blind Mode</div>
              <div class="text-[10px] opacity-60 font-sans">Hide red errors until test ends</div>
            </div>
            <input
              v-model="settings.behavior.blindMode"
              type="checkbox"
              class="toggle toggle-primary toggle-xs"
            >
          </div>

          <!-- Strict Mode Toggle -->
          <div class="flex items-center justify-between pt-2">
            <div>
              <div class="font-bold text-base-content text-xs">Strict Mode</div>
              <div class="text-[10px] opacity-60 font-sans">Must fix error to continue</div>
            </div>
            <input
              v-model="isStrict"
              type="checkbox"
              class="toggle toggle-primary toggle-xs"
            >
          </div>
        </div>
      </div>

      <!-- Keyboard Visualizer Toggle Button -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors cursor-pointer"
        :class="settings.appearance.showKeyboard
          ? 'bg-primary/15 text-primary font-semibold shadow-2xs'
          : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'"
        :disabled="disabled"
        title="Toggle Mechanical Virtual Keyboard Visualizer"
        @click="toggleKeyboard"
      >
        <Keyboard class="size-3.5 shrink-0" :class="settings.appearance.showKeyboard ? 'text-primary' : 'opacity-70'" />
        <span class="hidden md:inline">keyboard: {{ settings.appearance.showKeyboard ? 'on' : 'off' }}</span>
      </button>
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
