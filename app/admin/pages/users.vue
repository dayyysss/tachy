<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import {
  Users as UsersIcon,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Edit,
  MoreHorizontal,
  Check,
} from 'lucide-vue-next'

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

// Selection & Bulk Operations
const selectedUserIds = ref<string[]>([])

// Synchronize from route.query
watch(() => route.query.q, (val) => {
  const queryStr = typeof val === 'string' ? val : ''
  if (searchInput.value !== queryStr) {
    searchInput.value = queryStr
  }
})

watch(debouncedQ, (val) => {
  page.value = 1
  selectedUserIds.value = []
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
  selectedUserIds.value = []
})

watch(page, (p) => {
  selectedUserIds.value = []
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

const isAllSelected = computed(() => {
  const rows = data.value?.rows ?? []
  if (!rows.length) return false
  return rows.every(r => selectedUserIds.value.includes(r.id))
})

function toggleSelectAll() {
  const rows = data.value?.rows ?? []
  if (isAllSelected.value) {
    selectedUserIds.value = []
  } else {
    selectedUserIds.value = rows.map(r => r.id)
  }
}

function clearSelection() {
  selectedUserIds.value = []
}

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

const rbacDescriptions: Record<string, { label: string; desc: string; permissions: string[] }> = {
  user: {
    label: 'Standard Typist',
    desc: 'General access to test typing, view leaderboards, customize themes, and export personal history.',
    permissions: ['self:read', 'self:write'],
  },
  moderator: {
    label: 'Moderator',
    desc: 'Can inspect user lists, review anti-cheat flagged tests, and approve or reject submissions.',
    permissions: ['self:*', 'users:read', 'tests:review'],
  },
  admin: {
    label: 'Superadministrator',
    desc: 'Unrestricted master access to all system settings, user mutation, branding, audit logs, and cloud files.',
    permissions: ['* (Full Access)'],
  },
}

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

// --- ACTIONS: BAN / UNBAN / STATS / DELETE ---
async function ban(id: string) {
  const reason = await dialog.prompt({
    title: 'Ban User Account',
    message: 'Enter the reason for suspending this user account:',
    placeholder: 'e.g. Botting or suspicious telemetry anomaly',
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
    toast.success('User ban lifted.')
    await refresh()
  } catch {
    toast.error('Failed to unban user.')
  }
}

async function setRole(id: string, newRole: string) {
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: { role: newRole } })
    toast.success(`Role changed to ${newRole}.`)
    await refresh()
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Failed to update role.'
    toast.error(msg)
    await refresh()
  }
}

