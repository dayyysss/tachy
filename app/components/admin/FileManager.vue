<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import {
  Folder,
  FolderPlus,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit2,
  Move,
  Copy,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Check,
  MoreVertical,
  X,
  AlertTriangle,
} from 'lucide-vue-next'

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

const props = withDefaults(defineProps<{ mode?: 'manage' | 'select' }>(), { mode: 'manage' })
const emit = defineEmits<{ select: [file: StoredFile] }>()

const config = useRuntimeConfig()
const toast = useToast()
const dialog = useDialog()

const folder = ref('/')
const search = ref('')
const debouncedSearch = refDebounced(search, 250)
const filterType = ref('')
const previewing = ref<StoredFile | null>(null)
const uploading = ref(false)
const uploadProgress = ref<UploadProgress | null>(null)

// Checkbox selection for bulk operations
const selectedFileIds = ref<string[]>([])

// In-App Action Modals
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

const folderToRename = ref<string | null>(null)
const renameFolderInput = ref('')
const renameFolderPending = ref(false)

const folderToDelete = ref<string | null>(null)
const deleteFolderPending = ref(false)

const { data, refresh, pending } = useFetch<{ folder: string; rows: StoredFile[]; folders: { path: string }[] }>('/api/admin/files', {
  query: { folder, q: debouncedSearch, type: filterType },
})

watch([folder, debouncedSearch, filterType], () => {
  selectedFileIds.value = []
})

const isAllSelected = computed(() => {
  const rows = data.value?.rows ?? []
  if (!rows.length) return false
  return rows.every(r => selectedFileIds.value.includes(r.id))
})

function toggleSelectAll() {
  const rows = data.value?.rows ?? []
  if (isAllSelected.value) {
    selectedFileIds.value = []
  } else {
    selectedFileIds.value = rows.map(r => r.id)
  }
}

function clearSelection() {
  selectedFileIds.value = []
}

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

