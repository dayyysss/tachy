<script setup lang="ts">
import {
  Search,
  LayoutDashboard,
  Activity,
  Users,
  ShieldAlert,
  FolderKanban,
  Palette,
  Sliders,
  ScrollText,
  User,
  KeyRound,
  ExternalLink,
  RefreshCw,
  X,
  ArrowRight,
  UserPlus,
  Loader2,
  Mail,
} from 'lucide-vue-next'
import { refDebounced } from '@vueuse/core'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const config = useRuntimeConfig()
const base = computed(() => config.public.adminPanelBase || '/tachos')

const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLDivElement | null>(null)

interface CommandItem {
  id: string
  label: string
  category: 'Pages' | 'Actions' | 'Users'
  icon: any
  keywords?: string[]
  to?: string
  action?: () => void | Promise<void>
  subtitle?: string
}

const staticCommands = computed<CommandItem[]>(() => [
  {
    id: 'dash',
    label: 'Dashboard Overview',
    category: 'Pages',
    icon: LayoutDashboard,
    to: `${base.value}/dashboard`,
    keywords: ['overview', 'analytics', 'home', 'stats', 'metrics', 'summary', 'beranda', 'ikhtisar'],
    subtitle: 'High-level telemetry and quick controls',
  },
  {
    id: 'monitoring',
    label: 'System & Health Monitoring',
    category: 'Pages',
    icon: Activity,
    to: `${base.value}/monitoring`,
    keywords: ['health', 'system', 'latency', 'db', 'database', 'uptime', 'ping', 'rebuild', 'cache', 'kesehatan', 'pantau'],
    subtitle: 'System latency, database health, cache maintenance',
  },
  {
    id: 'users',
    label: 'User Accounts & Roles',
    category: 'Pages',
    icon: Users,
    to: `${base.value}/users`,
    keywords: ['members', 'accounts', 'roles', 'admin', 'moderator', 'ban', 'unban', 'search', 'email', 'password', 'privileges', 'pengguna', 'akun'],
    subtitle: 'Search, create, assign roles, ban suspicious typists',
  },
  {
    id: 'moderation',
    label: 'Anti-Cheat Moderation Queue',
    category: 'Pages',
    icon: ShieldAlert,
    to: `${base.value}/moderation`,
    keywords: ['anti-cheat', 'anticheat', 'flagged', 'flags', 'review', 'tests', 'speed', 'wpm', 'suspicious', 'rejection', 'replay', 'curang', 'moderasi', 'tes'],
    subtitle: 'Review and approve quarantined speed sessions',
  },
  {
    id: 'files',
    label: 'File Storage & Assets',
    category: 'Pages',
    icon: FolderKanban,
    to: `${base.value}/files`,
    keywords: ['storage', 'uploads', 'images', 'assets', 'folders', 'documents', 'media', 'buckets', 'berkas', 'unggah'],
    subtitle: 'MIME-validated cloud storage file browser',
  },
  {
    id: 'branding',
    label: 'Branding, Logos & Icons',
    category: 'Pages',
    icon: Palette,
    to: `${base.value}/branding`,
    keywords: ['logos', 'logo', 'favicon', 'brand', 'assets', 'light', 'dark', 'icons', 'gambar', 'merek'],
    subtitle: 'Configure public logo marks and favicons',
  },
  {
    id: 'settings',
    label: 'Site Configuration & Maintenance',
    category: 'Pages',
    icon: Sliders,
    to: `${base.value}/settings`,
    keywords: ['config', 'configuration', 'maintenance', 'signups', 'announcement', 'banner', 'seo', 'meta', 'robots', 'pengaturan', 'setelan'],
    subtitle: 'Feature toggles, announcements, SEO metadata',
  },
  {
    id: 'audit',
    label: 'Audit Trail & Action Logs',
    category: 'Pages',
    icon: ScrollText,
    to: `${base.value}/audit`,
    keywords: ['logs', 'history', 'trail', 'events', 'actors', 'security', 'timeline', 'riwayat', 'catatan'],
    subtitle: 'Immutable record of administrator mutations',
  },
  {
    id: 'profile',
    label: 'Admin Profile Settings',
    category: 'Pages',
    icon: User,
    to: `${base.value}/profile`,
    keywords: ['admin', 'account', 'password', 'email', 'sign out', 'logout', 'credentials', 'profil', 'sandi'],
    subtitle: 'Change password and view active credentials',
  },
  {
    id: 'security',
    label: '2FA Two-Factor Authentication',
    category: 'Pages',
    icon: KeyRound,
    to: `${base.value}/setup`,
    keywords: ['totp', 'two factor', 'authenticator', 'security', 'backup codes', 'qr code', 'keamanan', '2fa'],
    subtitle: 'Setup or rotate TOTP authenticator key',
  },
  {
    id: 'act-new-user',
    label: 'Create New User Account',
    category: 'Actions',
    icon: UserPlus,
    to: `${base.value}/users?action=new`,
    keywords: ['create user', 'add user', 'register', 'new account', 'invite', 'tambah user', 'buat pengguna'],
    subtitle: 'Provision a new typist or moderator account',
  },
  {
    id: 'act-view-site',
    label: 'Visit Public Website',
    category: 'Actions',
    icon: ExternalLink,
    to: '/',
    keywords: ['home', 'public', 'landing', 'typing test', 'beranda'],
    subtitle: 'Open the visitor-facing typing arena',
  },
  {
    id: 'act-refresh',
    label: 'Reload Page Data',
    category: 'Actions',
    icon: RefreshCw,
    action: () => {
      window.location.reload()
    },
    keywords: ['refresh', 'reload', 'muat ulang'],
    subtitle: 'Clear local client caches and re-fetch',
  },
])