async function resetStats(id: string) {
  const confirmed = await dialog.confirm({
    title: 'Reset User Progress?',
    message: 'This will reset XP, level, total words, streaks, and test counts to zero. This cannot be undone.',
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
    toast.success('User stats reset.')
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
    selectedUserIds.value = selectedUserIds.value.filter(item => item !== id)
    await refresh()
  } catch {
    toast.error('Failed to delete user.')
  }
}

// --- BULK ACTIONS ---
async function bulkBan() {
  if (!selectedUserIds.value.length) return
  const reason = await dialog.prompt({
    title: `Ban ${selectedUserIds.value.length} Users`,
    message: 'Enter reason for suspending all selected accounts:',
    placeholder: 'e.g. Bulk ban suspicious accounts',
    confirmText: 'Ban All Selected',
    danger: true,
  })
  if (!reason) return

  let successCount = 0
  for (const id of selectedUserIds.value) {
    try {
      await $fetch(`/api/admin/users/${id}/ban`, { method: 'POST', body: { reason } })
      successCount++
    } catch {}
  }
  toast.success(`Successfully banned ${successCount} user(s).`)
  clearSelection()
  await refresh()
}

async function bulkUnban() {
  if (!selectedUserIds.value.length) return
  let successCount = 0
  for (const id of selectedUserIds.value) {
    try {
      await $fetch(`/api/admin/users/${id}/unban`, { method: 'POST' })
      successCount++
    } catch {}
  }
  toast.success(`Successfully unbanned ${successCount} user(s).`)
  clearSelection()
  await refresh()
}

async function bulkDelete() {
  if (!selectedUserIds.value.length) return
  const confirmed = await dialog.confirm({
    title: `Delete ${selectedUserIds.value.length} Users Permanently?`,
    message: 'This permanently purges all selected accounts from the system. This cannot be undone.',
    confirmText: 'Delete Selected',
    danger: true,
  })
  if (!confirmed) return

  let code = ''
  if (config.public.adminRequire2fa) {
    const input = await dialog.prompt({
      title: '2FA Confirmation Required',
      message: 'Enter your 6-digit TOTP code to confirm bulk deletion:',
      placeholder: '000000',
    })
    if (!input) return
    code = input
  }

  let successCount = 0
  for (const id of selectedUserIds.value) {
    try {
      await $fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: code ? { 'x-admin-reauth': code } : {} })
      successCount++
    } catch {}
  }
  toast.success(`Deleted ${successCount} user(s).`)
  clearSelection()
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Standardized Admin Header -->
    <AdminPageHeader
      title="User Management & RBAC"
      subtitle="Search, create, update, assign role-based permissions, or moderate user accounts."
      category="SECURITY & ACCESS"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-sm btn-primary gap-1.5 font-semibold shadow-xs"
          @click="openCreateModal"
        >
          <UserPlus class="size-4" />
          <span>Add User</span>
        </button>

        <button
          type="button"
          class="btn btn-sm btn-ghost border border-base-300 gap-1.5"
          :disabled="pending"
          title="Reload table"
          @click="refresh"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': pending }" />
          <span class="text-xs">Refresh</span>
        </button>
      </template>
    </AdminPageHeader>

    <!-- Friendly Toolbar: Search on Left, Filters on Right -->
    <div class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xs md:flex-row md:items-center md:justify-between">
      <!-- Search Input on Left -->
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
        <input
          v-model="searchInput"
          type="search"
          placeholder="Search by name, username, or email…"
          class="input input-bordered input-sm w-full pl-10 text-xs font-mono"
        >
      </div>

      <!-- Filters on Right -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1.5 text-xs text-base-content/60 font-medium">
          <Filter class="size-3.5" />
          <span>Filters:</span>
        </div>

        <select v-model="role" class="select select-bordered select-sm text-xs">
          <option value="">All Roles</option>
          <option value="user">User (Standard)</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin (Full)</option>
        </select>

        <select v-model="banned" class="select select-bordered select-sm text-xs">
          <option value="">All Statuses</option>
          <option value="false">Active Only</option>
          <option value="true">Banned Only</option>
        </select>

        <button
          v-if="searchInput || role || banned"
          type="button"
          class="btn btn-xs btn-ghost text-error"
          @click="searchInput = ''; role = ''; banned = ''"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Bulk Action Floating Bar -->
    <Transition name="fade">
      <div
        v-if="selectedUserIds.length"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 shadow-md"
      >
        <div class="flex items-center gap-2">
          <span class="badge badge-primary font-mono text-xs font-bold">{{ selectedUserIds.length }}</span>
          <span class="text-xs font-semibold text-base-content">User account(s) selected</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-xs btn-warning font-semibold gap-1" @click="bulkBan">
            <XCircle class="size-3" />
            <span>Ban Selected</span>
          </button>
          <button type="button" class="btn btn-xs btn-success font-semibold gap-1" @click="bulkUnban">
            <CheckCircle class="size-3" />
            <span>Unban Selected</span>
          </button>
          <button type="button" class="btn btn-xs btn-error font-semibold gap-1" @click="bulkDelete">
            <Trash2 class="size-3" />
            <span>Delete Selected</span>
          </button>
          <button type="button" class="btn btn-xs btn-ghost border border-base-300" @click="clearSelection">
            Deselect
          </button>
        </div>
      </div>
    </Transition>

    <p v-if="error" class="alert alert-warning text-sm">
      Admin data unavailable. Please verify database connection.
    </p>

    <!-- Table Container -->
    <div class="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-xs">
      <table class="table table-sm">
        <thead class="bg-base-200/70 font-mono text-[11px] uppercase tracking-wider text-base-content/60">
          <tr>
            <th class="w-10 text-center">
              <input
                type="checkbox"
                class="checkbox checkbox-xs checkbox-primary"
                :checked="isAllSelected"
                @change="toggleSelectAll"
              >
            </th>
            <th>User Account</th>
            <th>Role (RBAC)</th>
            <th>Progress & Level</th>
            <th>Security</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending">
            <td colspan="7" class="py-12 text-center text-xs opacity-50">
              <span class="loading loading-spinner loading-sm text-primary inline-block mr-2" />
              Loading accounts…
            </td>
          </tr>
          <tr v-else-if="!data?.rows?.length">
            <td colspan="7" class="py-12 text-center text-xs opacity-50 font-mono">
              No users matching search filters.
            </td>
          </tr>
          <tr
            v-for="row in data?.rows"
            :key="row.id"
            class="hover:bg-base-200/50 transition-colors"
            :class="{ 'bg-primary/5': selectedUserIds.includes(row.id) }"
          >
            <!-- Checkbox -->
            <td class="text-center">
              <input
                v-model="selectedUserIds"
                type="checkbox"
                :value="row.id"
                class="checkbox checkbox-xs checkbox-primary"
              >
            </td>

            <!-- User Account Details -->
            <td>
              <div class="flex items-center gap-3">
                <div class="avatar placeholder">
                  <div class="size-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center font-mono ring-1 ring-primary/30">
                    {{ (row.username || row.name || 'U').charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-xs text-base-content flex items-center gap-1.5">
                    <span class="truncate">{{ row.name || row.username }}</span>
                    <span v-if="row.username" class="text-[10px] text-base-content/50 font-mono">@{{ row.username }}</span>
                  </p>
                  <p class="text-[11px] text-base-content/50 font-mono truncate">{{ row.email }}</p>
                </div>
              </div>
            </td>

            <!-- Role (RBAC) -->
            <td>
              <div class="flex items-center gap-1.5">
                <select
                  :value="row.role"
                  class="select select-bordered select-xs font-mono uppercase text-[10px] font-bold"
                  :class="row.role === 'admin' ? 'select-primary text-primary' : row.role === 'moderator' ? 'select-secondary text-secondary' : ''"
                  @change="setRole(row.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <span class="text-[10px] text-base-content/40 font-mono hidden lg:inline">
                  {{ rbacDescriptions[row.role || 'user']?.label }}
                </span>
              </div>
            </td>

            <!-- Progress & Level -->
            <td>
              <div class="font-mono text-xs">
                <div class="flex items-center gap-1.5">
                  <span class="badge badge-neutral badge-xs font-bold">Lvl {{ row.level ?? 1 }}</span>
                  <span class="tabular-nums font-semibold">{{ (row.xp ?? 0).toLocaleString() }} XP</span>
                </div>
                <p class="text-[10px] text-base-content/50 mt-0.5">{{ (row.totalTests ?? 0).toLocaleString() }} tests</p>
              </div>
            </td>

            <!-- Security (2FA) -->
            <td>
              <span
                class="badge badge-xs font-mono uppercase font-semibold"
                :class="row.twoFactorEnabled ? 'badge-success text-success-content' : 'badge-ghost text-base-content/40'"
              >
                {{ row.twoFactorEnabled ? '2FA ON' : '2FA OFF' }}
              </span>
            </td>

            <!-- Status -->
            <td>
              <div class="flex flex-wrap items-center gap-1">
                <span v-if="row.banned" class="badge badge-error badge-xs font-mono uppercase font-bold">banned</span>
                <span v-else class="badge badge-success badge-xs font-mono uppercase font-bold">active</span>
                <span v-if="row.leaderboardBanned" class="badge badge-warning badge-xs font-mono uppercase font-medium">no lb</span>
              </div>
            </td>

            <!-- Actions -->
            <td>
              <div class="flex justify-end items-center gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-primary hover:bg-primary/10 gap-1 font-sans"
                  title="Edit user details"
                  @click="openEditModal(row)"
                >
                  <Edit class="size-3" />
                  <span>Edit</span>
                </button>

                <button
                  v-if="row.banned"
                  type="button"
                  class="btn btn-ghost btn-xs text-success hover:bg-success/10 font-sans"
                  title="Unban account"
                  @click="unban(row.id)"
                >
                  Unban
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-ghost btn-xs text-warning hover:bg-warning/10 font-sans"
                  title="Ban account"
                  @click="ban(row.id)"
                >
                  Ban
                </button>

                <div class="dropdown dropdown-end">
                  <label tabindex="0" class="btn btn-ghost btn-xs btn-square text-base-content/60">
                    <MoreHorizontal class="size-3.5" />
                  </label>
                  <ul tabindex="0" class="dropdown-content menu z-[50] w-44 rounded-box border border-base-300 bg-base-100 p-1.5 shadow-xl text-xs font-sans">
                    <li>
                      <button type="button" class="text-warning gap-2" @click="resetStats(row.id)">
                        <RotateCcw class="size-3.5" />
                        <span>Reset Progress</span>
                      </button>
                    </li>
                    <li>
                      <button type="button" class="text-error gap-2" @click="remove(row.id)">
                        <Trash2 class="size-3.5" />
                        <span>Delete Permanently</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-base-content/60 font-mono">
      <span>Page {{ data?.page ?? 1 }} · Total {{ data?.total ?? 0 }} registered accounts</span>
      <div class="join">
        <button
          type="button"
          class="join-item btn btn-xs btn-ghost border border-base-300"
          :disabled="page <= 1"
          @click="page--"
        >
          Previous
        </button>
        <button
          type="button"
          class="join-item btn btn-xs btn-ghost border border-base-300"
          :disabled="!data?.rows?.length || data.rows.length < (data?.perPage || 20)"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>

    <!-- CREATE USER MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isCreateOpen"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="closeCreateModal"
        >
          <div class="relative z-10 w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-base-300 pb-3">
              <div class="flex items-center gap-2">
                <UserPlus class="size-5 text-primary" />
                <h3 class="text-base font-bold text-base-content">Add New User Account</h3>
              </div>
              <button type="button" class="btn btn-ghost btn-xs btn-square" @click="closeCreateModal">✕</button>
            </div>

            <p v-if="createError" class="alert alert-error text-xs py-2">{{ createError }}</p>

            <form class="space-y-4 text-xs font-sans" @submit.prevent="handleCreateUser">
              <div class="grid sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-base-content/70 mb-1">Display Name</label>
                  <input v-model="createForm.name" placeholder="John Doe" class="input input-bordered input-sm w-full">
                </div>
                <div>
                  <label class="block font-medium text-base-content/70 mb-1">Username *</label>
                  <input v-model="createForm.username" placeholder="johndoe" required class="input input-bordered input-sm w-full font-mono">
                </div>
              </div>

              <div>
                <label class="block font-medium text-base-content/70 mb-1">Email Address *</label>
                <input v-model="createForm.email" type="email" placeholder="john@example.com" required class="input input-bordered input-sm w-full font-mono">
              </div>

              <div>
                <label class="block font-medium text-base-content/70 mb-1">Initial Password * (min. 8 characters)</label>
                <input v-model="createForm.password" type="password" placeholder="••••••••" required class="input input-bordered input-sm w-full font-mono">
              </div>

              <div>
                <label class="block font-medium text-base-content/70 mb-1">Role-Based Access Control (RBAC) *</label>
                <select v-model="createForm.role" class="select select-bordered select-sm w-full font-medium">
                  <option value="user">User — Standard Member</option>
                  <option value="moderator">Moderator — Anti-Cheat Reviewer</option>
                  <option value="admin">Admin — Full Platform Access</option>
                </select>

                <!-- RBAC Info Card -->
                <div class="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] space-y-1">
                  <p class="font-semibold text-primary">{{ rbacDescriptions[createForm.role]?.label }}</p>
                  <p class="text-base-content/70 leading-relaxed">{{ rbacDescriptions[createForm.role]?.desc }}</p>
                  <div class="flex flex-wrap gap-1 pt-1">
                    <span v-for="perm in rbacDescriptions[createForm.role]?.permissions" :key="perm" class="badge badge-xs badge-neutral font-mono">
                      {{ perm }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-base-300">
                <button type="button" class="btn btn-sm btn-ghost" @click="closeCreateModal">Cancel</button>
                <button type="submit" class="btn btn-sm btn-primary font-semibold shadow-xs" :disabled="createPending">
                  <span v-if="createPending" class="loading loading-spinner loading-xs" />
                  <span>{{ createPending ? 'Creating…' : 'Create User' }}</span>
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
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click.self="closeEditModal"
        >
          <div class="relative z-10 w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-base-300 pb-3">
              <div class="flex items-center gap-2">
                <Edit class="size-5 text-primary" />
                <h3 class="text-base font-bold text-base-content">Edit Account: @{{ editForm.username }}</h3>
              </div>
              <button type="button" class="btn btn-ghost btn-xs btn-square" @click="closeEditModal">✕</button>
            </div>

            <p v-if="editError" class="alert alert-error text-xs py-2">{{ editError }}</p>

            <form class="space-y-4 text-xs font-sans" @submit.prevent="handleUpdateUser">
              <div class="grid sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-medium text-base-content/70 mb-1">Display Name</label>
                  <input v-model="editForm.name" class="input input-bordered input-sm w-full">
                </div>
                <div>
                  <label class="block font-medium text-base-content/70 mb-1">Username *</label>
                  <input v-model="editForm.username" required class="input input-bordered input-sm w-full font-mono">
                </div>
              </div>

              <div>
                <label class="block font-medium text-base-content/70 mb-1">Email Address *</label>
                <input v-model="editForm.email" type="email" required class="input input-bordered input-sm w-full font-mono">
              </div>

              <div>
                <label class="block font-medium text-base-content/70 mb-1">Reset Password (leave blank to keep unchanged)</label>
                <input v-model="editForm.newPassword" type="password" placeholder="New password (min 8 chars)" class="input input-bordered input-sm w-full font-mono">
              </div>

              <div>
                <label class="block font-medium text-base-content/70 mb-1">Assigned Role (RBAC)</label>
                <select v-model="editForm.role" class="select select-bordered select-sm w-full font-medium">
                  <option value="user">User — Standard Member</option>
                  <option value="moderator">Moderator — Anti-Cheat Reviewer</option>
                  <option value="admin">Admin — Full Platform Access</option>
                </select>

                <div class="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] space-y-1">
                  <p class="font-semibold text-primary">{{ rbacDescriptions[editForm.role]?.label }}</p>
                  <p class="text-base-content/70 leading-relaxed">{{ rbacDescriptions[editForm.role]?.desc }}</p>
                  <div class="flex flex-wrap gap-1 pt-1">
                    <span v-for="perm in rbacDescriptions[editForm.role]?.permissions" :key="perm" class="badge badge-xs badge-neutral font-mono">
                      {{ perm }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between rounded-xl border border-base-300 p-3">
                <div>
                  <p class="font-semibold text-base-content">Exclude from Leaderboards</p>
                  <p class="text-[11px] text-base-content/50">Disables scores from appearing on public competitive boards</p>
                </div>
                <input v-model="editForm.leaderboardBanned" type="checkbox" class="toggle toggle-warning toggle-sm">
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-base-300">
                <button type="button" class="btn btn-sm btn-ghost" @click="closeEditModal">Cancel</button>
                <button type="submit" class="btn btn-sm btn-primary font-semibold shadow-xs" :disabled="editPending">
                  <span v-if="editPending" class="loading loading-spinner loading-xs" />
                  <span>{{ editPending ? 'Saving…' : 'Save Changes' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
