<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  nextChar?: string
  activeKey?: string
}>()

const emit = defineEmits<{
  toggle: []
}>()

// Active key codes currently pressed down
const pressedCodes = ref<Set<string>>(new Set())
const flashTimeouts = new Map<string, number>()

interface KeyDef {
  code: string
  label: string
  shiftLabel?: string
  char?: string
  shiftChar?: string
  flex?: number
  nub?: boolean
}

// All rows designed to sum up to exactly 14.8 flex units for perfect left-to-right alignment
const row1: KeyDef[] = [
  { code: 'Backquote', label: '`', shiftLabel: '~', char: '`', shiftChar: '~' },
  { code: 'Digit1', label: '1', shiftLabel: '!', char: '1', shiftChar: '!' },
  { code: 'Digit2', label: '2', shiftLabel: '@', char: '2', shiftChar: '@' },
  { code: 'Digit3', label: '3', shiftLabel: '#', char: '3', shiftChar: '#' },
  { code: 'Digit4', label: '4', shiftLabel: '$', char: '4', shiftChar: '$' },
  { code: 'Digit5', label: '5', shiftLabel: '%', char: '5', shiftChar: '%' },
  { code: 'Digit6', label: '6', shiftLabel: '^', char: '6', shiftChar: '^' },
  { code: 'Digit7', label: '7', shiftLabel: '&', char: '7', shiftChar: '&' },
  { code: 'Digit8', label: '8', shiftLabel: '*', char: '8', shiftChar: '*' },
  { code: 'Digit9', label: '9', shiftLabel: '(', char: '9', shiftChar: '(' },
  { code: 'Digit0', label: '0', shiftLabel: ')', char: '0', shiftChar: ')' },
  { code: 'Minus', label: '-', shiftLabel: '_', char: '-', shiftChar: '_' },
  { code: 'Equal', label: '=', shiftLabel: '+', char: '=', shiftChar: '+' },
  { code: 'Backspace', label: '⌫', flex: 1.8 },
]

const row2: KeyDef[] = [
  { code: 'Tab', label: 'tab', flex: 1.5 },
  { code: 'KeyQ', label: 'q', char: 'q', shiftChar: 'Q' },
  { code: 'KeyW', label: 'w', char: 'w', shiftChar: 'W' },
  { code: 'KeyE', label: 'e', char: 'e', shiftChar: 'E' },
  { code: 'KeyR', label: 'r', char: 'r', shiftChar: 'R' },
  { code: 'KeyT', label: 't', char: 't', shiftChar: 'T' },
  { code: 'KeyY', label: 'y', char: 'y', shiftChar: 'Y' },
  { code: 'KeyU', label: 'u', char: 'u', shiftChar: 'U' },
  { code: 'KeyI', label: 'i', char: 'i', shiftChar: 'I' },
  { code: 'KeyO', label: 'o', char: 'o', shiftChar: 'O' },
  { code: 'KeyP', label: 'p', char: 'p', shiftChar: 'P' },
  { code: 'BracketLeft', label: '[', shiftLabel: '{', char: '[', shiftChar: '{' },
  { code: 'BracketRight', label: ']', shiftLabel: '}', char: ']', shiftChar: '}' },
  { code: 'Backslash', label: '\\', shiftLabel: '|', char: '\\', shiftChar: '|', flex: 1.3 },
]

const row3: KeyDef[] = [
  { code: 'CapsLock', label: 'caps', flex: 1.75 },
  { code: 'KeyA', label: 'a', char: 'a', shiftChar: 'A' },
  { code: 'KeyS', label: 's', char: 's', shiftChar: 'S' },
  { code: 'KeyD', label: 'd', char: 'd', shiftChar: 'D' },
  { code: 'KeyF', label: 'f', char: 'f', shiftChar: 'F', nub: true },
  { code: 'KeyG', label: 'g', char: 'g', shiftChar: 'G' },
  { code: 'KeyH', label: 'h', char: 'h', shiftChar: 'H' },
  { code: 'KeyJ', label: 'j', char: 'j', shiftChar: 'J', nub: true },
  { code: 'KeyK', label: 'k', char: 'k', shiftChar: 'K' },
  { code: 'KeyL', label: 'l', char: 'l', shiftChar: 'L' },
  { code: 'Semicolon', label: ';', shiftLabel: ':', char: ';', shiftChar: ':' },
  { code: 'Quote', label: '\'', shiftLabel: '"', char: '\'', shiftChar: '"' },
  { code: 'Enter', label: 'enter', flex: 2.05 },
]

const row4: KeyDef[] = [
  { code: 'ShiftLeft', label: 'shift', flex: 2.15 },
  { code: 'KeyZ', label: 'z', char: 'z', shiftChar: 'Z' },
  { code: 'KeyX', label: 'x', char: 'x', shiftChar: 'X' },
  { code: 'KeyC', label: 'c', char: 'c', shiftChar: 'C' },
  { code: 'KeyV', label: 'v', char: 'v', shiftChar: 'V' },
  { code: 'KeyB', label: 'b', char: 'b', shiftChar: 'B' },
  { code: 'KeyN', label: 'n', char: 'n', shiftChar: 'N' },
  { code: 'KeyM', label: 'm', char: 'm', shiftChar: 'M' },
  { code: 'Comma', label: ',', shiftLabel: '<', char: ',', shiftChar: '<' },
  { code: 'Period', label: '.', shiftLabel: '>', char: '.', shiftChar: '>' },
  { code: 'Slash', label: '/', shiftLabel: '?', char: '/', shiftChar: '?' },
  { code: 'ShiftRight', label: 'shift', flex: 2.65 },
]