function uploadWithProgress(formData: FormData, onProgress: (pct: number) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/files/upload')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.round((e.loaded / e.total) * 100)
        onProgress(pct)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve({})
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText)
          reject(new Error(res.statusMessage || res.message || `Upload failed (${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload aborted'))
    xhr.send(formData)
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
    uploadProgress.value = {
      fileName: file.name,
      current: i + 1,
      total: selected.length,
      percent: 10,
    }

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder.value)

      await uploadWithProgress(fd, (pct) => {
        if (uploadProgress.value) {
          uploadProgress.value.percent = pct
        }
      })
    } catch (err: unknown) {
      failed++
      errDetail = (err as Error)?.message || 'Upload error'
      console.error('File upload error:', err)
    }
  }

  await refresh()
  if (failed) {
    toast.error(`${failed} file(s) failed: ${errDetail}`)
  } else {
    toast.success('Uploaded successfully.')
  }
  uploading.value = false
  uploadProgress.value = null
}

async function copyUrl(file: StoredFile) {
  if (!file.url) return
  const fullUrl = file.url.startsWith('http') ? file.url : `${window.location.origin}${file.url}`
  await navigator.clipboard.writeText(fullUrl)
  toast.info('Public URL copied to clipboard.')
}

// 1. In-App Delete File Handler
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
    selectedFileIds.value = selectedFileIds.value.filter(id => id !== file.id)
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not delete file.'
    toast.error(msg)
  } finally {
    deletePending.value = false
  }
}

// 2. In-App Rename File Handler
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

// 3. In-App Move File Handler
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

// 4. Folder CRUD: Create Folder
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

// 5. Folder CRUD: Rename Folder
function promptRenameFolder(targetPath: string) {
  folderToRename.value = targetPath
  renameFolderInput.value = targetPath.split('/').pop() || ''
}

async function confirmRenameFolder() {
  if (!folderToRename.value || !renameFolderInput.value.trim()) return
  renameFolderPending.value = true
  const oldPath = folderToRename.value
  const parent = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/'
  const newPath = parent === '/' ? `/${renameFolderInput.value.trim()}` : `${parent}/${renameFolderInput.value.trim()}`
  try {
    await $fetch('/api/admin/folders', {
      method: 'PATCH',
      body: { oldPath, newPath },
    })
    toast.success(`Folder renamed to "${renameFolderInput.value.trim()}".`)
    if (folder.value === oldPath) folder.value = newPath
    folderToRename.value = null
    await refresh()
  } catch {
    toast.error('Could not rename folder.')
  } finally {
    renameFolderPending.value = false
  }
}

// 6. Folder CRUD: Delete Folder
function promptDeleteFolder(targetPath: string) {
  folderToDelete.value = targetPath
}

async function confirmDeleteFolder() {
  if (!folderToDelete.value) return
  deleteFolderPending.value = true
  try {
    await $fetch('/api/admin/folders', {
      method: 'DELETE',
      body: { path: folderToDelete.value },
    })
    toast.success('Folder deleted.')
    if (folder.value === folderToDelete.value) {
      goToParent()
    }
    folderToDelete.value = null
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Cannot delete folder (ensure it is empty).'
    toast.error(msg)
  } finally {
    deleteFolderPending.value = false
  }
}

// 7. Bulk Delete & Bulk Move Files
async function bulkDeleteFiles() {
  if (!selectedFileIds.value.length) return
  const ok = await dialog.confirm({
    title: `Delete ${selectedFileIds.value.length} Files?`,
    message: 'This will permanently remove the selected files from storage.',
    confirmText: 'Delete All',
    danger: true,
  })
  if (!ok) return

  let deleted = 0
  for (const id of selectedFileIds.value) {
    try {
      await $fetch(`/api/admin/files/${id}`, { method: 'DELETE' })
      deleted++
    } catch {}
  }
  toast.success(`Deleted ${deleted} file(s).`)
  clearSelection()
  await refresh()
}

async function drop(event: DragEvent) {
  await uploadFiles(Array.from(event.dataTransfer?.files ?? []))
}
</script>

<template>
  <div class="space-y-4 font-sans" @dragover.prevent @drop.prevent="drop">
    <!-- Friendly Toolbar: Navigation on Left, Actions on Right -->
    <div class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
      <!-- Breadcrumb Navigation on Left -->
      <div class="flex flex-wrap items-center gap-2">
        <nav class="flex items-center gap-1 rounded-xl border border-base-300 bg-base-200/60 px-3 py-1.5 text-xs font-mono">
          <button
            v-if="folder !== '/'"
            type="button"
            class="btn btn-ghost btn-xs btn-square size-5 text-base-content/60 hover:text-primary"
            title="Back to parent folder"
            @click="goToParent"
          >
            <ArrowLeft class="size-3.5" />
          </button>

          <template v-for="(crumb, idx) in crumbs" :key="crumb.path">
            <ChevronRight v-if="idx > 0" class="size-3 text-base-content/30 shrink-0" />
            <button
              type="button"
              class="flex items-center gap-1 rounded px-2 py-0.5 transition-colors"
              :class="idx === crumbs.length - 1
                ? 'font-bold text-primary bg-primary/10'
                : 'text-base-content/60 hover:text-base-content hover:bg-base-300'"
              @click="openFolder(crumb.path)"
            >
              <Folder v-if="idx === 0" class="size-3 text-primary opacity-80" />
              <span>{{ crumb.label }}</span>
            </button>
          </template>
        </nav>

        <!-- Search Input -->
        <div class="relative w-44 sm:w-56">
          <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-base-content/40" />
          <input
            v-model="search"
            type="search"
            placeholder="Search files…"
            class="input input-bordered input-xs w-full pl-8 font-mono text-xs"
          >
        </div>
      </div>

      <!-- Actions on Right -->
      <div class="flex flex-wrap items-center gap-2">
        <select v-model="filterType" class="select select-bordered select-xs text-xs">
          <option value="">All file types</option>
          <option value="image">Images</option>
          <option value="image/svg+xml">SVG vector</option>
          <option value="application/pdf">PDF docs</option>
        </select>

        <button
          type="button"
          class="btn btn-ghost btn-xs border border-base-300 gap-1 font-semibold"
          @click="openNewFolderModal"
        >
          <FolderPlus class="size-3.5" />
          <span>New folder</span>
        </button>

        <label
          class="btn btn-primary btn-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
          :class="{ 'opacity-50 pointer-events-none': uploading }"
        >
          <span v-if="uploading" class="loading loading-spinner loading-xs" />
          <Upload v-else class="size-3.5" />
          <span>{{ uploading ? 'Uploading…' : 'Upload' }}</span>
          <input type="file" class="hidden" multiple :disabled="uploading" @change="upload">
        </label>
      </div>
    </div>

    <!-- Upload Progress Indicator -->
    <div v-if="uploadProgress" class="rounded-xl border border-primary/40 bg-primary/5 p-4 shadow-xs space-y-2 font-mono">
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

    <!-- Bulk Actions Floating Bar -->
    <Transition name="fade">
      <div
        v-if="selectedFileIds.length"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 shadow-md font-sans"
      >
        <div class="flex items-center gap-2">
          <span class="badge badge-primary font-mono text-xs font-bold">{{ selectedFileIds.length }}</span>
          <span class="text-xs font-semibold text-base-content">File(s) selected</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-xs btn-error font-semibold gap-1" @click="bulkDeleteFiles">
            <Trash2 class="size-3" />
            <span>Delete Selected</span>
          </button>
          <button type="button" class="btn btn-xs btn-ghost border border-base-300" @click="clearSelection">
            Deselect
          </button>
        </div>
      </div>
    </Transition>

    <!-- Subfolders Grid -->
    <div
      v-if="data?.folders?.filter(f => f.path !== folder && f.path.startsWith(folder === '/' ? '/' : `${folder}/`) && f.path.split('/').filter(Boolean).length === (folder === '/' ? 1 : folder.split('/').filter(Boolean).length + 1)).length"
      class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      <div
        v-for="item in data?.folders?.filter(f => f.path !== folder && f.path.startsWith(folder === '/' ? '/' : `${folder}/`) && f.path.split('/').filter(Boolean).length === (folder === '/' ? 1 : folder.split('/').filter(Boolean).length + 1))"
        :key="item.path"
        class="group flex items-center justify-between rounded-xl border border-base-300 bg-base-100 p-3 hover:border-primary/50 hover:bg-base-200/50 transition-all shadow-2xs"
      >
        <button
          type="button"
          class="flex items-center gap-2.5 min-w-0 flex-1 text-left"
          @click="openFolder(item.path)"
        >
          <Folder class="size-4 text-primary shrink-0" />
          <span class="font-mono text-xs font-semibold truncate">{{ item.path.split('/').pop() }}</span>
        </button>

        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square size-6"
            title="Rename folder"
            @click.stop="promptRenameFolder(item.path)"
          >
            <Edit2 class="size-3 text-base-content/60" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square size-6 text-error hover:bg-error/10"
            title="Delete empty folder"
            @click.stop="promptDeleteFolder(item.path)"
          >
            <Trash2 class="size-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Select All Bar for Files -->
    <div v-if="data?.rows?.length" class="flex items-center justify-between px-2 pt-2 text-xs text-base-content/60 font-mono">
      <label class="flex items-center gap-2 cursor-pointer hover:text-base-content transition-colors">
        <input
          type="checkbox"
          class="checkbox checkbox-xs checkbox-primary"
          :checked="isAllSelected"
          @change="toggleSelectAll"
        >
        <span>Select all {{ data.rows.length }} file(s) in this folder</span>
      </label>
    </div>

    <!-- Files Grid -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="file in data?.rows"
        :key="file.id"
        class="group rounded-2xl border border-base-300 bg-base-100 p-3.5 hover:border-primary/40 hover:shadow-xs transition-all relative"
        :class="{ 'border-primary ring-1 ring-primary/30 bg-primary/5': selectedFileIds.includes(file.id) }"
      >
        <div class="flex items-start gap-3">
          <!-- Checkbox -->
          <input
            v-model="selectedFileIds"
            type="checkbox"
            :value="file.id"
            class="checkbox checkbox-xs checkbox-primary mt-1 shrink-0"
          >

          <!-- Thumbnail -->
          <div
            class="size-12 rounded-xl border border-base-300 bg-base-200 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
            @click="previewing = file"
          >
            <img
              v-if="file.url && file.mime.startsWith('image/')"
              :src="file.url"
              :alt="file.name"
              class="size-full object-cover"
            >
            <span v-else class="font-mono text-[10px] uppercase font-bold text-base-content/50">
              {{ file.mime.split('/')[1] || 'file' }}
            </span>
          </div>

          <!-- File Info -->
          <div class="min-w-0 flex-1 cursor-pointer" @click="previewing = file">
            <p class="truncate text-xs font-semibold hover:text-primary transition-colors font-mono" :title="file.name">
              {{ file.name }}
            </p>
            <p class="text-[10px] text-base-content/50 font-mono mt-0.5">
              {{ file.mime }} · {{ Math.round(file.sizeBytes / 1024) }} KB
            </p>
            <p v-if="file.width" class="text-[10px] text-base-content/40 font-mono">
              {{ file.width }}×{{ file.height }} px
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-3 pt-2.5 border-t border-base-200/80 flex items-center justify-between text-xs font-mono">
          <template v-if="props.mode === 'select'">
            <button
              type="button"
              class="btn btn-primary btn-xs font-semibold w-full"
              @click="emit('select', file)"
            >
              Select for Brand Slot
            </button>
          </template>
          <template v-else>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-xs text-[11px] h-6 px-1.5"
                title="Preview & details"
                @click="previewing = file"
              >
                Info
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs text-[11px] h-6 px-1.5"
                title="Copy public URL"
                @click="copyUrl(file)"
              >
                Copy URL
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs text-[11px] h-6 px-1.5"
                @click="promptRename(file)"
              >
                Rename
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs text-[11px] h-6 px-1.5"
                @click="promptMove(file)"
              >
                Move
              </button>
            </div>

            <button
              type="button"
              class="btn btn-ghost btn-xs text-error text-[11px] h-6 px-1.5 hover:bg-error/10"
              title="Delete file"
              @click="promptDelete(file)"
            >
              Delete
            </button>
          </template>
        </div>
      </div>
    </div>

    <div
      v-if="!data?.rows?.length && !data?.folders?.length"
      class="py-16 text-center text-xs opacity-50 font-mono rounded-2xl border border-dashed border-base-300"
    >
      This folder is currently empty. Drag & drop files or click Upload above.
    </div>

    <!-- PREVIEW / DETAILS MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="previewing"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="previewing = null"
        >
          <div class="relative z-10 w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-base-300 pb-3">
              <h3 class="font-bold text-sm truncate font-mono">{{ previewing.name }}</h3>
              <button type="button" class="btn btn-ghost btn-xs btn-square" @click="previewing = null">✕</button>
            </div>

            <div class="flex max-h-56 items-center justify-center overflow-hidden rounded-xl bg-base-200/80 p-3 border border-base-300/60">
              <img
                v-if="previewing.url && previewing.mime.startsWith('image/')"
                :src="previewing.url"
                :alt="previewing.name"
                class="max-h-50 max-w-full object-contain"
              >
              <div v-else-if="previewing.mime === 'application/pdf'" class="text-center font-sans">
                <FileText class="size-10 text-primary mx-auto mb-2" />
                <p class="text-sm font-semibold">PDF Document</p>
                <a
                  v-if="previewing.url"
                  :href="previewing.url"
                  target="_blank"
                  class="link link-primary text-xs mt-1 block font-mono"
                >
                  Open PDF in new tab ↗
                </a>
              </div>
              <div v-else class="text-xs opacity-50 font-mono">Preview unavailable</div>
            </div>

            <dl class="grid grid-cols-2 gap-2 text-xs font-mono bg-base-200/40 p-3 rounded-xl border border-base-300">
              <div><dt class="opacity-50">Folder</dt><dd>{{ previewing.folder }}</dd></div>
              <div><dt class="opacity-50">MIME</dt><dd>{{ previewing.mime }}</dd></div>
              <div><dt class="opacity-50">Size</dt><dd>{{ (previewing.sizeBytes / 1024).toFixed(1) }} KB</dd></div>
              <div><dt class="opacity-50">Dimensions</dt><dd>{{ previewing.width ? `${previewing.width}×${previewing.height} px` : '—' }}</dd></div>
              <div class="col-span-2">
                <dt class="opacity-50">Public URL</dt>
                <dd class="truncate">
                  <a v-if="previewing.url" :href="previewing.url" target="_blank" class="link text-primary">{{ previewing.url }}</a>
                  <span v-else>—</span>
                </dd>
              </div>
            </dl>

            <div class="mt-4 flex items-center justify-between border-t border-base-300 pt-4">
              <button
                type="button"
                class="btn btn-sm btn-error btn-outline gap-1.5 font-mono text-xs"
                @click="promptDelete(previewing)"
              >
                <Trash2 class="size-4" />
                <span>Delete File</span>
              </button>

              <div class="flex items-center gap-2">
                <button
                  v-if="previewing.url"
                  type="button"
                  class="btn btn-sm btn-ghost text-xs font-mono"
                  @click="copyUrl(previewing)"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-primary text-xs font-semibold"
                  @click="previewing = null"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- DELETE FILE MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="fileToDelete"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="fileToDelete = null"
        >
          <div class="relative z-10 w-full max-w-sm rounded-2xl border border-error/30 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center gap-3">
              <div class="rounded-xl bg-error/15 p-2.5 text-error">
                <Trash2 class="size-6" />
              </div>
              <div>
                <h3 class="text-base font-bold text-base-content">Delete File?</h3>
                <p class="text-xs text-base-content/60">Permanently removes file from database/storage.</p>
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

    <!-- RENAME FILE MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="fileToRename"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="fileToRename = null"
        >
          <div class="relative z-10 w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
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

    <!-- MOVE FILE MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="fileToMove"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="fileToMove = null"
        >
          <div class="relative z-10 w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <h3 class="text-base font-bold text-base-content">Move File</h3>
            <p class="text-xs text-base-content/60">Target folder path (e.g. <code class="font-mono text-primary">/</code> or <code class="font-mono text-primary">/brand</code>):</p>
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

    <!-- CREATE FOLDER MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showNewFolderModal"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="showNewFolderModal = false"
        >
          <div class="relative z-10 w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <h3 class="text-base font-bold text-base-content">Create New Folder</h3>
            <input v-model="newFolderInput" class="input input-bordered input-sm w-full font-mono text-xs" placeholder="e.g. icons" autofocus @keydown.enter.prevent="confirmCreateFolder">
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

    <!-- RENAME FOLDER MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="folderToRename"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="folderToRename = null"
        >
          <div class="relative z-10 w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <h3 class="text-base font-bold text-base-content">Rename Folder</h3>
            <input v-model="renameFolderInput" class="input input-bordered input-sm w-full font-mono text-xs" autofocus @keydown.enter.prevent="confirmRenameFolder">
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn btn-sm btn-ghost font-mono text-xs" @click="folderToRename = null">Cancel</button>
              <button type="button" class="btn btn-sm btn-primary font-semibold" :disabled="renameFolderPending || !renameFolderInput.trim()" @click="confirmRenameFolder">
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- DELETE FOLDER MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="folderToDelete"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="folderToDelete = null"
        >
          <div class="relative z-10 w-full max-w-sm rounded-2xl border border-error/30 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center gap-3">
              <div class="rounded-xl bg-error/15 p-2.5 text-error">
                <Trash2 class="size-6" />
              </div>
              <div>
                <h3 class="text-base font-bold text-base-content">Delete Folder?</h3>
                <p class="text-xs text-base-content/60">The folder must be empty to be deleted.</p>
              </div>
            </div>

            <p class="font-mono text-xs text-primary bg-base-200 p-2 rounded truncate">{{ folderToDelete }}</p>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn btn-sm btn-ghost font-mono text-xs" @click="folderToDelete = null">Cancel</button>
              <button type="button" class="btn btn-sm btn-error font-semibold" :disabled="deleteFolderPending" @click="confirmDeleteFolder">
                <span>{{ deleteFolderPending ? 'Deleting…' : 'Delete Folder' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
