<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const q = ref('')
const role = ref('')
const banned = ref('')
const page = ref(1)

const { data, error, refresh, pending } = await useFetch('/api/admin/users', {
  query: { q, role, banned, page },
})

async function ban(id: string) {
  const reason = window.prompt('Ban reason')
  if (!reason) return
  await $fetch(`/api/admin/users/${id}/ban`, { method: 'POST', body: { reason } })
  await refresh()
}

async function unban(id: string) {
  await $fetch(`/api/admin/users/${id}/unban`, { method: 'POST' })
  await refresh()
}

async function setRole(id: string, value: string) {
  await $fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: { role: value } })
  await refresh()
}

async function toggleLeaderboard(id: string, current: boolean) {
  await $fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: { leaderboardBanned: !current } })
  await refresh()
}

async function resetStats(id: string) {
  if (!window.confirm('Reset XP and stats for this user? Tests are kept.')) return
  const code = window.prompt('Enter your 2FA TOTP code to confirm:')
  if (code === null) return
  await $fetch(`/api/admin/users/${id}/reset-stats`, { method: 'POST', headers: code ? { 'x-admin-reauth': code } : {} })
  await refresh()
}

async function remove(id: string) {
  if (!window.confirm('Delete this account and all its data?')) return
  const code = window.prompt('Enter your 2FA TOTP code to confirm:')
  if (code === null) return
  await $fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: code ? { 'x-admin-reauth': code } : {} })
  await refresh()
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold">Users</h1>

    <div class="mt-4 flex flex-wrap gap-2">
      <input v-model="q" type="search" placeholder="Search email, username, name" class="input input-bordered input-sm w-64">
      <select v-model="role" class="select select-bordered select-sm">
        <option value="">All roles</option>
        <option value="user">user</option>
        <option value="moderator">moderator</option>
        <option value="admin">admin</option>
      </select>
      <select v-model="banned" class="select select-bordered select-sm">
        <option value="">All status</option>
        <option value="true">Banned</option>
        <option value="false">Active</option>
      </select>
      <button type="button" class="btn btn-sm" @click="refresh">Refresh</button>
    </div>

    <p v-if="error" class="alert alert-warning mt-4 text-sm">Admin data unavailable (database/auth not configured).</p>

    <div class="mt-4 overflow-x-auto rounded-box border border-base-300">
      <table class="table table-sm">
        <thead>
          <tr><th>User</th><th>Role</th><th>XP</th><th>Tests</th><th>2FA</th><th>Status</th><th class="text-right">Actions</th></tr>
        </thead>
        <tbody>
          <tr v-if="pending"><td colspan="7" class="py-6 text-center opacity-50">Loading…</td></tr>
          <tr v-else-if="!data?.rows?.length"><td colspan="7" class="py-6 text-center opacity-50">No users found.</td></tr>
          <tr v-for="row in data?.rows" :key="row.id">
            <td>
              <p class="font-medium">{{ row.username || row.name }}</p>
              <p class="text-xs opacity-50">{{ row.email }}</p>
            </td>
            <td>
              <select :value="row.role" class="select select-ghost select-xs" @change="setRole(row.id, ($event.target as HTMLSelectElement).value)">
                <option value="user">user</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td class="tabular-nums">{{ row.xp ?? 0 }}</td>
            <td class="tabular-nums">{{ row.totalTests ?? 0 }}</td>
            <td>{{ row.twoFactorEnabled ? 'on' : 'off' }}</td>
            <td>
              <span v-if="row.banned" class="badge badge-error badge-sm">banned</span>
              <span v-else class="badge badge-success badge-sm">active</span>
              <span v-if="row.leaderboardBanned" class="badge badge-warning badge-sm ml-1">no board</span>
            </td>
            <td>
              <div class="flex justify-end gap-1">
                <button v-if="row.banned" type="button" class="btn btn-ghost btn-xs" @click="unban(row.id)">unban</button>
                <button v-else type="button" class="btn btn-ghost btn-xs text-error" @click="ban(row.id)">ban</button>
                <button type="button" class="btn btn-ghost btn-xs" @click="toggleLeaderboard(row.id, row.leaderboardBanned)">board</button>
                <button type="button" class="btn btn-ghost btn-xs" @click="resetStats(row.id)">reset</button>
                <button type="button" class="btn btn-ghost btn-xs text-error" @click="remove(row.id)">delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex justify-end gap-2">
      <button type="button" class="btn btn-sm" :disabled="page <= 1" @click="page--">Prev</button>
      <button type="button" class="btn btn-sm" :disabled="!data?.rows?.length" @click="page++">Next</button>
    </div>
  </div>
</template>
