<script setup lang="ts">
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-vue-next'

const route = useRoute()
const localePath = useLocalePath()

const errorCode = computed(() => (route.query.error as string) || 'authentication_failed')
const errorDesc = computed(() => (route.query.error_description as string) || '')

const readableError = computed(() => {
  switch (errorCode.value) {
    case 'state_not_found':
      return 'Session state expired or was blocked by browser security. Please try logging in again.'
    case 'invalid_code':
      return 'The authorization code was invalid or has already been used. Please try again.'
    case 'access_denied':
      return 'Sign-in request was cancelled or access was denied by the provider.'
    case 'email_not_found':
      return 'Could not retrieve an email address from your social account.'
    case 'provider_not_found':
      return 'The requested OAuth provider is not configured.'
    default:
      return errorDesc.value || 'An authentication error occurred while connecting to the provider.'
  }
})
</script>

<template>
  <AuthShell
    title="Sign In Notice"
    subtitle="There was an issue completing your authentication request."
    :hide-tabs="true"
  >
    <div class="space-y-5 text-center">
      <div class="mx-auto flex size-14 items-center justify-center rounded-2xl border border-warning/30 bg-warning/10 text-warning">
        <AlertTriangle class="size-7" />
      </div>

      <div class="space-y-2">
        <h2 class="text-base font-bold text-base-content font-mono">
          {{ errorCode.replace(/_/g, ' ').toUpperCase() }}
        </h2>
        <p class="text-xs text-base-content/70 font-sans max-w-sm mx-auto leading-relaxed">
          {{ readableError }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <NuxtLink :to="localePath('/login')" class="btn btn-primary btn-sm w-full sm:w-auto font-mono text-xs gap-2">
          <RefreshCw class="size-3.5" />
          <span>Try Again</span>
        </NuxtLink>
        <NuxtLink :to="localePath('/')" class="btn btn-ghost btn-sm w-full sm:w-auto font-mono text-xs gap-2 text-base-content/60">
          <ArrowLeft class="size-3.5" />
          <span>Back to Home</span>
        </NuxtLink>
      </div>
    </div>
  </AuthShell>
</template>
