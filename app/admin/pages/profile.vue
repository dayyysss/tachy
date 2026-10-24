<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const config = useRuntimeConfig()
const panelBase = computed(() => config.public.adminPanelBase || '/tachos')

const { data: sessionData, refresh } = await useFetch<{
  user?: {
    id: string
    name: string
    email: string
    username?: string
    role?: string
    twoFactorEnabled?: boolean
  }
}>('/api/auth/get-session')

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pending = ref(false)
const message = ref('')
const error = ref('')

async function changePassword() {
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  pending.value = true
  message.value = ''
  error.value = ''
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
    })
    message.value = 'Password changed successfully.'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch {
    error.value = 'Could not change password. Check your current password.'
  } finally {
    pending.value = false
  }
}

async function signOut() {
  try {
    await $fetch('/api/auth/sign-out', { method: 'POST' })
  } finally {
    await navigateTo(config.public.adminLoginPath || '/tachyPanel')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Admin Profile</h1>
        <p class="text-xs opacity-50">Manage your administrative credentials and security settings.</p>
      </div>
      <button type="button" class="btn btn-error btn-sm btn-outline" @click="signOut">Sign out</button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <!-- Account Info -->
      <div class="rounded-box border border-base-300 bg-base-200/40 p-5">
        <h2 class="text-sm font-medium uppercase tracking-wide opacity-50">Account Details</h2>
        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between border-b border-base-300 pb-2">
            <dt class="opacity-50">Email</dt>
            <dd class="font-mono font-medium">{{ sessionData?.user?.email }}</dd>
          </div>
          <div class="flex justify-between border-b border-base-300 pb-2">
            <dt class="opacity-50">Username</dt>
            <dd class="font-medium">{{ sessionData?.user?.username || sessionData?.user?.name }}</dd>
          </div>
          <div class="flex justify-between border-b border-base-300 pb-2">
            <dt class="opacity-50">Role</dt>
            <dd><span class="badge badge-primary badge-sm uppercase">{{ sessionData?.user?.role || 'admin' }}</span></dd>
          </div>
          <div class="flex items-center justify-between pt-1">
            <dt class="opacity-50">2FA TOTP</dt>
            <dd>
              <span
                class="badge badge-sm"
                :class="sessionData?.user?.twoFactorEnabled ? 'badge-success' : 'badge-warning'"
              >
                {{ sessionData?.user?.twoFactorEnabled ? 'Active' : 'Not configured' }}
              </span>
            </dd>
          </div>
        </dl>
        <div class="mt-4 pt-2">
          <NuxtLink :to="`${panelBase}/setup`" class="btn btn-ghost btn-xs">
            {{ sessionData?.user?.twoFactorEnabled ? 'Re-configure 2FA' : 'Setup 2FA now' }} →
          </NuxtLink>
        </div>
      </div>

      <!-- Password Change -->
      <div class="rounded-box border border-base-300 bg-base-200/40 p-5">
        <h2 class="text-sm font-medium uppercase tracking-wide opacity-50">Update Password</h2>
        <form class="mt-4 space-y-3" @submit.prevent="changePassword">
          <label class="form-control">
            <span class="label-text mb-1 text-xs">Current Password</span>
            <input v-model="currentPassword" type="password" required class="input input-bordered input-sm">
          </label>
          <label class="form-control">
            <span class="label-text mb-1 text-xs">New Password</span>
            <input v-model="newPassword" type="password" required minlength="8" class="input input-bordered input-sm">
          </label>
          <label class="form-control">
            <span class="label-text mb-1 text-xs">Confirm New Password</span>
            <input v-model="confirmPassword" type="password" required minlength="8" class="input input-bordered input-sm">
          </label>

          <p v-if="message" class="alert alert-success py-1.5 text-xs">{{ message }}</p>
          <p v-if="error" class="alert alert-error py-1.5 text-xs">{{ error }}</p>

          <button type="submit" class="btn btn-primary btn-sm" :disabled="pending">
            {{ pending ? 'Updating…' : 'Update Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