const row5: KeyDef[] = [
  { code: 'ControlLeft', label: 'ctrl', flex: 1.5 },
  { code: 'AltLeft', label: 'alt', flex: 1.25 },
  { code: 'Space', label: 'space', char: ' ', flex: 9.3 },
  { code: 'AltRight', label: 'alt', flex: 1.25 },
  { code: 'ControlRight', label: 'ctrl', flex: 1.5 },
]

const rows = [row1, row2, row3, row4, row5]

function triggerPress(code: string) {
  pressedCodes.value.add(code)
  if (flashTimeouts.has(code)) {
    window.clearTimeout(flashTimeouts.get(code))
  }
  const timer = window.setTimeout(() => {
    pressedCodes.value.delete(code)
    flashTimeouts.delete(code)
  }, 110)
  flashTimeouts.set(code, timer)
}

function onKeyDown(e: KeyboardEvent) {
  triggerPress(e.code)
  // Also handle key-based matching for symbols
  if (e.key === ' ') triggerPress('Space')
}

function onKeyUp(e: KeyboardEvent) {
  // Graceful release after timeout
}

// External trigger watch if prop updated
watch(() => props.activeKey, (val) => {
  if (!val) return
  if (val === ' ') triggerPress('Space')
  else if (val === 'Backspace') triggerPress('Backspace')
  else if (val === '\n') triggerPress('Enter')
  else {
    // Find matching key code
    for (const r of rows) {
      for (const k of r) {
        if (k.char === val || k.shiftChar === val) {
          triggerPress(k.code)
          return
        }
      }
    }
  }
})

// Check if a key is the target for nextChar
const targetKey = computed(() => {
  if (!props.nextChar) return null
  const c = props.nextChar
  if (c === ' ') return { code: 'Space', shift: false }
  if (c === '\n') return { code: 'Enter', shift: false }
  for (const r of rows) {
    for (const k of r) {
      if (k.char === c) return { code: k.code, shift: false }
      if (k.shiftChar === c) return { code: k.code, shift: true }
    }
  }
  return null
})

function isTarget(k: KeyDef): boolean {
  if (!targetKey.value) return false
  if (k.code === targetKey.value.code) return true
  if (targetKey.value.shift && (k.code === 'ShiftLeft' || k.code === 'ShiftRight')) return true
  return false
}

function isPressed(k: KeyDef): boolean {
  return pressedCodes.value.has(k.code)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  flashTimeouts.forEach(t => clearTimeout(t))
  flashTimeouts.clear()
})
</script>

<template>
  <div class="virtual-keyboard mx-auto w-full max-w-2xl select-none px-2 transition-all duration-200">
    <!-- Header with hint & toggle -->
    <div class="mb-2 flex items-center justify-between px-1 text-[11px] text-base-content/40 font-mono">
      <span class="flex items-center gap-1.5">
        <span class="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
        <span>Active Keyboard Animation</span>
      </span>
      <button
        type="button"
        class="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
        title="Hide keyboard visualizer"
        @click="$emit('toggle')"
      >
        <span>Hide</span>
        <X class="size-3" />
      </button>
    </div>

    <!-- Keyboard Frame -->
    <div class="space-y-1 sm:space-y-1.5 rounded-2xl border border-base-300/80 bg-base-200/50 p-2 sm:p-2.5 backdrop-blur-md shadow-lg shadow-black/10">
      <div
        v-for="(row, rIdx) in rows"
        :key="rIdx"
        class="flex w-full items-center gap-1 sm:gap-1.5"
      >
        <div
          v-for="k in row"
          :key="k.code"
          class="keycap relative flex h-7 sm:h-8 md:h-9 items-center justify-center rounded-md font-mono text-[10px] sm:text-xs transition-all duration-75 select-none"
          :class="[
            isPressed(k)
              ? 'is-pressed bg-primary text-primary-content font-bold shadow-md shadow-primary/30 translate-y-0.5 scale-[0.97]'
              : isTarget(k)
                ? 'bg-base-200 text-primary border border-primary/60 font-semibold ring-1 ring-primary/40'
                : 'bg-base-100/90 text-base-content/75 border border-base-300/70 hover:border-base-content/25',
          ]"
          :style="{ flex: k.flex ?? 1 }"
        >
          <!-- Dual labels for symbols/numbers -->
          <div v-if="k.shiftLabel && k.label" class="flex flex-col items-center leading-none py-0.5">
            <span class="text-[8px] sm:text-[9px] opacity-60">{{ k.shiftLabel }}</span>
            <span class="font-medium">{{ k.label }}</span>
          </div>

          <!-- Single label for letters/modifiers -->
          <span v-else class="capitalize font-medium tracking-tight">
            {{ k.label }}
          </span>

          <!-- Home row tactile nubs (F and J) -->
          <span
            v-if="k.nub && !isPressed(k)"
            class="absolute bottom-1 h-0.5 w-2 rounded-full bg-base-content/30"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-keyboard {
  user-select: none;
  -webkit-user-select: none;
}

.keycap {
  touch-action: manipulation;
  will-change: transform, background-color;
}

.keycap.is-pressed {
  animation: keypop 90ms ease-out;
}

@keyframes keypop {
  0% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(0.95) translateY(1.5px);
  }
  100% {
    transform: scale(0.97) translateY(1px);
  }
}
</style>
