<script setup lang="ts">
const { toasts, remove } = useToast()
</script>

<template>
  <div class="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2 p-2 sm:bottom-6 sm:right-6">
    <TransitionGroup name="toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="pointer-events-auto flex items-center justify-between gap-3 rounded-box border bg-base-200/95 p-3.5 shadow-2xl backdrop-blur-md transition-all font-mono text-xs"
        :class="{
          'border-success/40 text-success': item.type === 'success',
          'border-error/40 text-error': item.type === 'error',
          'border-warning/40 text-warning': item.type === 'warning',
          'border-info/40 text-info': item.type === 'info',
        }"
        role="alert"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Success icon -->
          <svg v-if="item.type === 'success'" class="size-4 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>

          <!-- Error icon -->
          <svg v-else-if="item.type === 'error'" class="size-4 shrink-0 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>

          <!-- Warning icon -->
          <svg v-else-if="item.type === 'warning'" class="size-4 shrink-0 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>

          <!-- Info icon -->
          <svg v-else class="size-4 shrink-0 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>

          <span class="break-words font-sans text-xs font-medium text-base-content">{{ item.message }}</span>
        </div>

        <button
          type="button"
          class="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content shrink-0"
          aria-label="Dismiss toast"
          @click="remove(item.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}
</style>
