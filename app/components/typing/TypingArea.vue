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
  showKeyboard?: boolean
}>()

const emit = defineEmits<{ press: [key: string]; restart: []; toggleKeyboard: [] }>()

const inputEl = ref<HTMLInputElement | null>(null)
const wordsBoxEl = ref<HTMLElement | null>(null)
const wordRefs = ref<(HTMLElement | null)[]>([])

const caretX = ref(0)
const caretY = ref(0)
const caretWidth = ref(0)
const caretHeight = ref(0)
const caretVisible = ref(false)
const isSmooth = ref(false)
const isTyping = ref(false)
const lastPressedKey = ref('')

let lastCaretY = -1
let typingTimer: ReturnType<typeof setTimeout> | null = null

const nextChar = computed(() => {
  const currentWord = props.words[props.cursor] ?? ''
  const currentTyped = props.typed[props.cursor] ?? ''
  if (currentTyped.length < currentWord.length) {
    return currentWord[currentTyped.length]
  }
  return ' '
})

const widthClass = computed(() => ({
  'max-w-4xl': props.textWidth === 'narrow',
  'max-w-6xl': props.textWidth === 'medium' || !props.textWidth,
  'max-w-7xl': props.textWidth === 'wide',
}))

function getElementOffset(el: HTMLElement, container: HTMLElement) {
  let x = 0
  let y = 0
  let curr: HTMLElement | null = el
  while (curr && curr !== container) {
    x += curr.offsetLeft
    y += curr.offsetTop
    curr = curr.offsetParent as HTMLElement | null
  }
  return { x, y }
}

function updateCaret(forceSnap = false) {
  if (!wordsBoxEl.value || !wordRefs.value[props.cursor]) {
    caretVisible.value = false
    return
  }

  const currentWordEl = wordRefs.value[props.cursor]!
  const typedLen = typedFor(props.cursor).length
  const charEls = currentWordEl.querySelectorAll<HTMLElement>('.typing-char')

  if (charEls.length === 0) {
    caretVisible.value = false
    return
  }

  let targetX = 0
  let targetY = 0
  let w = 0
  let h = 0

  if (typedLen < charEls.length) {
    const targetEl = charEls[typedLen]!
    const pos = getElementOffset(targetEl, wordsBoxEl.value)
    targetX = pos.x
    targetY = pos.y
    w = targetEl.offsetWidth
    h = targetEl.offsetHeight
  } else {
    const lastEl = charEls[charEls.length - 1]!
    const pos = getElementOffset(lastEl, wordsBoxEl.value)
    targetX = pos.x + lastEl.offsetWidth
    targetY = pos.y
    w = lastEl.offsetWidth
    h = lastEl.offsetHeight
  }

  const isLineJump = lastCaretY !== -1 && Math.abs(targetY - lastCaretY) > 8
  const isReset = props.cursor === 0 && typedLen === 0

  if (forceSnap || isLineJump || isReset || props.smoothCaret === false) {
    isSmooth.value = false
    if (props.smoothCaret !== false && !isReset && !forceSnap) {
      requestAnimationFrame(() => {
        isSmooth.value = true
      })
    }
  } else {
    isSmooth.value = true
  }

  caretX.value = targetX
  caretY.value = targetY
  if (w > 0) caretWidth.value = w
  if (h > 0) caretHeight.value = h
  caretVisible.value = true
  lastCaretY = targetY

  isTyping.value = true
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    isTyping.value = false
  }, 450)
}

function updateScroll() {
  if (!wordsBoxEl.value || !wordRefs.value[props.cursor]) return
  const currentEl = wordRefs.value[props.cursor]!
  const container = wordsBoxEl.value
  const wordTop = currentEl.offsetParent === container ? currentEl.offsetTop : currentEl.offsetTop - container.offsetTop
  const lineHeight = currentEl.offsetHeight || 38

  if (wordTop <= lineHeight * 0.8) {
    container.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    container.scrollTo({ top: wordTop - lineHeight, behavior: 'smooth' })
  }
}

watch(() => props.cursor, () => {
  nextTick(() => {
    updateScroll()
    updateCaret()
  })
})

watch(() => props.typed, () => {
  nextTick(() => {
    updateCaret()
  })
}, { deep: true })

watch(() => props.words, () => {
  wordRefs.value = []
  lastCaretY = -1
  if (wordsBoxEl.value) {
    wordsBoxEl.value.scrollTop = 0
  }
  nextTick(() => {
    updateCaret(true)
  })
})