// Live search for users when query is 2+ chars
const searchedUsers = ref<CommandItem[]>([])
const isSearchingUsers = ref(false)
const debouncedQuery = refDebounced(query, 200)

watch(debouncedQuery, async (q) => {
  const needle = q.trim()
  if (needle.length < 2) {
    searchedUsers.value = []
    return
  }

  isSearchingUsers.value = true
  try {
    const res = await $fetch<{
      rows: Array<{ id: string; name: string; username?: string; email: string; role?: string }>
    }>('/api/admin/users', { query: { q: needle, page: 1 } })

    if (query.value.trim().length >= 2) {
      searchedUsers.value = (res.rows || []).slice(0, 5).map(u => ({
        id: `user-${u.id}`,
        label: u.name || u.username || u.email,
        category: 'Users',
        icon: User,
        subtitle: `${u.email} · role: ${u.role || 'user'}`,
        to: `${base.value}/users?q=${encodeURIComponent(u.username || u.email)}`,
      }))
    }
  } catch {
    searchedUsers.value = []
  } finally {
    isSearchingUsers.value = false
  }
})

const filteredStaticCommands = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return staticCommands.value
  const tokens = q.split(/\s+/).filter(Boolean)
  return staticCommands.value.filter(item => {
    const haystack = [
      item.label,
      item.category,
      item.subtitle ?? '',
      ...(item.keywords ?? []),
    ].join(' ').toLowerCase()
    return tokens.every(token => haystack.includes(token))
  })
})

const allResults = computed<CommandItem[]>(() => {
  return [...filteredStaticCommands.value, ...searchedUsers.value]
})

watch(() => props.modelValue, (open) => {
  if (open) {
    query.value = ''
    searchedUsers.value = []
    selectedIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
    setTimeout(() => {
      inputRef.value?.focus()
    }, 50)
    setTimeout(() => {
      inputRef.value?.focus()
    }, 150)
  }
})

watch(allResults, () => {
  if (selectedIndex.value >= allResults.value.length) {
    selectedIndex.value = 0
  }
})

function close() {
  emit('update:modelValue', false)
}

async function execute(item?: CommandItem) {
  const target = item || allResults.value[selectedIndex.value]
  if (!target) return
  close()
  if (target.action) {
    await target.action()
  } else if (target.to) {
    await navigateTo(target.to)
  }
}

function selectNext() {
  if (!allResults.value.length) return
  selectedIndex.value = (selectedIndex.value + 1) % allResults.value.length
  scrollToActive()
}

