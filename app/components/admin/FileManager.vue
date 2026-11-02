<script setup lang="ts">
interface StoredFile {
  id: string
  bucket: string
  objectKey: string
  folder: string
  name: string
  mime: string
  sizeBytes: number
  width: number | null
  height: number | null
  url: string | null
}

interface UploadProgress {
  fileName: string
  current: number
  total: number
  percent: number
}

import { refDebounced } from '@vueuse/core'

const props = withDefaults(defineProps<{ mode?: 'manage' | 'select' }>(), { mode: 'manage' })
const emit = defineEmits<{ select: [file: StoredFile] }>()

const config = useRuntimeConfig()
const toast = useToast()
const folder = ref('/')
const search = ref('')
const debouncedSearch = refDebounced(search, 250)
const filterType = ref('')
const previewing = ref<StoredFile | null>(null)
const uploading = ref(false)
const uploadProgress = ref<UploadProgress | null>(null)

// In-App Action Modals (Replaces native browser window.confirm / prompt)
const fileToDelete = ref<StoredFile | null>(null)
const deletePending = ref(false)
const deleteReauthCode = ref('')

const fileToRename = ref<StoredFile | null>(null)
const renameInput = ref('')
const renamePending = ref(false)

const fileToMove = ref<StoredFile | null>(null)
const moveTargetFolder = ref('/')
const movePending = ref(false)

const showNewFolderModal = ref(false)
const newFolderInput = ref('')
const folderPending = ref(false)

const { data, refresh } = await useFetch<{ folder: string; rows: StoredFile[]; folders: { path: string }[] }>('/api/admin/files', {
  query: { folder, q: debouncedSearch, type: filterType },
})

const crumbs = computed(() => {
  const parts = folder.value.split('/').filter(Boolean)
  return [{ label: 'root', path: '/' }, ...parts.map((part, index) => ({ label: part, path: `/${parts.slice(0, index + 1).join('/')}` }))]
})

function openFolder(path: string) {
  folder.value = path
}

function goToParent() {
  const parts = folder.value.split('/').filter(Boolean)
  parts.pop()
  folder.value = parts.length ? `/${parts.join('/')}` : '/'
}

function encryptFileName(rawName: string): string {
  const randomPrefix = Math.random().toString(36).substring(2, 8)
  const dotIndex = rawName.lastIndexOf('.')
  const ext = dotIndex !== -1 ? rawName.substring(dotIndex).toLowerCase() : ''
  const base = dotIndex !== -1 ? rawName.substring(0, dotIndex) : rawName
  const cleanBase = base.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `${randomPrefix}_${cleanBase || 'file'}${ext}`
}

function uploadWithProgress(url: string, file: File, mime: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('content-type', mime)
    xhr.setRequestHeader('x-upsert', 'false')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.round((e.loaded / e.total) * 100)
        onProgress(pct)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Storage returned ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload aborted'))
    xhr.send(file)
  })
}

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  await uploadFiles(Array.from(input.files ?? []))
  input.value = ''
}

async function uploadFiles(selected: File[]) {
  if (!selected.length) return
  uploading.value = true
  let failed = 0
  let errDetail = ''

  for (let i = 0; i < selected.length; i++) {
    const file = selected[i]!
    const encryptedName = encryptFileName(file.name)

    uploadProgress.value = {
      fileName: encryptedName,
      current: i + 1,
      total: selected.length,
      percent: 5,
    }

    try {
      const target = await $fetch<{ fileId: string; bucket: string; objectKey: string; signedUrl: string }>('/api/admin/files/upload-url', {
        method: 'POST',
        body: { name: encryptedName, folder: folder.value, mime: file.type, size: file.size },
      })

      uploadProgress.value.percent = 15

      await uploadWithProgress(target.signedUrl, file, file.type, (pct) => {
        if (uploadProgress.value) {
          uploadProgress.value.percent = Math.min(95, 15 + Math.round(pct * 0.75))
        }
      })

      uploadProgress.value.percent = 95

      await $fetch('/api/admin/files/confirm', {
        method: 'POST',
        body: {
          fileId: target.fileId,
          bucket: target.bucket,
          objectKey: target.objectKey,
          name: encryptedName,
          folder: folder.value,
        },
      })

      uploadProgress.value.percent = 100
    } catch (err: unknown) {
      failed++
      const msg = (err as { data?: { statusMessage?: string; message?: string }; message?: string })?.data?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || (err as Error)?.message
        || 'Upload error'
      errDetail = msg
      console.error('File upload error:', err)
    }
  }

  await refresh()
  if (failed) {
    toast.error(`${failed} upload(s) failed${errDetail ? ': ' + errDetail : '.'}`)
  } else {
    toast.success('Uploaded successfully with encrypted filenames.')
  }
  uploading.value = false
  uploadProgress.value = null
}