watch([() => props.fontSize, () => props.fontFamily, () => props.textWidth], () => {
  nextTick(() => {
    updateCaret(true)
    updateScroll()
  })
})

const fontClass = computed(() => (props.fontFamily === 'sans' ? 'font-sans' : 'font-typing'))
const caretStyleClass = computed(() => `caret--${props.caretStyle || 'line'}`)
const caretInlineStyle = computed(() => {
  const style: Record<string, string> = {
    transform: `translate3d(${caretX.value}px, ${caretY.value}px, 0)`,
  }
  if (caretHeight.value > 0) {
    style.height = `${caretHeight.value}px`
  }
  if (props.caretStyle === 'block' || props.caretStyle === 'underline' || props.caretStyle === 'outline') {
    if (caretWidth.value > 0) {
      style.width = `${caretWidth.value}px`
    }
  }
  return style
})

function typedFor(index: number): string {
  return props.typed[index] ?? ''
}

function charClass(wordIndex: number, charIndex: number): string {
  const typed = typedFor(wordIndex)
  if (charIndex >= typed.length) return 'typing-char--pending'
  if (props.blind) return 'typing-char--correct'
  return typed[charIndex] === props.words[wordIndex]![charIndex] ? 'typing-char--correct' : 'typing-char--incorrect'
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
    lastPressedKey.value = 'Backspace'
    emit('press', 'Backspace')
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    lastPressedKey.value = '\n'
    emit('press', '\n')
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    lastPressedKey.value = ' '
    emit('press', ' ')
    return
  }

  if (event.key.length === 1) {
    event.preventDefault()
    lastPressedKey.value = event.key
    emit('press', event.key)
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  if (event.metaKey || event.ctrlKey || event.altKey) return

  const target = event.target as HTMLElement
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
    if (target === inputEl.value) return
    return
  }

  focus()
  onKeydown(event)
}

function onGlobalClick(event: MouseEvent) {
  if (props.disabled) return
  const target = event.target as HTMLElement
  if (target && (target.tagName === 'BUTTON' || target.tagName === 'A' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.closest('button') || target.closest('a') || target.closest('.dropdown'))) {
    return
  }
  focus()
}

function onResize() {
  updateCaret(true)
  updateScroll()
}

onMounted(() => {
  focus()
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('click', onGlobalClick)
  window.addEventListener('resize', onResize)
  nextTick(() => {
    updateCaret(true)
  })
  if (typeof document !== 'undefined' && 'fonts' in document) {
    document.fonts.ready.then(() => {
      updateCaret(true)
    })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('click', onGlobalClick)
  window.removeEventListener('resize', onResize)
  if (typingTimer) clearTimeout(typingTimer)
})

defineExpose({ focus })
</script>

<template>
  <div
    class="relative mx-auto w-full cursor-text select-none px-4 sm:px-8 md:px-12"
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
      ref="wordsBoxEl"
      class="words-viewport relative flex flex-wrap content-start transition-opacity duration-150 overflow-hidden"
      :class="fontClass"
      :style="{ fontSize: `${fontSize ?? 1.5}rem`, height: '4.8em' }"
      :aria-disabled="disabled"
    >
      <!-- Smooth Caret -->
      <div
        v-show="caretVisible"
        class="typing-caret"
        :class="[
          caretStyleClass,
          {
            'typing-caret--smooth': smoothCaret !== false && isSmooth,
            'typing-caret--typing': isTyping,
          },
        ]"
        :style="caretInlineStyle"
      />

      <span
        v-for="(word, wordIndex) in words"
        :key="wordIndex"
        :ref="el => { if (el) wordRefs[wordIndex] = el as HTMLElement }"
        class="typing-word"
        :class="{ 'typing-word--active': wordIndex === cursor }"
      >
        <span
          v-for="(char, charIndex) in word.split('')"
          :key="charIndex"
          class="typing-char"
          :class="charClass(wordIndex, charIndex)"
        >{{ char }}</span>
        <span
          v-for="(extra, extraIndex) in extraChars(wordIndex)"
          :key="`extra-${extraIndex}`"
          class="typing-char typing-char--extra"
          :class="{ 'opacity-0': blind }"
        >{{ extra }}</span>
      </span>
    </div>
    <!-- Active Keyboard Animation (Keymap) -->
    <div v-if="showKeyboard" class="mt-8">
      <VirtualKeyboard
        :next-char="nextChar"
        :active-key="lastPressedKey"
        @toggle="$emit('toggleKeyboard')"
      />
    </div>
    <p class="mt-4 text-center text-xs opacity-40 md:hidden">Physical keyboard recommended</p>
  </div>
</template>
