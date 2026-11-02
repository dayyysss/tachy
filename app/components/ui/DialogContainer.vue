<script setup lang="ts">
const { current, close } = useDialog()
const inputEl = ref<HTMLInputElement | null>(null)

watch(current, (val) => {
  if (val?.type === 'prompt') {
    nextTick(() => {
      inputEl.value?.focus()
      inputEl.value?.select()
    })
  }
})

function handleConfirm() {
  if (!current.value) return
  if (current.value.type === 'prompt') {
    close(current.value.inputValue)
  } else {
    close(true)
  }
}

function handleCancel() {
  if (!current.value) return
  close(current.value.type === 'prompt' ? null : false)
}

function onKeydown(e: KeyboardEvent) {
  if (!current.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    handleCancel()
  } else if (e.key === 'Enter' && current.value.type === 'prompt') {
    e.preventDefault()
    handleConfirm()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="current"
        class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="w-full max-w-md rounded-2xl border bg-base-100 p-6 shadow-2xl font-mono text-sm space-y-4"
          :class="current.danger ? 'border-error/40' : 'border-base-300'"
          role="dialog"
          aria-modal="true"
        >
          <!-- Title & Icon -->
          <div class="flex items-start gap-3">
            <div
              class="rounded-xl p-2.5 shrink-0"
              :class="current.danger ? 'bg-error/15 text-error' : 'bg-primary/15 text-primary'"
            >
              <!-- Alert icon for danger -->
              <svg v-if="current.danger" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <!-- Prompt / Edit icon -->
              <svg v-else-if="current.type === 'prompt'" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <!-- Question / Confirm icon -->
              <svg v-else class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-base-content font-sans tracking-tight">
                {{ current.title }}
              </h3>
              <p v-if="current.message" class="mt-1 text-xs text-base-content/60 font-sans leading-relaxed">
                {{ current.message }}
              </p>
            </div>
          </div>

          <!-- Input for Prompt -->
          <div v-if="current.type === 'prompt'" class="pt-1">
            <input
              ref="inputEl"
              v-model="current.inputValue"
              :type="current.inputType || 'text'"
              :placeholder="current.placeholder || 'Type here…'"
              class="input input-bordered input-sm w-full bg-base-100 font-mono text-sm focus:border-primary"
            >
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-base-300/60">
            <button
              type="button"
              class="btn btn-sm btn-ghost text-xs font-mono font-normal text-base-content/70 hover:text-base-content"
              @click="handleCancel"
            >
              {{ current.cancelText || 'Cancel' }}
            </button>
            <button
              type="button"
              class="btn btn-sm font-semibold shadow-xs"
              :class="current.danger ? 'btn-error' : 'btn-primary text-primary-content'"
              @click="handleConfirm"
            >
              {{ current.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
}
</style>
