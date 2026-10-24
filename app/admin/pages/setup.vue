<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const password = ref('')
const error = ref('')
const pending = ref(false)
const totpURI = ref('')
const backupCodes = ref<string[]>([])
const code = ref('')
const verified = ref(false)
const secret = computed(() => { try { return new URL(totpURI.value).searchParams.get('secret') ?? '' } catch { return '' } })
const route = useRoute()
const base = computed(() => `/${route.path.split('/').filter(Boolean)[0] ?? ''}`)

async function enable() {
  pending.value = true
  error.value = ''
  try {
    const result = await $fetch<{ totpURI?: string; backupCodes?: string[] }>('/api/auth/two-factor/enable', {
      method: 'POST',
      body: { password: password.value },
    })
    totpURI.value = result.totpURI ?? ''
    backupCodes.value = result.backupCodes ?? []
  } catch {
    error.value = 'Could not enable 2FA. Check your password and that auth is configured.'
  } finally {
    pending.value = false
  }
}

async function verify() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/two-factor/verify-totp', { method: 'POST', body: { code: code.value } })
    verified.value = true
  } catch {
    error.value = 'Invalid code. Try the current 6-digit code.'
  } finally {
    pending.value = false
  }
}

function finish() {
  navigateTo(`${base.value}/dashboard`)
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <h1 class="text-xl font-semibold">Enable two-factor authentication</h1>
    <p class="mt-1 text-sm opacity-60">
      Admin access requires TOTP. Add the secret below to an authenticator app, then save the backup codes.
    </p>

    <form v-if="!totpURI" class="mt-6 space-y-3" @submit.prevent="enable">
      <label class="form-control">
        <span class="label-text mb-1">Account password</span>
        <input v-model="password" type="password" required class="input input-bordered" autocomplete="current-password">
      </label>
      <p v-if="error" class="alert alert-warning py-2 text-xs">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="pending">{{ pending ? 'Enabling…' : 'Enable 2FA' }}</button>
    </form>

    <div v-else class="mt-6 space-y-4">
      <div class="rounded-box border border-base-300 p-4">
        <p class="text-xs uppercase tracking-wide opacity-50">Authenticator URI</p>
        <code class="mt-2 block break-all text-xs">{{ totpURI }}</code>
        <p v-if="secret" class="mt-3 text-xs uppercase tracking-wide opacity-50">Manual secret</p>
        <code v-if="secret" class="mt-1 block break-all font-mono text-sm text-primary">{{ secret }}</code>
      </div>
      <div v-if="backupCodes.length" class="rounded-box border border-warning/40 bg-warning/5 p-4">
        <p class="text-xs uppercase tracking-wide opacity-50">Backup codes (save these now)</p>
        <div class="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
          <span v-for="backup in backupCodes" :key="backup">{{ backup }}</span>
        </div>
      </div>
      <form v-if="!verified" class="space-y-2" @submit.prevent="verify">
        <label class="form-control">
          <span class="label-text mb-1">6-digit code</span>
          <input v-model="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required class="input input-bordered">
        </label>
        <p v-if="error" class="alert alert-warning py-2 text-xs">{{ error }}</p>
        <button type="submit" class="btn btn-primary" :disabled="pending">{{ pending ? 'Verifying…' : 'Verify & continue' }}</button>
      </form>
      <button v-else type="button" class="btn btn-primary" @click="finish">I saved it — continue</button>
    </div>
  </div>
</template>
