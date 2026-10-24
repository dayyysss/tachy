<script setup lang="ts">
const config = useRuntimeConfig()
const panelBase = computed(() => config.public.adminPanelBase || '/tachos')

const email = ref('')
const password = ref('')
const pending = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const session = await $fetch<{ user?: { role?: string } }>('/api/auth/get-session')
    if (session?.user?.role === 'admin') {
      await navigateTo(`${panelBase.value}/dashboard`)
    }
  } catch {
    // not logged in
  }
})

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })

    const session = await $fetch<{ user?: { role?: string; twoFactorEnabled?: boolean } }>('/api/auth/get-session')
    const user = session?.user

    if (!user || user.role !== 'admin') {
      await $fetch('/api/auth/sign-out', { method: 'POST' }).catch(() => {})
      error.value = 'Access denied: You do not have administrator permissions.'
      return
    }

    if (config.public.adminRequire2fa && !user.twoFactorEnabled) {
      await navigateTo(`${panelBase.value}/setup`)
    } else {
      await navigateTo(`${panelBase.value}/dashboard`)
    }
  } catch (cause: unknown) {
    const status = (cause as { statusCode?: number }).statusCode
    error.value = status === 503
      ? 'Database/Auth is not configured on this environment.'
      : 'Invalid administrator email or password.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[80vh] items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm rounded-box border border-base-300 bg-base-200/50 p-6 shadow-xl backdrop-blur">
      <div class="text-center">
        <BrandLogo />
        <div class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
          <span>●</span>
          <span>Administrator Portal</span>
        </div>
        <p class="mt-2 text-xs text-base-content/50">Restricted zone. Sign in with authorized admin credentials.</p>
      </div>

      <form class="mt-6 space-y-3" @submit.prevent="submit">
        <label class="form-control">
          <span class="label-text mb-1 text-xs">Admin Email</span>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="admin@tachy.app"
            class="input input-bordered input-sm"
          >
        </label>

        <label class="form-control">
          <span class="label-text mb-1 text-xs">Password</span>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="input input-bordered input-sm"
          >
        </label>

        <p v-if="error" class="alert alert-error py-2 text-xs">{{ error }}</p>

        <button type="submit" class="btn btn-primary btn-sm w-full" :disabled="pending">
          {{ pending ? 'Authenticating…' : 'Sign in to Admin Panel' }}
        </button>
      </form>

      <div class="mt-4 border-t border-base-300 pt-3 text-center text-xs opacity-40">
        Prefix: <code class="font-mono text-primary">{{ panelBase }}</code>
      </div>
    </div>
  </div>
</template>
