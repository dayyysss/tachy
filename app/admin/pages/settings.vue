<script setup lang="ts">
import {
  Sliders,
  Megaphone,
  Globe,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-vue-next'

definePageMeta({ middleware: 'admin' })

interface AdminSettings {
  flags: { maintenance: boolean; signups: boolean; leaderboards: boolean; dailyChallenge: boolean }
  announcement: { enabled: boolean; text: string; type: 'info' | 'warning'; expiresAt: string | null } | null
  seo: {
    siteName: string
    tagline: string
    titleTemplate: string
    defaultDescription: string
    twitterHandle: string
    ogImageFileId: string | null
    defaultRobots: string
    verification: { google: string; bing: string }
  }
}

const { data, error } = await useFetch<AdminSettings>('/api/admin/settings')
const saving = ref(false)
const toast = useToast()

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

function toDatetimeLocal(isoString?: string | null): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

watch(data, value => {
  if (!value) return
  Object.assign(form, value)
  if (!form.announcement) {
    form.announcement = { enabled: false, text: '', type: 'info', expiresAt: null }
  } else if (form.announcement.expiresAt) {
    form.announcement.expiresAt = toDatetimeLocal(form.announcement.expiresAt)
  }
}, { immediate: true })

function ensureAnnouncement() {
  if (!form.announcement) form.announcement = { enabled: false, text: '', type: 'info', expiresAt: null }
}

function clearExpiresAt() {
  if (form.announcement) {
    form.announcement.expiresAt = null
  }
}

async function save() {
  saving.value = true
  try {
    const payload = JSON.parse(JSON.stringify(form))
    if (payload.announcement) {
      payload.announcement.expiresAt = payload.announcement.expiresAt?.trim()
        ? new Date(payload.announcement.expiresAt).toISOString()
        : null
    }
    await $fetch('/api/admin/settings', { method: 'PUT', body: payload })
    toast.success('Settings saved successfully.')
  } catch {
    toast.error('Could not save settings. Check database connection.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Standard Header -->
    <AdminPageHeader
      title="Global Site Configuration"
      subtitle="Control platform operational switches, visitor announcements, and search engine SEO metadata discovery."
      category="PLATFORM CONFIGURATION"
    >
      <template #actions>
        <button
          type="submit"
          form="settings-form"
          class="btn btn-primary btn-sm gap-1.5 shadow-xs font-semibold"
          :disabled="saving"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          <Save v-else class="size-4" />
          <span>{{ saving ? 'Saving…' : 'Save Changes' }}</span>
        </button>
      </template>
    </AdminPageHeader>

    <p v-if="error" class="alert alert-warning text-xs font-mono">
      Settings unavailable (database connection or authentication error).
    </p>

    <form id="settings-form" class="space-y-6" @submit.prevent="save">
      <!-- SECTION 1: Platform Feature Flags -->
      <section class="rounded-2xl border border-base-300 bg-base-200/40 p-5 md:p-6 shadow-xs space-y-4">
        <div class="border-b border-base-300/80 pb-3">
          <div class="flex items-center gap-2">
            <Sliders class="size-4 text-primary" />
            <h2 class="text-sm font-bold text-base-content">Platform Feature Flags</h2>
          </div>
          <p class="text-xs text-base-content/50 mt-0.5">
            Instantly toggle core site capabilities across visitor sessions and API routes.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <!-- Maintenance Mode -->
          <label class="group flex items-center justify-between gap-3 rounded-xl border border-base-300/80 bg-base-100/80 p-3.5 hover:border-primary/50 hover:bg-base-100 cursor-pointer transition-all shadow-xs">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-base-content group-hover:text-primary transition-colors">Maintenance Mode</span>
                <span v-if="form.flags.maintenance" class="badge badge-error badge-xs font-mono">ON</span>
              </div>
              <p class="text-[11px] text-base-content/50 mt-0.5 leading-tight">
                Blocks public test submissions and queues with HTTP 503 status
              </p>
            </div>
            <input v-model="form.flags.maintenance" type="checkbox" class="toggle toggle-error toggle-sm shrink-0">
          </label>

          <!-- New Signups -->
          <label class="group flex items-center justify-between gap-3 rounded-xl border border-base-300/80 bg-base-100/80 p-3.5 hover:border-primary/50 hover:bg-base-100 cursor-pointer transition-all shadow-xs">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-base-content group-hover:text-primary transition-colors">New User Registrations</span>
                <span v-if="!form.flags.signups" class="badge badge-warning badge-xs font-mono">PAUSED</span>
              </div>
              <p class="text-[11px] text-base-content/50 mt-0.5 leading-tight">
                Permits new visitor account creation via email or OAuth
              </p>
            </div>
            <input v-model="form.flags.signups" type="checkbox" class="toggle toggle-primary toggle-sm shrink-0">
          </label>

          <!-- Public Leaderboards -->
          <label class="group flex items-center justify-between gap-3 rounded-xl border border-base-300/80 bg-base-100/80 p-3.5 hover:border-primary/50 hover:bg-base-100 cursor-pointer transition-all shadow-xs">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-base-content group-hover:text-primary transition-colors">Competitive Leaderboards</span>
                <span v-if="!form.flags.leaderboards" class="badge badge-ghost badge-xs font-mono">OFF</span>
              </div>
              <p class="text-[11px] text-base-content/50 mt-0.5 leading-tight">
                Serves global speed ranking leaderboards and seasonal ladders
              </p>
            </div>
            <input v-model="form.flags.leaderboards" type="checkbox" class="toggle toggle-primary toggle-sm shrink-0">
          </label>

          <!-- Daily Challenge -->
          <label class="group flex items-center justify-between gap-3 rounded-xl border border-base-300/80 bg-base-100/80 p-3.5 hover:border-primary/50 hover:bg-base-100 cursor-pointer transition-all shadow-xs">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-base-content group-hover:text-primary transition-colors">Daily Challenge Arena</span>
                <span v-if="!form.flags.dailyChallenge" class="badge badge-ghost badge-xs font-mono">OFF</span>
              </div>
              <p class="text-[11px] text-base-content/50 mt-0.5 leading-tight">
                Activates deterministic daily seed challenge for bonus XP
              </p>
            </div>
            <input v-model="form.flags.dailyChallenge" type="checkbox" class="toggle toggle-primary toggle-sm shrink-0">
          </label>
        </div>
      </section>

      <!-- SECTION 2: Announcement Banner -->
      <section class="rounded-2xl border border-base-300 bg-base-200/40 p-5 md:p-6 shadow-xs space-y-4" @focusin="ensureAnnouncement">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/80 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <Megaphone class="size-4 text-primary" />
              <h2 class="text-sm font-bold text-base-content">Site-Wide Announcement Banner</h2>
            </div>
            <p class="text-xs text-base-content/50 mt-0.5">
              Broadcast high-visibility notification bar to all visitors at top of site.
            </p>
          </div>

          <label v-if="form.announcement" class="flex items-center gap-2.5 cursor-pointer rounded-xl bg-base-100/80 px-3 py-1.5 border border-base-300/60 hover:border-primary/50 transition-colors">
            <span class="text-xs font-mono font-medium text-base-content/80">Broadcast Status:</span>
            <span
              class="badge badge-xs font-mono uppercase font-bold"
              :class="form.announcement.enabled ? 'badge-success' : 'badge-ghost text-base-content/40'"
            >
              {{ form.announcement.enabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
            <input v-model="form.announcement.enabled" type="checkbox" class="toggle toggle-primary toggle-xs ml-1">
          </label>
        </div>

        <div v-if="form.announcement" class="space-y-4">
          <!-- Textarea Message -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="announcement-text" class="text-xs font-bold text-base-content/80">Banner Text</label>
              <span class="text-[10px] font-mono text-base-content/50">
                {{ form.announcement.text?.length || 0 }} / 280 characters
              </span>
            </div>
            <textarea
              id="announcement-text"
              v-model="form.announcement.text"
              rows="2"
              maxlength="280"
              placeholder="e.g. Scheduled maintenance on Sunday 02:00 UTC. Test records will be saved."
              class="textarea textarea-bordered w-full text-xs font-sans bg-base-100 focus:border-primary"
            />
          </div>

          <!-- Controls: Severity & Expiration -->
          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Style / Severity -->
            <div class="space-y-1.5">
              <label for="announcement-type" class="text-xs font-bold text-base-content/80">Notice Type & Severity</label>
              <select
                id="announcement-type"
                v-model="form.announcement.type"
                class="select select-bordered select-sm w-full text-xs bg-base-100 font-sans"
              >
                <option value="info">Info Notice (Standard Neutral / Accent)</option>
                <option value="warning">Warning Notice (High-Visibility Alert)</option>
              </select>
            </div>

            <!-- Expiration Date Picker -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="announcement-expires" class="text-xs font-bold text-base-content/80 flex items-center gap-1.5">
                  <Clock class="size-3 text-base-content/40" />
                  <span>Auto-Expire At (Optional)</span>
                </label>
                <button
                  v-if="form.announcement.expiresAt"
                  type="button"
                  class="text-[10px] font-mono text-error hover:underline flex items-center gap-0.5"
                  @click="clearExpiresAt"
                >
                  <X class="size-2.5" />
                  <span>Clear expiry</span>
                </button>
              </div>
              <input
                id="announcement-expires"
                v-model="form.announcement.expiresAt"
                type="datetime-local"
                class="input input-bordered input-sm w-full text-xs font-mono bg-base-100"
              >
            </div>
          </div>

          <!-- Live Preview Box -->
          <div class="rounded-xl border border-base-300/80 bg-base-100/60 p-3.5 space-y-2">
            <div class="flex items-center justify-between text-[11px] font-mono text-base-content/50 uppercase tracking-wider">
              <span>Visitor Preview</span>
              <span class="text-[10px] font-normal normal-case opacity-75">Renders as fixed top bar</span>
            </div>

            <div
              class="flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-medium transition-colors"
              :class="form.announcement.type === 'warning'
                ? 'bg-primary text-primary-content font-semibold'
                : 'bg-base-200 border border-base-300 text-base-content'"
            >
              <div class="flex items-center gap-2 min-w-0">
                <AlertTriangle v-if="form.announcement.type === 'warning'" class="size-3.5 shrink-0" />
                <Info v-else class="size-3.5 shrink-0 opacity-70" />
                <span class="truncate">{{ form.announcement.text || 'Type your message above to see preview here…' }}</span>
              </div>
              <span class="text-[10px] underline opacity-75 ml-2 shrink-0">Dismiss</span>
            </div>
          </div>
        </div>

        <button
          v-else
          type="button"
          class="btn btn-outline btn-xs gap-1.5 font-mono"
          @click="ensureAnnouncement"
        >
          <span>+ Setup Announcement</span>
        </button>
      </section>

      <!-- SECTION 3: SEO & Discovery Defaults -->
      <section class="rounded-2xl border border-base-300 bg-base-200/40 p-5 md:p-6 shadow-xs space-y-5">
        <div class="border-b border-base-300/80 pb-3">
          <div class="flex items-center gap-2">
            <Globe class="size-4 text-primary" />
            <h2 class="text-sm font-bold text-base-content">SEO & Discovery Defaults</h2>
          </div>
          <p class="text-xs text-base-content/50 mt-0.5">
            Metadata, social card framing, and search console verification tokens applied site-wide.
          </p>
        </div>

        <!-- Core Meta Inputs Grid -->
        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Site Name -->
          <div class="space-y-1.5">
            <label for="seo-sitename" class="text-xs font-bold text-base-content/80">Site Name</label>
            <input
              id="seo-sitename"
              v-model="form.seo.siteName"
              type="text"
              required
              class="input input-bordered input-sm w-full text-xs font-sans bg-base-100"
              placeholder="Tachy"
            >
            <p class="text-[10px] text-base-content/40 font-mono">Brand name shown across navigation and meta tags</p>
          </div>

          <!-- Tagline -->
          <div class="space-y-1.5">
            <label for="seo-tagline" class="text-xs font-bold text-base-content/80">Tagline</label>
            <input
              id="seo-tagline"
              v-model="form.seo.tagline"
              type="text"
              class="input input-bordered input-sm w-full text-xs font-sans bg-base-100"
              placeholder="Type. Measure. Improve."
            >
            <p class="text-[10px] text-base-content/40 font-mono">Catchphrase displayed in social cards and descriptions</p>
          </div>

          <!-- Title Template -->
          <div class="space-y-1.5">
            <label for="seo-titletemplate" class="text-xs font-bold text-base-content/80">Title Template</label>
            <input
              id="seo-titletemplate"
              v-model="form.seo.titleTemplate"
              type="text"
              required
              class="input input-bordered input-sm w-full text-xs font-mono bg-base-100"
              placeholder="%s · Tachy"
            >
            <p class="text-[10px] text-base-content/40 font-mono"><code class="text-primary">%s</code> is replaced by the individual page title</p>
          </div>

          <!-- Twitter Handle -->
          <div class="space-y-1.5">
            <label for="seo-twitter" class="text-xs font-bold text-base-content/80">Twitter / X Handle</label>
            <input
              id="seo-twitter"
              v-model="form.seo.twitterHandle"
              type="text"
              class="input input-bordered input-sm w-full text-xs font-mono bg-base-100"
              placeholder="@tachyapp"
            >
            <p class="text-[10px] text-base-content/40 font-mono">Author tag for Twitter summary card cards</p>
          </div>

          <!-- Default Robots Directive -->
          <div class="space-y-1.5 sm:col-span-2">
            <label for="seo-robots" class="text-xs font-bold text-base-content/80">Default Robots Directive</label>
            <input
              id="seo-robots"
              v-model="form.seo.defaultRobots"
              type="text"
              class="input input-bordered input-sm w-full text-xs font-mono bg-base-100"
              placeholder="index,follow"
            >
            <p class="text-[10px] text-base-content/40 font-mono">Robots instruction for search crawlers (e.g. <code class="text-primary">index,follow</code>)</p>
          </div>

          <!-- Default Meta Description -->
          <div class="space-y-1.5 sm:col-span-2">
            <div class="flex items-center justify-between">
              <label for="seo-description" class="text-xs font-bold text-base-content/80">Default Meta Description</label>
              <span class="text-[10px] font-mono text-base-content/50">
                {{ form.seo.defaultDescription?.length || 0 }} / 200 characters
              </span>
            </div>
            <textarea
              id="seo-description"
              v-model="form.seo.defaultDescription"
              rows="3"
              maxlength="200"
              placeholder="Free typing test with progress tracking, custom text, and competitive global leaderboards."
              class="textarea textarea-bordered w-full text-xs font-sans bg-base-100"
            />
            <p class="text-[10px] text-base-content/40 font-mono">Fallback summary indexed by search engines when page has no specific description</p>
          </div>
        </div>

        <!-- Webmaster Verification Subsection Card -->
        <div class="rounded-xl border border-base-300/80 bg-base-100/60 p-4 space-y-3.5">
          <div class="flex items-center gap-2">
            <ShieldCheck class="size-3.5 text-primary" />
            <h3 class="text-xs font-bold text-base-content">Search Engine Verification Tokens</h3>
          </div>
          <p class="text-[11px] text-base-content/50 leading-normal">
            Domain ownership meta tags injected into the HTML <code class="text-xs font-mono text-primary">&lt;head&gt;</code> for indexing consoles.
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <!-- Google Verification -->
            <div class="space-y-1.5">
              <label for="seo-google" class="text-xs font-medium text-base-content/80">Google Search Console</label>
              <input
                id="seo-google"
                v-model="form.seo.verification.google"
                type="text"
                class="input input-bordered input-sm w-full text-xs font-mono bg-base-100"
                placeholder="google-site-verification=abc..."
              >
            </div>

            <!-- Bing Verification -->
            <div class="space-y-1.5">
              <label for="seo-bing" class="text-xs font-medium text-base-content/80">Bing Webmaster Tools</label>
              <input
                id="seo-bing"
                v-model="form.seo.verification.bing"
                type="text"
                class="input input-bordered input-sm w-full text-xs font-mono bg-base-100"
                placeholder="msvalidate.01 token..."
              >
            </div>
          </div>
        </div>
      </section>

      <!-- Bottom Sticky Action Bar -->
      <div class="flex items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-200/50 p-4 shadow-xs">
        <p class="text-xs font-mono text-base-content/50">
          Changes take effect immediately across all visitors and APIs.
        </p>

        <button
          type="submit"
          class="btn btn-primary btn-sm gap-1.5 shadow-xs font-mono text-xs"
          :disabled="saving"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          <Save v-else class="size-3.5" />
          <span>{{ saving ? 'Saving…' : 'Save Changes' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
