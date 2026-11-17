<script setup lang="ts">
import {
  User,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Lock,
  LogOut,
  Mail,
  Shield,
} from 'lucide-vue-next'

definePageMeta({ middleware: 'admin' })

const config = useRuntimeConfig()
const toast = useToast()
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

async function changePassword() {
  if (newPassword.value !== confirmPassword.value) {
    toast.error('Passwords do not match.')
    return
  }
  pending.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
    })
    toast.success('Password changed successfully.')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch {
    toast.error('Could not change password. Check your current password.')
  } finally {
    pending.value = false
  }
}

async function signOut() {
  try {
    await $fetch('/api/auth/sign-out', { method: 'POST', body: {} })
  } finally {
    await navigateTo(config.public.adminLoginPath || '/tachyPanel')
  }
}
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Standard Header -->
    <AdminPageHeader
      title="Admin Profile & Security"
      subtitle="Manage administrator console credentials, active session tokens, and multi-factor authentication."
      category="SECURITY PROFILE"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-error btn-outline btn-sm gap-1.5 font-semibold text-xs"
          @click="signOut"
        >
          <LogOut class="size-3.5" />
          <span>Sign Out</span>
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- Account Info Card -->
      <section class="rounded-2xl border border-base-300 bg-base-200/40 p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div class="flex items-center gap-2.5 pb-4 border-b border-base-300">
            <div class="size-10 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center font-mono">
              {{ (sessionData?.user?.username || sessionData?.user?.name || 'A').charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-sm font-bold text-base-content">
                {{ sessionData?.user?.username || sessionData?.user?.name || 'Administrator' }}
              </h2>
              <p class="text-[11px] font-mono text-base-content/50">{{ sessionData?.user?.email }}</p>
            </div>
          </div>

          <dl class="mt-4 space-y-3 text-xs font-mono">
            <div class="flex items-center justify-between border-b border-base-300/60 pb-2.5">
              <dt class="flex items-center gap-1.5 text-base-content/50">
                <Mail class="size-3" />
                <span>Email Address</span>
              </dt>
              <dd class="font-medium text-base-content">{{ sessionData?.user?.email }}</dd>
            </div>

            <div class="flex items-center justify-between border-b border-base-300/60 pb-2.5">
              <dt class="flex items-center gap-1.5 text-base-content/50">
                <Shield class="size-3" />
                <span>Privilege Role</span>
              </dt>
              <dd>
                <span class="badge badge-primary badge-xs uppercase font-bold">
                  {{ sessionData?.user?.role || 'admin' }}
                </span>
              </dd>
            </div>

            <div class="flex items-center justify-between border-b border-base-300/60 pb-2.5">
              <dt class="flex items-center gap-1.5 text-base-content/50">
                <KeyRound class="size-3" />
                <span>Two-Factor (TOTP)</span>
              </dt>
              <dd>
                <span
                  class="badge badge-xs font-mono uppercase font-semibold"
                  :class="sessionData?.user?.twoFactorEnabled ? 'badge-success' : 'badge-warning'"
                >
                  {{ sessionData?.user?.twoFactorEnabled ? 'Active' : 'Unconfigured' }}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div class="mt-6 pt-4 border-t border-base-300/60 flex items-center justify-between">
          <NuxtLink
            :to="`${panelBase}/setup`"
            class="btn btn-primary btn-sm gap-1.5 font-mono text-xs shadow-xs"
          >
            <KeyRound class="size-3.5" />
            <span>{{ sessionData?.user?.twoFactorEnabled ? 'Manage 2FA Settings' : 'Configure 2FA Now' }}</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Password Change Card -->
      <section class="rounded-2xl border border-base-300 bg-base-200/40 p-6 shadow-xs">
        <div class="flex items-center gap-2 pb-4 border-b border-base-300">
          <Lock class="size-4 text-primary" />
          <h2 class="text-sm font-bold text-base-content">Change Password</h2>
        </div>

        <form class="mt-4 space-y-3.5" @submit.prevent="changePassword">
          <div class="space-y-1">
            <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">
              Current Password
            </label>
            <input
              v-model="currentPassword"
              type="password"
              required
              class="input input-bordered input-sm w-full font-mono text-xs"
              placeholder="••••••••"
            >
          </div>

          <div class="space-y-1">
            <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">
              New Password (min 8 chars)
            </label>
            <input
              v-model="newPassword"
              type="password"
              required
              minlength="8"
              class="input input-bordered input-sm w-full font-mono text-xs"
              placeholder="••••••••"
            >
          </div>

          <div class="space-y-1">
            <label class="block font-mono text-[11px] uppercase tracking-wider text-base-content/70">
              Confirm New Password
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              class="input input-bordered input-sm w-full font-mono text-xs"
              placeholder="••••••••"
            >
          </div>

          <div class="pt-2 flex justify-end">
            <button
              type="submit"
              class="btn btn-primary btn-sm gap-1.5 font-mono text-xs shadow-xs"
              :disabled="pending"
            >
              <span v-if="pending" class="loading loading-spinner loading-xs" />
              <span>{{ pending ? 'Updating...' : 'Save Password' }}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
