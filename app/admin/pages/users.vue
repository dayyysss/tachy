<script setup lang="ts">
import { refDebounced } from '@vueuse/core'

definePageMeta({ middleware: 'admin' })

const config = useRuntimeConfig()
const toast = useToast()
const dialog = useDialog()
const route = useRoute()
const router = useRouter()

const searchInput = ref((route.query.q as string) || '')
const debouncedQ = refDebounced(searchInput, 250)
const role = ref((route.query.role as string) || '')
const banned = ref((route.query.banned as string) || '')
const page = ref(Number(route.query.page) || 1)

// Synchronize from route.query (e.g. from AdminCommandPalette or direct URL)
watch(() => route.query.q, (val) => {
  const queryStr = typeof val === 'string' ? val : ''
  if (searchInput.value !== queryStr) {
    searchInput.value = queryStr
  }
})

// Keep query parameters updated in URL and reset to page 1 on filter changes
watch(debouncedQ, (val) => {
  page.value = 1
  if ((route.query.q || '') !== val) {
    router.replace({
      query: {
        ...route.query,
        q: val || undefined,
        page: undefined,
      },
    })
  }
})

watch([role, banned], () => {
  page.value = 1
})

watch(page, (p) => {
  if (Number(route.query.page || 1) !== p) {
    router.replace({
      query: {
        ...route.query,
        page: p > 1 ? String(p) : undefined,
      },
    })
  }
})

watch(() => route.query.action, (act) => {
  if (act === 'new') {
    openCreateModal()
  }
}, { immediate: true })

const { data, error, refresh, pending } = await useFetch('/api/admin/users', {
  query: { q: debouncedQ, role, banned, page },
})

// --- CREATE USER MODAL STATE ---
const isCreateOpen = ref(false)
const createPending = ref(false)
const createError = ref('')
const createForm = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'user',
})

function openCreateModal() {
  createForm.name = ''
  createForm.username = ''
  createForm.email = ''
  createForm.password = ''
  createForm.role = 'user'
  createError.value = ''
  isCreateOpen.value = true
}

function closeCreateModal() {
  isCreateOpen.value = false
  createError.value = ''
  if (route.query.action === 'new') {
    router.replace({
      query: {
        ...route.query,
        action: undefined,
      },
    })
  }
}

async function handleCreateUser() {
  if (!createForm.email || !createForm.username || !createForm.password) {
    createError.value = 'Email, username, and password are required.'
    return
  }
  if (createForm.password.length < 8) {
    createError.value = 'Password must be at least 8 characters long.'
    return
  }
  createPending.value = true
  createError.value = ''
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        name: createForm.name.trim() || createForm.username.trim(),
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      },
    })
    toast.success(`User ${createForm.username} created successfully.`)
    closeCreateModal()
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string; message?: string } })?.data?.statusMessage
      || (err as { data?: { message?: string } })?.data?.message
      || 'Failed to create user account.'
    createError.value = msg
    toast.error(msg)
  } finally {
    createPending.value = false
  }
}

// --- EDIT USER MODAL STATE ---
const isEditOpen = ref(false)
const editPending = ref(false)
const editError = ref('')
const editForm = reactive({
  id: '',
  name: '',
  username: '',
  email: '',
  role: 'user',
  leaderboardBanned: false,
  isPublic: true,
  newPassword: '',
})

interface UserRow {
  id: string
  name: string | null
  email: string
  username: string | null
  role: string | null
  banned: boolean | null
  leaderboardBanned: boolean | null
  twoFactorEnabled: boolean | null
  isPublic?: boolean | null
  createdAt: string
  xp: number | null
  level: number | null
  totalTests: number | null
}

function openEditModal(row: UserRow) {
  editForm.id = row.id
  editForm.name = row.name ?? ''
  editForm.username = row.username ?? ''
  editForm.email = row.email ?? ''
  editForm.role = row.role ?? 'user'
  editForm.leaderboardBanned = Boolean(row.leaderboardBanned)
  editForm.isPublic = row.isPublic ?? true
  editForm.newPassword = ''
  editError.value = ''
  isEditOpen.value = true
}

function closeEditModal() {
  isEditOpen.value = false
  editError.value = ''
}

