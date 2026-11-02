<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface BrandFile {
  id: string
  name: string
  url: string | null
}

interface BrandVersion {
  version: number
  isActive: boolean
  fileId: string
  name: string | null
  url: string | null
}

interface BrandSlot {
  id: string
  label: string
  purpose: string
  formats: string[]
  active: BrandVersion | null
  versions: BrandVersion[]
}

const { data, refresh } = await useFetch<{ slots: BrandSlot[] }>('/api/admin/brand')
const toast = useToast()

const activeSlot = ref<BrandSlot | null>(null)
const isModalOpen = ref(false)

function choose(slot: BrandSlot) {
  activeSlot.value = slot
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  activeSlot.value = null
}

async function useFile(file: BrandFile) {
  if (!activeSlot.value) {
    toast.warning('Pick a brand slot first before selecting a file.')
    return
  }
  const slotId = activeSlot.value.id
  try {
    await $fetch(`/api/admin/brand/${slotId}`, { method: 'PUT', body: { fileId: file.id } })
    toast.success(`Published ${file.name} to ${slotId}.`)
    closeModal()
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not publish file to this slot.'
    toast.error(msg)
  }
}

async function rollback(slot: string, version: number) {
  try {
    await $fetch(`/api/admin/brand/${slot}/rollback`, { method: 'POST', body: { version } })
    toast.success(`Rolled back ${slot} to version ${version}.`)
    await refresh()
  } catch {
    toast.error('Rollback failed.')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-box border border-base-300 bg-base-200/50 p-5 shadow-xs">
      <div>
        <h1 class="text-xl font-bold tracking-tight">Brand & Asset Slots</h1>
        <p class="mt-0.5 text-xs text-base-content/60">
          Theme-aware logo rendering, favicon sources, and Open Graph card configurations with instant rollback.
        </p>
      </div>
    </div>

    <!-- Slots Grid -->
    <div class="grid gap-4 lg:grid-cols-2">
      <article
        v-for="slot in data?.slots"
        :key="slot.id"
        class="rounded-box border border-base-300 bg-base-200/30 p-5 space-y-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-semibold text-sm">{{ slot.label }}</h2>
              <span class="badge badge-ghost badge-xs font-mono uppercase text-base-content/50">{{ slot.id }}</span>
            </div>
            <p class="mt-0.5 text-xs text-base-content/50">{{ slot.purpose }}</p>
            <div class="mt-1.5 flex gap-1 font-mono text-[10px] text-base-content/40">
              <span>Formats: {{ slot.formats.join(', ') }}</span>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-primary btn-xs gap-1.5 font-semibold shadow-xs"
            @click="choose(slot)"
          >
            <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Choose File</span>
          </button>
        </div>

        <!-- Light & Dark Side-by-Side Preview (PRD §3.10.5) -->
        <div class="grid grid-cols-2 gap-2">
          <!-- Light surface preview -->
          <div class="flex min-h-24 flex-col items-center justify-center rounded-lg border border-base-300/60 bg-[#ffffff] p-3 text-[#17191c]">
            <img
              v-if="slot.active?.url"
              :src="slot.active.url"
              :alt="slot.label"
              class="max-h-16 max-w-full object-contain"
            >
            <span v-else class="text-[11px] font-mono text-black/30">No asset</span>
            <span class="mt-2 text-[9px] font-mono uppercase tracking-wider text-black/40">Light surface</span>
          </div>

          <!-- Dark surface preview -->
          <div class="flex min-h-24 flex-col items-center justify-center rounded-lg border border-base-300/60 bg-[#17191c] p-3 text-[#e7e9ec]">
            <img
              v-if="slot.active?.url"
              :src="slot.active.url"
              :alt="slot.label"
              class="max-h-16 max-w-full object-contain"
            >
            <span v-else class="text-[11px] font-mono text-white/30">No asset</span>
            <span class="mt-2 text-[9px] font-mono uppercase tracking-wider text-white/40">Dark surface</span>
          </div>
        </div>

        <!-- Version History & Rollback -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300/60 pt-3">
          <span class="text-[11px] font-mono text-base-content/40">
            Active version: <strong class="text-primary">v{{ slot.active?.version || 1 }}</strong>
          </span>

          <div v-if="slot.versions.length > 1" class="flex flex-wrap items-center gap-1 text-xs">
            <span class="text-[10px] uppercase font-mono opacity-40 mr-1">Rollback:</span>
            <button
              v-for="version in slot.versions.slice(0, 5)"
              :key="version.version"
              type="button"
              class="btn btn-ghost btn-xs font-mono"
              :class="{ 'btn-active text-primary font-bold': version.isActive }"
              :disabled="version.isActive"
              :title="`Rollback to v${version.version}`"
              @click="rollback(slot.id, version.version)"
            >
              v{{ version.version }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- MODAL POPUP FILE MANAGER (PRD & Clean UX) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-sm"
          @click.self="closeModal"
        >
          <div class="modal-box flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-base-300 bg-base-100 p-0 shadow-2xl overflow-hidden font-sans">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-base-300 bg-base-200/50 px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="rounded-lg bg-primary/15 p-2 text-primary">
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-base-content flex items-center gap-2">
                    <span>Select Asset for {{ activeSlot?.label }}</span>
                    <span class="badge badge-primary badge-xs font-mono uppercase">{{ activeSlot?.id }}</span>
                  </h3>
                  <p class="text-[11px] text-base-content/50 font-mono">
                    Allowed formats: {{ activeSlot?.formats.join(', ') }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-base-content"
                aria-label="Close file picker"
                @click="closeModal"
              >
                ✕
              </button>
            </div>

            <!-- Modal Body (FileManager in Select Mode) -->
            <div class="flex-1 overflow-y-auto p-5 bg-base-100">
              <FileManager mode="select" @select="useFile" />
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-between border-t border-base-300 bg-base-200/40 px-5 py-3 text-xs font-mono text-base-content/50">
              <span>Click "Use" on any image file to publish immediately to this brand slot.</span>
              <button type="button" class="btn btn-ghost btn-xs" @click="closeModal">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
