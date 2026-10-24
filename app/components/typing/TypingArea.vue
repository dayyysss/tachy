<script setup lang="ts">
const props = defineProps<{
  words: string[]
  typed: string[]
  cursor: number
  disabled?: boolean
  fontFamily?: 'mono' | 'sans'
  fontSize?: number
  textWidth?: 'narrow' | 'medium' | 'wide'
  blind?: boolean
  quickRestart?: 'tab' | 'esc' | 'both'
  caretStyle?: 'line' | 'block' | 'underline' | 'outline'
  smoothCaret?: boolean
}>()

const emit = defineEmits<{ press: [key: string]; restart: [] }>()

const inputEl = ref<HTMLInputElement | null>(null)

const widthClass = computed(() => ({
  'max-w-2xl': props.textWidth === 'narrow',
  'max-w-4xl': props.textWidth === 'medium' || !props.textWidth,
  'max-w-6xl': props.textWidth === 'wide',
}))

const fontClass = computed(() => (props.fontFamily === 'sans' ? 'font-sans' : 'font-typing'))
const caretStyleClass = computed(() => `caret--${props.caretStyle || 'line'}`)

function typedFor(index: number): string {
  return props.typed[index] ?? ''
}

function charClass(wordIndex: number, charIndex: number): string {
  const typed = typedFor(wordIndex)
  if (charIndex >= typed.length) return 'typing-char--pending'
  if (props.blind) return 'typing-char--correct'
  return typed[charIndex] === props.words[wordIndex]![charIndex] ? 'typing-char--correct' : 'typing-char--incorrect'
}

function showCaret(wordIndex: number, charIndex: number): boolean {
  return wordIndex === props.cursor && charIndex === typedFor(wordIndex).length
}

function caretAtEnd(wordIndex: number): boolean {
  return wordIndex === props.cursor && typedFor(wordIndex).length >= (props.words[wordIndex]?.length ?? 0)
}

function extraChars(wordIndex: number): string[] {
  const word = props.words[wordIndex] ?? ''
  return typedFor(wordIndex).slice(word.length).split('')
}

function focus() {
  inputEl.value?.focus({ preventScroll: true })
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  if (event.metaKey || event.ctrlKey || event.altKey) return

  const restartRule = props.quickRestart ?? 'both'
  const isRestartKey = (restartRule === 'both' && (event.key === 'Tab' || event.key === 'Escape'))
    || (restartRule === 'tab' && event.key === 'Tab')
    || (restartRule === 'esc' && event.key === 'Escape')

  if (isRestartKey) {
    event.preventDefault()
    emit('restart')
    return
  }

  if (event.key === 'Backspace') {
    event.preventDefault()
    emit('press', 'Backspace')
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    emit('press', '\n')
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    emit('press', ' ')
    return
  }

  if (event.key.length === 1) {
    event.preventDefault()
    emit('press', event.key)
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
}

onMounted(() => {
  focus()
})

defineExpose({ focus })
</script>

<template>
  <div
    class="relative mx-auto w-full cursor-text select-none px-2"
    :class="widthClass"
    @click="focus"
  >
    <input
      ref="inputEl"
      class="sr-only"
      type="text"
      inputmode="text"
      autocomplete="off"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
      aria-label="Typing input"
      :disabled="disabled"
      @keydown="onKeydown"
      @paste="onPaste"
    >
    <div
      class="flex flex-wrap content-start transition-opacity duration-150"
      :class="fontClass"
      :style="{ fontSize: `${fontSize ?? 1.5}rem` }"
      :aria-disabled="disabled"
    >
      <span
        v-for="(word, wordIndex) in words"
        :key="wordIndex"
        class="typing-word"
        :class="{ 'typing-word--active': wordIndex === cursor }"
      >
        <template v-for="(char, charIndex) in word.split('')" :key="charIndex">
          <span v-if="showCaret(wordIndex, charIndex)" class="typing-char--caret" :class="caretStyleClass" />
          <span :class="charClass(wordIndex, charIndex)">{{ char }}</span>
        </template>
        <span
          v-for="(extra, extraIndex) in extraChars(wordIndex)"
          :key="`extra-${extraIndex}`"
          class="typing-char--extra"
          :class="{ 'opacity-0': blind }"
        >{{ extra }}</span>
        <span v-if="caretAtEnd(wordIndex)" class="typing-char--caret" :class="caretStyleClass" />
      </span>
    </div>
    <p class="mt-4 text-center text-xs opacity-40 md:hidden">Physical keyboard recommended</p>
  </div>
</template>