async function handleUpdateUser() {
  if (!editForm.id) return
  if (!editForm.username || !editForm.email) {
    editError.value = 'Email and username cannot be empty.'
    return
  }
  if (editForm.newPassword && editForm.newPassword.length < 8) {
    editError.value = 'New password must be at least 8 characters.'
    return
  }

  editPending.value = true
  editError.value = ''
  try {
    const payload: Record<string, unknown> = {
      name: editForm.name.trim() || editForm.username.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      leaderboardBanned: editForm.leaderboardBanned,
      isPublic: editForm.isPublic,
    }
    if (editForm.newPassword) {
      payload.password = editForm.newPassword
    }

    await $fetch(`/api/admin/users/${editForm.id}`, {
      method: 'PATCH',
      body: payload,
    })
    toast.success('User updated successfully.')
    closeEditModal()
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string; message?: string } })?.data?.statusMessage
      || (err as { data?: { message?: string } })?.data?.message
      || 'Failed to update user.'
    editError.value = msg
    toast.error(msg)
  } finally {
    editPending.value = false
  }
}

// --- BAN / UNBAN / STATS / DELETE ---
async function ban(id: string) {
  const reason = await dialog.prompt({
    title: 'Ban User',
    message: 'Enter the reason for suspending this user account:',
    placeholder: 'e.g. Botting or suspicious telemetry',
    confirmText: 'Ban Account',
    danger: true,
  })
  if (!reason) return
  try {
    await $fetch(`/api/admin/users/${id}/ban`, { method: 'POST', body: { reason } })
    toast.success('User has been banned.')
    await refresh()
  } catch {
    toast.error('Failed to ban user.')
  }
}

async function unban(id: string) {
  try {
    await $fetch(`/api/admin/users/${id}/unban`, { method: 'POST' })
    toast.success('User unbanned.')
    await refresh()
  } catch {
    toast.error('Failed to unban user.')
  }
}

async function setRole(id: string, value: string) {
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: { role: value } })
    toast.success(`Role updated to ${value}.`)
    await refresh()
  } catch {
    toast.error('Failed to update role.')
  }
}

async function toggleLeaderboard(id: string, current: boolean) {
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: { leaderboardBanned: !current } })
    toast.info(!current ? 'Excluded from leaderboards.' : 'Restored to leaderboards.')
    await refresh()
  } catch {
    toast.error('Failed to toggle leaderboard status.')
  }
}

async function resetStats(id: string) {
  const confirmed = await dialog.confirm({
    title: 'Reset User Statistics?',
    message: 'This will reset XP, level, and personal best records for this user. Test rows are kept.',
    confirmText: 'Reset Stats',
    danger: true,
  })
  if (!confirmed) return

  let code = ''
  if (config.public.adminRequire2fa) {
    const input = await dialog.prompt({
      title: '2FA Confirmation Required',
      message: 'Enter your 6-digit TOTP code to confirm this action:',
      placeholder: '000000',
    })
    if (!input) return
    code = input
  }
  try {
    await $fetch(`/api/admin/users/${id}/reset-stats`, { method: 'POST', headers: code ? { 'x-admin-reauth': code } : {} })
    toast.success('User XP and statistics have been reset.')
    await refresh()
  } catch {
    toast.error('Failed to reset stats. Check 2FA code if required.')
  }
}