async function copyUrl(file: StoredFile) {
  if (!file.url) return
  await navigator.clipboard.writeText(file.url)
  toast.info('Public URL copied to clipboard.')
}

// 1. In-App Delete Handler
function promptDelete(file: StoredFile) {
  fileToDelete.value = file
  deleteReauthCode.value = ''
}

async function confirmDelete() {
  if (!fileToDelete.value) return
  deletePending.value = true
  const file = fileToDelete.value
  try {
    await $fetch(`/api/admin/files/${file.id}`, {
      method: 'DELETE',
      headers: deleteReauthCode.value ? { 'x-admin-reauth': deleteReauthCode.value.trim() } : {},
    })
    toast.success(`"${file.name}" deleted successfully.`)
    if (previewing.value?.id === file.id) {
      previewing.value = null
    }
    fileToDelete.value = null
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not delete file.'
    toast.error(msg)
  } finally {
    deletePending.value = false
  }
}

// 2. In-App Rename Handler
function promptRename(file: StoredFile) {
  fileToRename.value = file
  renameInput.value = file.name
}

async function confirmRename() {
  if (!fileToRename.value || !renameInput.value.trim()) return
  renamePending.value = true
  const file = fileToRename.value
  try {
    await $fetch(`/api/admin/files/${file.id}`, {
      method: 'PATCH',
      body: { name: renameInput.value.trim() },
    })
    toast.success('File renamed.')
    fileToRename.value = null
    await refresh()
  } catch {
    toast.error('Failed to rename file.')
  } finally {
    renamePending.value = false
  }
}

// 3. In-App Move Handler
function promptMove(file: StoredFile) {
  fileToMove.value = file
  moveTargetFolder.value = file.folder
}

async function confirmMove() {
  if (!fileToMove.value || !moveTargetFolder.value.trim()) return
  movePending.value = true
  const file = fileToMove.value
  try {
    await $fetch(`/api/admin/files/${file.id}`, {
      method: 'PATCH',
      body: { folder: moveTargetFolder.value.trim() },
    })
    toast.success(`File moved to ${moveTargetFolder.value}.`)
    fileToMove.value = null
    await refresh()
  } catch {
    toast.error('Could not move file.')
  } finally {
    movePending.value = false
  }
}

// 4. In-App Create Folder Handler
function openNewFolderModal() {
  showNewFolderModal.value = true
  newFolderInput.value = ''
}

async function confirmCreateFolder() {
  const name = newFolderInput.value.trim()
  if (!name) return
  folderPending.value = true
  const path = folder.value === '/' ? `/${name}` : `${folder.value}/${name}`
  try {
    await $fetch('/api/admin/folders', { method: 'POST', body: { path } })
    toast.success(`Folder "${name}" created.`)
    showNewFolderModal.value = false
    await refresh()
  } catch {
    toast.error('Could not create folder.')
  } finally {
    folderPending.value = false
  }
}

async function drop(event: DragEvent) {
  await uploadFiles(Array.from(event.dataTransfer?.files ?? []))
}
</script>

