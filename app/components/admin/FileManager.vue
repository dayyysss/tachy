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

const props = withDefaults(defineProps<{ mode?: 'manage' | 'select' }>(), { mode: 'manage' })
const emit = defineEmits<{ select: [file: StoredFile] }>()

const folder = ref('/')
const search = ref('')
const filterType = ref('')
const previewing = ref<StoredFile | null>(null)
const uploading = ref(false)
const message = ref('')

const { data, refresh } = await useFetch<{ folder: string; rows: StoredFile[]; folders: { path: string }[] }>('/api/admin/files', {
  query: { folder, q: search, type: filterType },
})

const crumbs = computed(() => {
  const parts = folder.value.split('/').filter(Boolean)
  return [{ label: 'root', path: '/' }, ...parts.map((part, index) => ({ label: part, path: `/${parts.slice(0, index + 1).join('/')}` }))]
})

function openFolder(path: string) {
  folder.value = path
}

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  await uploadFiles(Array.from(input.files ?? []))
  input.value = ''
}

async function uploadFiles(selected: File[]) {
  if (!selected.length) return
  uploading.value = true
  message.value = ''
  let failed = 0

  for (const file of selected) {
    try {
      const target = await $fetch<{ fileId: string; bucket: string; objectKey: string; signedUrl: string }>('/api/admin/files/upload-url', {
        method: 'POST',
        body: { name: file.name, folder: folder.value, mime: file.type, size: file.size },
      })

      const response = await fetch(target.signedUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type, 'x-upsert': 'false' },
        body: file,
      })
      if (!response.ok) throw new Error('Upload failed')

      await $fetch('/api/admin/files/confirm', {
        method: 'POST',
        body: {
          fileId: target.fileId,
          bucket: target.bucket,
          objectKey: target.objectKey,
          name: file.name,
          folder: folder.value,
        },
      })
    } catch {
      failed++
    }
  }

  await refresh()
  message.value = failed ? `${failed} upload(s) failed.` : 'Uploaded.'
  uploading.value = false
  input.value = ''
}

async function rename(file: StoredFile) {
  const name = window.prompt('New name', file.name)?.trim()
  if (!name || name === file.name) return
  await $fetch(`/api/admin/files/${file.id}`, { method: 'PATCH', body: { name } })
  await refresh()
}

async function move(file: StoredFile) {
  const target = window.prompt('Move to folder', file.folder)?.trim()
  if (!target || !target.startsWith('/')) return
  try {
    await $fetch(`/api/admin/files/${file.id}`, { method: 'PATCH', body: { folder: target } })
    await refresh()
  } catch {
    message.value = 'Could not move the file.'
  }
}

async function copyUrl(file: StoredFile) {
  if (!file.url) return
  await navigator.clipboard.writeText(file.url)
  message.value = 'URL copied.'
}

async function createFolder() {
  const name = window.prompt('Folder name')?.trim()
  if (!name) return
  const path = folder.value === '/' ? `/${name}` : `${folder.value}/${name}`
  await $fetch('/api/admin/folders', { method: 'POST', body: { path } })
  await refresh()
}

async function remove(file: StoredFile) {
  if (!window.confirm(`Delete ${file.name}?`)) return
  const code = window.prompt('Enter your 2FA TOTP code to confirm deletion:')
  if (code === null) return
  try {
    await $fetch(`/api/admin/files/${file.id}`, {
      method: 'DELETE',
      headers: code ? { 'x-admin-reauth': code } : {},
    })
    await refresh()
  } catch {
    message.value = 'File is in use or could not be deleted.'
  }
}
</script>

