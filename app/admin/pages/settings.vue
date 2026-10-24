<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface AdminSettings {
  flags: { maintenance: boolean; signups: boolean; leaderboards: boolean; dailyChallenge: boolean }
  announcement: { enabled: boolean; text: string; type: 'info' | 'warning'; expiresAt: string | null } | null
  seo: {
    siteName: string; tagline: string; titleTemplate: string; defaultDescription: string
    twitterHandle: string; ogImageFileId: string | null; defaultRobots: string
    verification: { google: string; bing: string }
  }
}

const { data, error } = await useFetch<AdminSettings>('/api/admin/settings')
const saving = ref(false)
const message = ref('')

const form = reactive<AdminSettings>({
  flags: { maintenance: false, signups: true, leaderboards: true, dailyChallenge: true },
  announcement: null,
  seo: {
    siteName: 'Tachy',
    tagline: 'Type. Measure. Improve.',
    titleTemplate: '%s · Tachy',
    defaultDescription: '',
    twitterHandle: '',
    ogImageFileId: null,
    defaultRobots: 'index,follow',
    verification: { google: '', bing: '' },
  },
})

watch(data, value => {
  if (!value) return
  Object.assign(form, value)
  if (!form.announcement) {
    form.announcement = { enabled: false, text: '', type: 'info', expiresAt: null }
  }
}, { immediate: true })

function ensureAnnouncement() {
  if (!form.announcement) form.announcement = { enabled: false, text: '', type: 'info', expiresAt: null }
}

async function save() {
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/admin/settings', { method: 'PUT', body: form })
    message.value = 'Saved.'
  } catch {
    message.value = 'Could not save. Check the database connection.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Site settings</h1>
      <span v-if="message" class="text-xs text-success">{{ message }}</span>
    </div>
    <p v-if="error" class="alert alert-warning mt-4 text-sm">Settings unavailable (database/auth not configured).</p>

    <form class="mt-6 space-y-8" @submit.prevent="save">
      <section>
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wide opacity-50">Feature flags</h2>
        <div class="grid gap-2 sm:grid-cols-2">
          <label class="label cursor-pointer justify-start gap-3"><input v-model="form.flags.maintenance" type="checkbox" class="toggle toggle-primary toggle-sm"><span>Maintenance mode</span></label>
          <label class="label cursor-pointer justify-start gap-3"><input v-model="form.flags.signups" type="checkbox" class="toggle toggle-primary toggle-sm"><span>Signups enabled</span></label>
          <label class="label cursor-pointer justify-start gap-3"><input v-model="form.flags.leaderboards" type="checkbox" class="toggle toggle-primary toggle-sm"><span>Leaderboards enabled</span></label>
          <label class="label cursor-pointer justify-start gap-3"><input v-model="form.flags.dailyChallenge" type="checkbox" class="toggle toggle-primary toggle-sm"><span>Daily challenge enabled</span></label>
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wide opacity-50">Announcement banner</h2>
        <div class="rounded-box border border-base-300 p-4" @focusin="ensureAnnouncement">
          <label v-if="form.announcement" class="label cursor-pointer justify-start gap-3">
            <input v-model="form.announcement.enabled" type="checkbox" class="toggle toggle-primary toggle-sm">
            <span>Enabled</span>
          </label>
          <template v-if="form.announcement">
            <textarea v-model="form.announcement.text" class="textarea textarea-bordered mt-2 w-full" rows="2" maxlength="280" placeholder="Message" />
            <div class="mt-2 flex flex-wrap gap-2">
              <select v-model="form.announcement.type" class="select select-bordered select-sm">
                <option value="info">info</option>
                <option value="warning">warning</option>
              </select>
              <input v-model="form.announcement.expiresAt" type="datetime-local" class="input input-bordered input-sm">
            </div>
          </template>
          <button v-else type="button" class="btn btn-ghost btn-sm" @click="ensureAnnouncement">Add announcement</button>
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wide opacity-50">SEO defaults</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control"><span class="label-text mb-1">Site name</span><input v-model="form.seo.siteName" class="input input-bordered input-sm"></label>
          <label class="form-control"><span class="label-text mb-1">Tagline</span><input v-model="form.seo.tagline" class="input input-bordered input-sm"></label>
          <label class="form-control"><span class="label-text mb-1">Title template</span><input v-model="form.seo.titleTemplate" class="input input-bordered input-sm"></label>
          <label class="form-control"><span class="label-text mb-1">Twitter handle</span><input v-model="form.seo.twitterHandle" class="input input-bordered input-sm"></label>
          <label class="form-control sm:col-span-2"><span class="label-text mb-1">Default description</span><textarea v-model="form.seo.defaultDescription" class="textarea textarea-bordered" rows="2" maxlength="200" /></label>
          <label class="form-control"><span class="label-text mb-1">Google verification</span><input v-model="form.seo.verification.google" class="input input-bordered input-sm"></label>
          <label class="form-control"><span class="label-text mb-1">Bing verification</span><input v-model="form.seo.verification.bing" class="input input-bordered input-sm"></label>
        </div>
      </section>

      <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save settings' }}</button>
    </form>
  </div>
</template>