<template>
  <div @dragover.prevent @drop.prevent="drop">
    <!-- Action Bar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-1 rounded-lg border border-base-300 bg-base-200/60 px-2.5 py-1 text-xs font-mono">
        <!-- Back button (Left Arrow) if in subfolder -->
        <button
          v-if="folder !== '/'"
          type="button"
          class="btn btn-ghost btn-xs btn-square mr-1 size-5 text-base-content/60 hover:text-primary"
          title="Back to parent folder"
          @click="goToParent"
        >
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>

        <!-- Breadcrumb Items with separator arrow -->
        <template v-for="(crumb, idx) in crumbs" :key="crumb.path">
          <svg v-if="idx > 0" class="size-3 text-base-content/30 shrink-0 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>

          <button
            type="button"
            class="flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors"
            :class="idx === crumbs.length - 1
              ? 'font-bold text-primary bg-primary/10'
              : 'text-base-content/60 hover:text-base-content hover:bg-base-300'"
            @click="openFolder(crumb.path)"
          >
            <span v-if="idx === 0" class="text-[11px] opacity-70">📁</span>
            <span>{{ crumb.label }}</span>
          </button>
        </template>
      </nav>
      <select v-model="filterType" class="select select-bordered select-xs ml-auto text-xs">
        <option value="">All types</option>
        <option value="image">Images</option>
        <option value="image/svg+xml">SVG</option>
        <option value="application/pdf">PDF</option>
      </select>
      <input v-model="search" type="search" placeholder="Search files…" class="input input-bordered input-xs w-36 font-mono text-xs">
      <button type="button" class="btn btn-ghost btn-xs border border-base-300" @click="openNewFolderModal">+ New folder</button>
      <label class="btn btn-primary btn-xs font-semibold shadow-xs gap-1.5" :class="{ 'opacity-50 pointer-events-none': uploading }">
        <span v-if="uploading" class="loading loading-spinner loading-xs" />
        <span>{{ uploading ? 'Uploading…' : 'Upload' }}</span>
        <input type="file" class="hidden" multiple :disabled="uploading" @change="upload">
      </label>
    </div>

    <!-- Upload Progress Indicator -->
    <div v-if="uploadProgress" class="mt-3 rounded-box border border-primary/40 bg-primary/5 p-4 shadow-xs space-y-2 font-mono">
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2 truncate pr-2">
          <span class="loading loading-spinner loading-xs text-primary shrink-0" />
          <span class="font-semibold text-base-content truncate">{{ uploadProgress.fileName }}</span>
          <span class="opacity-50 text-[11px]">({{ uploadProgress.current }}/{{ uploadProgress.total }})</span>
        </div>
        <span class="font-bold text-primary tabular-nums shrink-0">{{ uploadProgress.percent }}%</span>
      </div>
      <progress
        class="progress progress-primary w-full h-2 bg-base-300"
        :value="uploadProgress.percent"
        max="100"
      />
    </div>

    <!-- Files & Folders Grid -->
    <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Folder Cards -->
      <button
        v-for="item in data?.folders?.filter(f => f.path !== folder && f.path.startsWith(folder === '/' ? '/' : `${folder}/`) && f.path.split('/').filter(Boolean).length === (folder === '/' ? 1 : folder.split('/').filter(Boolean).length + 1))"
        :key="item.path"
        type="button"
        class="flex items-center gap-2.5 rounded-box border border-base-300 bg-base-200/40 p-3 text-left text-sm hover:border-primary hover:bg-base-200/80 transition-all"
        @click="openFolder(item.path)"
      >
        <span class="text-primary font-bold">📁</span>
        <span class="font-mono text-xs">{{ item.path.split('/').pop() }}</span>
      </button>

      <!-- File Cards -->
      <div v-for="file in data?.rows" :key="file.id" class="rounded-box border border-base-300 bg-base-200/30 p-3 hover:border-base-content/20 transition-all">
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 gap-2.5">
            <img v-if="file.url && file.mime.startsWith('image/')" :src="file.url" :alt="file.name" class="size-10 rounded border border-base-300 object-cover shrink-0">
            <div v-else class="size-10 rounded border border-base-300 bg-base-300 flex items-center justify-center shrink-0 font-mono text-[10px] uppercase opacity-60">
              {{ file.mime.split('/')[1] || 'file' }}
            </div>
            <div class="min-w-0 cursor-pointer" @click="previewing = file">
              <p class="truncate text-xs font-semibold hover:text-primary transition-colors font-mono" :title="file.name">{{ file.name }}</p>
              <p class="text-[10px] opacity-50 font-mono">{{ file.mime }} · {{ Math.round(file.sizeBytes / 1024) }} KB<span v-if="file.width"> · {{ file.width }}×{{ file.height }}</span></p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <template v-if="props.mode === 'select'">
              <button type="button" class="btn btn-primary btn-xs font-semibold" @click="emit('select', file)">Use</button>
              <button type="button" class="btn btn-ghost btn-xs text-error hover:bg-error/10 font-bold" title="Delete file" @click.stop="promptDelete(file)">✕</button>
            </template>
            <template v-if="props.mode === 'manage'">
              <button type="button" class="btn btn-ghost btn-xs text-[11px]" @click="previewing = file">Info</button>
              <button type="button" class="btn btn-ghost btn-xs text-[11px]" @click="copyUrl(file)">URL</button>
              <button type="button" class="btn btn-ghost btn-xs text-[11px]" @click="promptRename(file)">Rename</button>
              <button type="button" class="btn btn-ghost btn-xs text-[11px]" @click="promptMove(file)">Move</button>
              <button type="button" class="btn btn-ghost btn-xs text-error text-[11px] hover:bg-error/10" @click="promptDelete(file)">Delete</button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!data?.rows?.length && !data?.folders?.length" class="py-12 text-center text-xs opacity-50 font-mono">This folder is empty.</p>

    <!-- File Details / Preview Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="previewing" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" @click.self="previewing = null">
          <div class="modal-box w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-base-300 pb-3">
              <h3 class="font-bold text-sm truncate font-mono">{{ previewing.name }}</h3>
              <button type="button" class="btn btn-ghost btn-xs btn-square" @click="previewing = null">✕</button>
            </div>

            <div class="flex max-h-56 items-center justify-center overflow-hidden rounded-xl bg-base-200/80 p-3 border border-base-300/60">
              <img v-if="previewing.url && previewing.mime.startsWith('image/')" :src="previewing.url" :alt="previewing.name" class="max-h-50 max-w-full object-contain">
              <div v-else-if="previewing.mime === 'application/pdf'" class="text-center">
                <p class="text-sm font-semibold">PDF Document</p>
                <a v-if="previewing.url" :href="previewing.url" target="_blank" class="link link-primary text-xs mt-1 block">Open PDF in new tab ↗</a>
              </div>
              <div v-else class="text-xs opacity-50 font-mono">Preview unavailable</div>
            </div>

            <dl class="grid grid-cols-2 gap-2 text-xs font-mono">
              <div><dt class="opacity-50">Folder</dt><dd>{{ previewing.folder }}</dd></div>
              <div><dt class="opacity-50">MIME</dt><dd>{{ previewing.mime }}</dd></div>
              <div><dt class="opacity-50">Size</dt><dd>{{ (previewing.sizeBytes / 1024).toFixed(1) }} KB</dd></div>
              <div><dt class="opacity-50">Dimensions</dt><dd>{{ previewing.width ? `${previewing.width}×${previewing.height} px` : '—' }}</dd></div>
              <div class="col-span-2"><dt class="opacity-50">Public URL</dt><dd class="truncate"><a v-if="previewing.url" :href="previewing.url" target="_blank" class="link text-primary">{{ previewing.url }}</a><span v-else>—</span></dd></div>
            </dl>

            <div class="mt-4 flex items-center justify-between border-t border-base-300 pt-4">
              <button
                type="button"
                class="btn btn-sm btn-error btn-outline gap-1.5 font-mono text-xs"
                @click="promptDelete(previewing)"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete File</span>
              </button>

              <div class="flex items-center gap-2">
                <button v-if="previewing.url" type="button" class="btn btn-sm btn-ghost text-xs font-mono" @click="copyUrl(previewing)">Copy URL</button>
                <button type="button" class="btn btn-sm btn-primary text-xs font-semibold" @click="previewing = null">Close</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- IN-APP MODAL 1: DELETE CONFIRMATION -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="fileToDelete" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" @click.self="fileToDelete = null">
          <div class="modal-box w-full max-w-sm rounded-2xl border border-error/30 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center gap-3">
              <div class="rounded-xl bg-error/15 p-2.5 text-error">
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-base-content">Delete File?</h3>
                <p class="text-xs text-base-content/60">This permanently removes it from cloud storage.</p>
              </div>
            </div>

            <div class="rounded-lg bg-base-200/70 p-3 font-mono text-xs truncate border border-base-300">
              {{ fileToDelete.name }}
            </div>

            <div v-if="config.public.adminRequire2fa" class="space-y-1">
              <label class="block font-mono text-xs text-base-content/70">2FA Code (if enabled):</label>
              <input v-model="deleteReauthCode" placeholder="000000" class="input input-bordered input-sm w-full font-mono text-xs">
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn btn-sm btn-ghost font-mono text-xs" @click="fileToDelete = null">Cancel</button>
              <button type="button" class="btn btn-sm btn-error font-semibold shadow-xs" :disabled="deletePending" @click="confirmDelete">
                <span v-if="deletePending" class="loading loading-spinner loading-xs" />
                <span>{{ deletePending ? 'Deleting…' : 'Delete Permanently' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- IN-APP MODAL 2: RENAME MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="fileToRename" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" @click.self="fileToRename = null">
          <div class="modal-box w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <h3 class="text-base font-bold text-base-content">Rename File</h3>
            <input v-model="renameInput" class="input input-bordered input-sm w-full font-mono text-xs" autofocus @keydown.enter.prevent="confirmRename">
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn btn-sm btn-ghost font-mono text-xs" @click="fileToRename = null">Cancel</button>
              <button type="button" class="btn btn-sm btn-primary font-semibold" :disabled="renamePending" @click="confirmRename">
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- IN-APP MODAL 3: MOVE MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="fileToMove" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" @click.self="fileToMove = null">
          <div class="modal-box w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <h3 class="text-base font-bold text-base-content">Move File</h3>
            <p class="text-xs text-base-content/60">Target folder path (e.g. <code class="font-mono text-primary">/</code> or <code class="font-mono text-primary">/logos</code>):</p>
            <input v-model="moveTargetFolder" class="input input-bordered input-sm w-full font-mono text-xs" placeholder="/" @keydown.enter.prevent="confirmMove">
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn btn-sm btn-ghost font-mono text-xs" @click="fileToMove = null">Cancel</button>
              <button type="button" class="btn btn-sm btn-primary font-semibold" :disabled="movePending" @click="confirmMove">
                <span>Move</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- IN-APP MODAL 4: NEW FOLDER MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showNewFolderModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" @click.self="showNewFolderModal = false">
          <div class="modal-box w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <h3 class="text-base font-bold text-base-content">Create New Folder</h3>
            <input v-model="newFolderInput" class="input input-bordered input-sm w-full font-mono text-xs" placeholder="e.g. avatars" autofocus @keydown.enter.prevent="confirmCreateFolder">
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn btn-sm btn-ghost font-mono text-xs" @click="showNewFolderModal = false">Cancel</button>
              <button type="button" class="btn btn-sm btn-primary font-semibold" :disabled="folderPending || !newFolderInput.trim()" @click="confirmCreateFolder">
                <span>Create Folder</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