function selectPrev() {
  if (!allResults.value.length) return
  selectedIndex.value = (selectedIndex.value - 1 + allResults.value.length) % allResults.value.length
  scrollToActive()
}

function scrollToActive() {
  nextTick(() => {
    const el = listRef.value?.querySelector(`[data-index="${selectedIndex.value}"]`) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  })
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/70 backdrop-blur-xs"
        @click.self="close"
      >
        <div class="modal-panel relative w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 p-0 shadow-2xl overflow-hidden font-sans">
          <!-- Search Input Header -->
          <div class="flex items-center gap-3 border-b border-base-300 px-4 py-3 bg-base-200/50">
            <Search class="size-4 shrink-0 text-base-content/40" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              autofocus
              placeholder="Search admin pages, users, tools, actions..."
              class="w-full bg-transparent text-sm placeholder:text-base-content/40 focus:outline-none font-mono text-base-content"
              @keydown.down.prevent="selectNext"
              @keydown.up.prevent="selectPrev"
              @keydown.enter.prevent="execute()"
              @keydown.esc.prevent="close"
            >
            <Loader2 v-if="isSearchingUsers" class="size-3.5 shrink-0 animate-spin text-primary" />
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
              title="Close search"
              @click="close"
            >
              <X class="size-3.5" />
            </button>
          </div>

          <!-- Command & Users List -->
          <div ref="listRef" class="max-h-80 overflow-y-auto p-2 space-y-1">
            <div
              v-if="!allResults.length"
              class="py-10 text-center text-xs text-base-content/40 font-mono"
            >
              No matching pages, actions, or users found.
            </div>

            <div v-for="(item, idx) in allResults" :key="item.id">
              <!-- Category Header Separator -->
              <div
                v-if="idx === 0 || allResults[idx - 1]?.category !== item.category"
                class="px-2.5 pt-2 pb-1 text-[10px] font-bold font-mono uppercase text-base-content/40 tracking-wider flex items-center justify-between"
              >
                <span>{{ item.category }}</span>
                <span v-if="item.category === 'Users' && isSearchingUsers" class="text-primary text-[9px] font-normal lowercase">searching...</span>
              </div>

              <!-- Result Button Item -->
              <button
                type="button"
                :data-index="idx"
                class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs text-left transition-colors font-medium"
                :class="idx === selectedIndex
                  ? 'bg-primary text-primary-content shadow-xs'
                  : 'text-base-content/80 hover:bg-base-200'"
                @mouseenter="selectedIndex = idx"
                @click="execute(item)"
              >
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                  <component
                    :is="item.icon"
                    class="size-4 shrink-0"
                    :class="idx === selectedIndex ? 'text-primary-content' : (item.category === 'Users' ? 'text-secondary' : 'text-primary')"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold">{{ item.label }}</p>
                    <p
                      v-if="item.subtitle"
                      class="truncate text-[10px] font-mono leading-tight"
                      :class="idx === selectedIndex ? 'text-primary-content/80' : 'text-base-content/50'"
                    >
                      {{ item.subtitle }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0 ml-2">
                  <span
                    class="badge badge-xs font-mono uppercase"
                    :class="idx === selectedIndex ? 'bg-primary-content/20 text-primary-content' : 'badge-ghost text-base-content/40'"
                  >
                    {{ item.category }}
                  </span>
                  <ArrowRight
                    class="size-3 transition-transform"
                    :class="idx === selectedIndex ? 'translate-x-0.5 opacity-100' : 'opacity-0'"
                  />
                </div>
              </button>
            </div>
          </div>

          <!-- Footer Hints -->
          <div class="flex items-center justify-between border-t border-base-300 px-4 py-2 bg-base-200/40 text-[10px] text-base-content/40 font-mono">
            <div class="flex items-center gap-3">
              <span><kbd class="kbd kbd-xs">↑↓</kbd> Navigate</span>
              <span><kbd class="kbd kbd-xs">↵</kbd> Open</span>
              <span><kbd class="kbd kbd-xs">ESC</kbd> Close</span>
            </div>
            <span>Admin Console Search</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