async function remove(id: string) {
  const confirmed = await dialog.confirm({
    title: 'Delete User Permanently?',
    message: 'This permanently removes the user account, profile, sessions, and tests from database.',
    confirmText: 'Delete Account',
    danger: true,
  })
  if (!confirmed) return

  let code = ''
  if (config.public.adminRequire2fa) {
    const input = await dialog.prompt({
      title: '2FA Confirmation Required',
      message: 'Enter your 6-digit TOTP code to confirm this deletion:',
      placeholder: '000000',
    })
    if (!input) return
    code = input
  }
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: code ? { 'x-admin-reauth': code } : {} })
    toast.success('User deleted permanently.')
    await refresh()
  } catch {
    toast.error('Failed to delete user.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-box border border-base-300 bg-base-200/50 p-5 shadow-xs">
      <div>
        <h1 class="text-xl font-bold tracking-tight">User Management</h1>
        <p class="mt-0.5 text-xs text-base-content/60">
          Search, create, update, assign roles, ban suspicious actors, or reset progress.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-primary gap-1.5 shadow-xs font-mono text-xs"
          @click="openCreateModal"
        >
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add User</span>
        </button>

        <input
          v-model="searchInput"
          type="search"
          placeholder="Search email, username..."
          class="input input-bordered input-sm w-48 sm:w-56 font-mono text-xs"
        >
        <select v-model="role" class="select select-bordered select-sm text-xs">
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <select v-model="banned" class="select select-bordered select-sm text-xs">
          <option value="">All status</option>
          <option value="true">Banned</option>
          <option value="false">Active</option>
        </select>
        <button type="button" class="btn btn-sm btn-ghost border border-base-300" :disabled="pending" @click="refresh">
          <svg class="size-3.5" :class="{ 'animate-spin': pending }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span class="text-xs">Refresh</span>
        </button>
      </div>
    </div>

    <p v-if="error" class="alert alert-warning text-sm">Admin data unavailable (database/auth not configured).</p>

    <!-- Table Container -->
    <div class="overflow-x-auto rounded-box border border-base-300 bg-base-200/30">
      <table class="table table-sm">
        <thead class="bg-base-200/60 font-mono text-[11px] uppercase tracking-wider text-base-content/50">
          <tr>
            <th>User Account</th>
            <th>Role</th>
            <th>Total XP</th>
            <th>Tests</th>
            <th>Security</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending"><td colspan="7" class="py-8 text-center opacity-50 font-sans text-xs">Loading accounts…</td></tr>
          <tr v-else-if="!data?.rows?.length"><td colspan="7" class="py-8 text-center opacity-50 font-sans text-xs">No users matching search filters.</td></tr>
          <tr v-for="row in data?.rows" :key="row.id" class="hover:bg-base-200/50 transition-colors">
            <td>
              <div class="flex items-center gap-2.5">
                <div class="avatar placeholder">
                  <div class="size-7 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center font-mono">
                    {{ (row.username || row.name || 'U').charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div>
                  <p class="font-medium text-xs">{{ row.username || row.name }}</p>
                  <p class="text-[10px] opacity-50 font-mono">{{ row.email }}</p>
                </div>
              </div>
            </td>
            <td>
              <select
                :value="row.role"
                class="select select-bordered select-xs font-mono uppercase text-[10px]"
                :class="row.role === 'admin' ? 'text-primary font-bold' : ''"
                @change="setRole(row.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="user">user</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td class="font-mono text-xs tabular-nums">{{ (row.xp ?? 0).toLocaleString() }}</td>
            <td class="font-mono text-xs tabular-nums">{{ (row.totalTests ?? 0).toLocaleString() }}</td>
            <td>
              <span
                class="badge badge-xs font-mono uppercase"
                :class="row.twoFactorEnabled ? 'badge-success' : 'badge-ghost text-base-content/40'"
              >
                {{ row.twoFactorEnabled ? '2FA ON' : '2FA OFF' }}
              </span>
            </td>
            <td>
              <span v-if="row.banned" class="badge badge-error badge-xs font-mono uppercase">banned</span>
              <span v-else class="badge badge-success badge-xs font-mono uppercase">active</span>
              <span v-if="row.leaderboardBanned" class="badge badge-warning badge-xs font-mono uppercase ml-1">no lb</span>
            </td>
            <td>
              <div class="flex justify-end items-center gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                  title="Edit user details"
                  @click="openEditModal(row)"
                >
                  edit
                </button>
                <button v-if="row.banned" type="button" class="btn btn-ghost btn-xs text-success" @click="unban(row.id)">unban</button>
                <button v-else type="button" class="btn btn-ghost btn-xs text-error" @click="ban(row.id)">ban</button>
                <button type="button" class="btn btn-ghost btn-xs text-base-content/60" @click="toggleLeaderboard(row.id, Boolean(row.leaderboardBanned))">board</button>
                <button type="button" class="btn btn-ghost btn-xs text-warning" @click="resetStats(row.id)">reset</button>
                <button type="button" class="btn btn-ghost btn-xs text-error" @click="remove(row.id)">del</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="data?.total" class="flex items-center justify-between text-xs text-base-content/60 font-mono">
      <span>Total: {{ data.total }} account(s)</span>
      <div class="flex gap-1">
        <button type="button" class="btn btn-xs btn-ghost border border-base-300" :disabled="page <= 1" @click="page--">Prev</button>
        <span class="btn btn-xs btn-ghost no-animation">Page {{ page }}</span>
        <button type="button" class="btn btn-xs btn-ghost border border-base-300" :disabled="!data?.rows?.length || page * (data?.perPage || 25) >= (data?.total || 0)" @click="page++">Next</button>
      </div>
    </div>

    <!-- CREATE USER MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isCreateOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          @click.self="closeCreateModal"
        >
          <div class="modal-box relative w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-base-200 pb-3">
              <h2 class="text-sm font-bold tracking-tight">Create New User</h2>
              <button type="button" class="btn btn-ghost btn-xs btn-circle" @click="closeCreateModal">✕</button>
            </div>

            <div v-if="createError" class="rounded-lg bg-error/15 p-3 text-xs text-error font-mono">
              {{ createError }}
            </div>

            <form class="space-y-3" @submit.prevent="handleCreateUser">
              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Username *</label>
                <input
                  v-model="createForm.username"
                  type="text"
                  required
                  placeholder="e.g. swift_fingers"
                  class="input input-bordered input-sm w-full font-mono text-xs"
                >
              </div>

              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Display Name</label>
                <input
                  v-model="createForm.name"
                  type="text"
                  placeholder="e.g. Swift Fingers"
                  class="input input-bordered input-sm w-full text-xs"
                >
              </div>

              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Email Address *</label>
                <input
                  v-model="createForm.email"
                  type="email"
                  required
                  placeholder="typist@tachy.dev"
                  class="input input-bordered input-sm w-full font-mono text-xs"
                >
              </div>

              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Password * (min 8 chars)</label>
                <input
                  v-model="createForm.password"
                  type="password"
                  required
                  placeholder="••••••••"
                  class="input input-bordered input-sm w-full font-mono text-xs"
                >
              </div>

              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Account Role</label>
                <select v-model="createForm.role" class="select select-bordered select-sm w-full font-mono text-xs">
                  <option value="user">User (Standard Typist)</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-base-200">
                <button type="button" class="btn btn-sm btn-ghost font-mono text-xs" :disabled="createPending" @click="closeCreateModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-sm btn-primary font-mono text-xs" :disabled="createPending">
                  <span v-if="createPending" class="loading loading-spinner loading-xs" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- EDIT USER MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isEditOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          @click.self="closeEditModal"
        >
          <div class="modal-box relative w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-base-200 pb-3">
              <div>
                <h2 class="text-sm font-bold tracking-tight">Edit User Details</h2>
                <p class="text-[10px] text-base-content/40 font-mono">{{ editForm.id }}</p>
              </div>
              <button type="button" class="btn btn-ghost btn-xs btn-circle" @click="closeEditModal">✕</button>
            </div>

            <div v-if="editError" class="rounded-lg bg-error/15 p-3 text-xs text-error font-mono">
              {{ editError }}
            </div>

            <form class="space-y-3" @submit.prevent="handleUpdateUser">
              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Username *</label>
                <input
                  v-model="editForm.username"
                  type="text"
                  required
                  class="input input-bordered input-sm w-full font-mono text-xs"
                >
              </div>

              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Display Name</label>
                <input
                  v-model="editForm.name"
                  type="text"
                  class="input input-bordered input-sm w-full text-xs"
                >
              </div>

              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Email Address *</label>
                <input
                  v-model="editForm.email"
                  type="email"
                  required
                  class="input input-bordered input-sm w-full font-mono text-xs"
                >
              </div>

              <div class="space-y-1">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">Account Role</label>
                <select v-model="editForm.role" class="select select-bordered select-sm w-full font-mono text-xs">
                  <option value="user">User (Standard Typist)</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <label class="label cursor-pointer justify-start gap-2 border border-base-300 rounded-lg p-2">
                  <input v-model="editForm.isPublic" type="checkbox" class="checkbox checkbox-xs checkbox-primary">
                  <span class="label-text text-xs">Public Profile</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2 border border-base-300 rounded-lg p-2">
                  <input v-model="editForm.leaderboardBanned" type="checkbox" class="checkbox checkbox-xs checkbox-warning">
                  <span class="label-text text-xs text-warning">Exclude Leaderboard</span>
                </label>
              </div>

              <div class="space-y-1 pt-1 border-t border-base-200">
                <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">
                  Reset Password <span class="text-[10px] text-base-content/40 lowercase">(leave empty to keep current)</span>
                </label>
                <input
                  v-model="editForm.newPassword"
                  type="password"
                  placeholder="New password (optional)"
                  class="input input-bordered input-sm w-full font-mono text-xs"
                >
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-base-200">
                <button type="button" class="btn btn-sm btn-ghost font-mono text-xs" :disabled="editPending" @click="closeEditModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-sm btn-primary font-mono text-xs" :disabled="editPending">
                  <span v-if="editPending" class="loading loading-spinner loading-xs" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