<template>
  <div @dragover.prevent @drop.prevent="drop">
    <div class="flex flex-wrap items-center gap-2">
      <nav class="flex items-center gap-1 text-sm">
        <button v-for="crumb in crumbs" :key="crumb.path" type="button" class="btn btn-ghost btn-xs" @click="openFolder(crumb.path)">
          {{ crumb.label }}
        </button>
      </nav>
      <select v-model="filterType" class="select select-bordered select-xs ml-auto">
        <option value="">All types</option>
        <option value="image">Images</option>
        <option value="image/svg+xml">SVG</option>
        <option value="application/pdf">PDF</option>
      </select>
      <input v-model="search" type="search" placeholder="Search" class="input input-bordered input-xs w-36">
      <button type="button" class="btn btn-ghost btn-xs" @click="createFolder">New folder</button>
      <label class="btn btn-primary btn-xs">
        {{ uploading ? 'Uploading…' : 'Upload' }}
        <input type="file" class="hidden" multiple :disabled="uploading" @change="upload">
      </label>
    </div>

    <p v-if="message" class="mt-2 text-xs text-warning">{{ message }}</p>

    <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="item in data?.folders?.filter(f => f.path !== folder && f.path.startsWith(folder === '/' ? '/' : `${folder}/`) && f.path.split('/').filter(Boolean).length === (folder === '/' ? 1 : folder.split('/').filter(Boolean).length + 1))"
        :key="item.path"
        type="button"
        class="flex items-center gap-2 rounded-box border border-base-300 p-3 text-left text-sm hover:border-primary"
        @click="openFolder(item.path)"
      >
        <span class="text-primary">▸</span> {{ item.path.split('/').pop() }}
      </button>

      <div v-for="file in data?.rows" :key="file.id" class="rounded-box border border-base-300 p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 gap-2">
            <img v-if="file.url && file.mime.startsWith('image/')" :src="file.url" :alt="file.name" class="size-10 rounded object-cover">
            <div class="min-w-0 cursor-pointer" @click="previewing = file">
              <p class="truncate text-sm font-medium hover:text-primary">{{ file.name }}</p>
              <p class="text-xs opacity-50">{{ file.mime }} · {{ Math.round(file.sizeBytes / 1024) }} KB<span v-if="file.width"> · {{ file.width }}×{{ file.height }}</span></p>
            </div>
          </div>
          <div class="flex shrink-0 gap-1">
            <button v-if="props.mode === 'select'" type="button" class="btn btn-primary btn-xs" @click="emit('select', file)">Use</button>
            <template v-if="props.mode === 'manage'">
              <button type="button" class="btn btn-ghost btn-xs" @click="previewing = file">Info</button>
              <button type="button" class="btn btn-ghost btn-xs" @click="copyUrl(file)">URL</button>
              <button type="button" class="btn btn-ghost btn-xs" @click="rename(file)">Rename</button>
              <button type="button" class="btn btn-ghost btn-xs" @click="move(file)">Move</button>
              <button type="button" class="btn btn-ghost btn-xs text-error" @click="remove(file)">Delete</button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!data?.rows?.length" class="py-8 text-center text-sm opacity-50">This folder is empty.</p>

    <!-- File Details / Preview Modal -->
    <div v-if="previewing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="previewing = null">
      <div class="w-full max-w-lg rounded-box border border-base-300 bg-base-100 p-5 shadow-2xl">
        <div class="flex items-center justify-between border-b border-base-300 pb-3">
          <h3 class="font-semibold truncate">{{ previewing.name }}</h3>
          <button type="button" class="btn btn-ghost btn-xs" @click="previewing = null">✕</button>
        </div>

        <div class="mt-4 flex max-h-56 items-center justify-center overflow-hidden rounded bg-base-200 p-2">
          <img v-if="previewing.url && previewing.mime.startsWith('image/')" :src="previewing.url" :alt="previewing.name" class="max-h-52 max-w-full object-contain">
          <div v-else-if="previewing.mime === 'application/pdf'" class="text-center">
            <p class="text-sm">PDF Document</p>
            <a v-if="previewing.url" :href="previewing.url" target="_blank" class="link link-primary text-xs mt-1 block">Open PDF in new tab</a>
          </div>
          <div v-else class="text-xs opacity-50">Preview unavailable</div>
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div><dt class="opacity-50">Folder</dt><dd class="font-mono">{{ previewing.folder }}</dd></div>
          <div><dt class="opacity-50">MIME</dt><dd class="font-mono">{{ previewing.mime }}</dd></div>
          <div><dt class="opacity-50">Size</dt><dd>{{ (previewing.sizeBytes / 1024).toFixed(1) }} KB</dd></div>
          <div><dt class="opacity-50">Dimensions</dt><dd>{{ previewing.width ? `${previewing.width}×${previewing.height} px` : '—' }}</dd></div>
          <div class="col-span-2"><dt class="opacity-50">Object Key</dt><dd class="font-mono truncate">{{ previewing.objectKey }}</dd></div>
          <div class="col-span-2"><dt class="opacity-50">Public URL</dt><dd class="font-mono truncate"><a v-if="previewing.url" :href="previewing.url" target="_blank" class="link">{{ previewing.url }}</a><span v-else>—</span></dd></div>
        </dl>

        <div class="mt-5 flex justify-end gap-2">
          <button v-if="previewing.url" type="button" class="btn btn-sm btn-ghost" @click="copyUrl(previewing)">Copy URL</button>
          <button type="button" class="btn btn-sm btn-primary" @click="previewing = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>
