<script setup lang="ts">
import {
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
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Search,
  Bell,
  ExternalLink,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-vue-next'

const route = useRoute()
const config = useRuntimeConfig()
const base = computed(() => config.public.adminPanelBase || '/tachos')

// Sidebar states
const isCollapsed = useLocalStorage('admin_sidebar_collapsed', false)
const mobileOpen = ref(false)
const commandPaletteOpen = ref(false)

// Notifications state
const notificationsRead = useLocalStorage<string[]>('admin_notifications_read', [])

const headers = useRequestHeaders(['cookie'])
const { data: sessionData } = await useFetch<{
  user?: {
    id: string
    name: string
    email: string
    username?: string
    role?: string
    twoFactorEnabled?: boolean
  }
}>('/api/auth/get-session', { headers })

// Fetch overview data for notification badges
const { data: overviewData } = await useFetch<{
  flagged?: number
  users?: number
  testsToday?: number
}>('/api/admin/overview')

interface NavItem {
  to: string
  label: string
  icon: any
  badge?: string
  badgeVariant?: 'success' | 'warning' | 'error' | 'ghost'
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections = computed<NavSection[]>(() => [
  {
    title: 'Overview',
    items: [
      {
        to: `${base.value}/dashboard`,
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      {
        to: `${base.value}/monitoring`,
        label: 'Monitoring',
        icon: Activity,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        to: `${base.value}/users`,
        label: 'Users',
        icon: Users,
      },
      {
        to: `${base.value}/moderation`,
        label: 'Moderation',
        icon: ShieldAlert,
        badge: (overviewData.value?.flagged ?? 0) > 0 ? String(overviewData.value?.flagged) : undefined,
        badgeVariant: 'warning',
      },
      {
        to: `${base.value}/files`,
        label: 'File Storage',
        icon: FolderKanban,
      },
    ],
  },
  {
    title: 'Configuration',
    items: [
      {
        to: `${base.value}/branding`,
        label: 'Branding & Assets',
        icon: Palette,
      },
      {
        to: `${base.value}/settings`,
        label: 'Site Settings',
        icon: Sliders,
      },
      {
        to: `${base.value}/audit`,
        label: 'Audit Trail',
        icon: ScrollText,
      },
    ],
  },
  {
    title: 'Security',
    items: [
      {
        to: `${base.value}/profile`,
        label: 'Admin Profile',
        icon: User,
      },
      {
        to: `${base.value}/setup`,
        label: '2FA Security',
        icon: KeyRound,
        badge: sessionData.value?.user?.twoFactorEnabled ? '2FA ON' : (config.public.adminRequire2fa ? 'Required' : 'Optional'),
        badgeVariant: sessionData.value?.user?.twoFactorEnabled ? 'success' : 'warning',
      },
    ],
  },
])

const currentPage = computed(() => {
  for (const sec of navSections.value) {
    const item = sec.items.find(i => route.path === i.to || (i.to.endsWith('/dashboard') && route.path === base.value))
    if (item) return item
  }
  return { label: 'Dashboard', icon: LayoutDashboard }
})

function isActive(to: string) {
  if (to.endsWith('/dashboard')) {
    return route.path === to || route.path === base.value || route.path === `${base.value}/`
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}

// Notifications list
interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  type: 'warning' | 'success' | 'info'
  to?: string
}

const notifications = computed<NotificationItem[]>(() => {
  const list: NotificationItem[] = []
  if ((overviewData.value?.flagged ?? 0) > 0) {
    list.push({
      id: `flagged-${overviewData.value?.flagged}`,
      title: 'Anti-Cheat Queue Review',
      message: `${overviewData.value?.flagged} typing test session(s) require moderation verification.`,
      time: 'Live',
      type: 'warning',
      to: `${base.value}/moderation`,
    })
  }
  if (!sessionData.value?.user?.twoFactorEnabled) {
    list.push({
      id: '2fa-warn',
      title: 'Security Recommendation',
      message: 'Enable Two-Factor Authentication (TOTP) to protect administrative access.',
      time: 'Notice',
      type: 'info',
      to: `${base.value}/setup`,
    })
  }
  list.push({
    id: 'system-ok',
    title: 'Platform Operational',
    message: 'Database, cache, and storage services are running normally.',
    time: '24/7',
    type: 'success',
  })
  return list
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !notificationsRead.value.includes(n.id)).length
})

function markAllNotificationsRead() {
  notificationsRead.value = notifications.value.map(n => n.id)
}

async function signOut() {
  try {
    await $fetch('/api/auth/sign-out', { method: 'POST', body: {} })
  } finally {
    await navigateTo(config.public.adminLoginPath || '/tachyPanel')
  }
}

// Global hotkeys (Ctrl+K for palette, Ctrl+B for sidebar collapse)
function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    commandPaletteOpen.value = !commandPaletteOpen.value
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    isCollapsed.value = !isCollapsed.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

watch(() => route.path, () => {
  mobileOpen.value = false
})
</script>

<template>
  <div class="h-screen h-dvh bg-base-100 text-base-content antialiased flex flex-col font-sans selection:bg-primary/25 selection:text-primary overflow-hidden">
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Backdrop for mobile drawer -->
      <Transition name="fade">
        <div
          v-if="mobileOpen"
          class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          @click="mobileOpen = false"
        />
      </Transition>

      <!-- SIDEBAR -->
      <aside
        class="fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col border-r border-base-300 bg-base-200/95 backdrop-blur-md transition-all duration-300 ease-in-out md:static"
        :class="[
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'md:w-[72px]' : 'md:w-64',
        ]"
      >
        <!-- Sidebar Brand Header -->
        <div class="relative flex h-16 items-center justify-center border-b border-base-300 px-4 transition-all">
          <BrandLogo :to="`${base}/dashboard`" :mark="isCollapsed" />

          <!-- Mobile close button -->
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square md:hidden absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
            aria-label="Close sidebar"
            @click="mobileOpen = false"
          >
            <X class="size-4" />
          </button>
        </div>

        <!-- Sidebar Navigation -->
        <div class="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
          <div v-for="section in navSections" :key="section.title">
            <!-- Section Header (hidden on collapse) -->
            <h3
              v-if="!isCollapsed"
              class="px-2.5 text-[10px] font-bold uppercase tracking-wider text-base-content/40 font-mono transition-opacity"
            >
              {{ section.title }}
            </h3>
            <div v-else class="mx-auto w-6 border-b border-base-300/60 my-2" />

            <ul class="mt-1.5 space-y-1">
              <li v-for="item in section.items" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="group relative flex items-center rounded-xl py-2 text-xs font-medium transition-all duration-150"
                  :class="[
                    isCollapsed ? 'justify-center px-0 tooltip tooltip-right' : 'justify-between px-3',
                    isActive(item.to)
                      ? 'bg-primary text-primary-content font-semibold shadow-xs'
                      : 'text-base-content/70 hover:bg-base-300/80 hover:text-base-content',
                  ]"
                  :data-tip="isCollapsed ? item.label : undefined"
                >
                  <!-- Active Indicator Pip -->
                  <div
                    v-if="isActive(item.to) && !isCollapsed"
                    class="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary-content/40"
                  />

                  <div class="flex items-center gap-2.5 min-w-0">
                    <component
                      :is="item.icon"
                      class="size-4 shrink-0 transition-transform group-hover:scale-105"
                      :class="isActive(item.to) ? 'text-primary-content' : 'text-primary'"
                    />
                    <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
                  </div>

                  <!-- Badge -->
                  <span
                    v-if="item.badge && !isCollapsed"
                    class="badge badge-xs font-mono uppercase ml-1.5 shrink-0"
                    :class="[
                      isActive(item.to)
                        ? 'bg-primary-content/20 text-primary-content'
                        : item.badgeVariant === 'warning'
                          ? 'badge-warning'
                          : item.badgeVariant === 'success'
                            ? 'badge-success'
                            : 'badge-ghost',
                    ]"
                  >
                    {{ item.badge }}
                  </span>
                  <!-- Mini indicator dot if collapsed -->
                  <span
                    v-else-if="item.badge && isCollapsed"
                    class="size-2 rounded-full absolute top-1.5 right-1.5"
                    :class="item.badgeVariant === 'warning' ? 'bg-warning' : 'bg-primary'"
                  />
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Sidebar Footer Admin Card -->
        <div class="border-t border-base-300 p-2.5 bg-base-200/50">
          <div
            class="flex items-center rounded-xl p-1.5 transition-colors"
            :class="isCollapsed ? 'justify-center' : 'justify-between hover:bg-base-300/50'"
          >
            <NuxtLink
              :to="`${base}/profile`"
              class="flex items-center gap-2.5 min-w-0"
              :class="isCollapsed ? 'tooltip tooltip-right' : ''"
              :data-tip="isCollapsed ? sessionData?.user?.name || 'Profile' : undefined"
            >
              <div class="relative">
                <div class="size-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center font-mono ring-1 ring-primary/30">
                  {{ (sessionData?.user?.username || sessionData?.user?.name || 'A').charAt(0).toUpperCase() }}
                </div>
                <span class="size-2 rounded-full bg-success absolute bottom-0 right-0 ring-2 ring-base-200" />
              </div>
              <div v-if="!isCollapsed" class="min-w-0">
                <p class="truncate text-xs font-semibold leading-tight">{{ sessionData?.user?.username || sessionData?.user?.name || 'Admin' }}</p>
                <p class="truncate text-[10px] text-base-content/40 font-mono">{{ sessionData?.user?.email }}</p>
              </div>
            </NuxtLink>

            <button
              v-if="!isCollapsed"
              type="button"
              class="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-error hover:bg-error/10 transition-colors"
              title="Sign out of console"
              @click="signOut"
            >
              <LogOut class="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="flex flex-1 flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <!-- TOP HEADER -->
        <header class="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-base-300 bg-base-100/90 px-4 md:px-6 lg:px-8 backdrop-blur-md">
          <!-- Left: Hamburger (mobile), Collapse Toggle (desktop), Breadcrumb -->
          <div class="flex items-center gap-2.5">
            <!-- Mobile Toggle -->
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square md:hidden text-base-content/70 hover:text-base-content"
              aria-label="Open sidebar drawer"
              @click="mobileOpen = true"
            >
              <Menu class="size-5" />
            </button>

            <!-- Desktop Collapse Toggle -->
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square hidden md:inline-flex text-base-content/60 hover:text-base-content hover:bg-base-200"
              :title="isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'"
              @click="isCollapsed = !isCollapsed"
            >
              <PanelLeftClose v-if="!isCollapsed" class="size-4" />
              <PanelLeft v-else class="size-4" />
            </button>

            <!-- Breadcrumbs -->
            <div class="flex items-center gap-1.5 text-xs font-mono ml-1">
              <NuxtLink :to="`${base}/dashboard`" class="text-base-content/40 hover:text-base-content/80 transition-colors">
                Console
              </NuxtLink>
              <ChevronRight class="size-3 text-base-content/25" />
              <span class="font-semibold text-primary flex items-center gap-1.5">
                <component :is="currentPage.icon" class="size-3.5 text-primary" />
                <span>{{ currentPage.label }}</span>
              </span>
            </div>
          </div>

          <!-- Center: Command Palette Trigger -->
          <div class="hidden sm:block">
            <button
              type="button"
              class="w-48 md:w-64 flex items-center justify-between px-3 py-1.5 rounded-xl border border-base-300/80 bg-base-200/50 hover:bg-base-200 hover:border-base-300 text-xs text-base-content/50 hover:text-base-content transition-all font-mono shadow-xs"
              @click="commandPaletteOpen = true"
            >
              <div class="flex items-center gap-2">
                <Search class="size-3.5 text-base-content/40" />
                <span>Search console...</span>
              </div>
              <kbd class="kbd kbd-xs bg-base-300/80 text-[10px] text-base-content/60 font-mono">⌘K</kbd>
            </button>
          </div>

          <!-- Right: Status, Notifications, Site Link, Theme, Profile -->
          <div class="flex items-center gap-2">
            <!-- Mobile Search Icon Button -->
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square sm:hidden text-base-content/60"
              title="Search console"
              @click="commandPaletteOpen = true"
            >
              <Search class="size-4" />
            </button>

            <!-- Operational Status Pill -->
            <div class="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-mono font-medium text-success">
              <span class="size-1.5 rounded-full bg-success animate-pulse" />
              <span>Healthy</span>
            </div>

            <!-- Notifications Dropdown -->
            <div class="dropdown dropdown-end">
              <button
                tabindex="0"
                type="button"
                class="btn btn-ghost btn-sm btn-square relative text-base-content/70 hover:text-base-content"
                aria-label="View notifications"
              >
                <Bell class="size-4" />
                <span
                  v-if="unreadCount > 0"
                  class="size-2 rounded-full bg-primary absolute top-1.5 right-1.5 ring-2 ring-base-100"
                />
              </button>
              <div
                tabindex="0"
                class="dropdown-content z-50 mt-3 w-80 rounded-2xl border border-base-300 bg-base-100 p-0 shadow-2xl overflow-hidden font-sans"
              >
                <div class="flex items-center justify-between border-b border-base-200 px-4 py-3 bg-base-200/40">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold tracking-tight">System Notifications</span>
                    <span v-if="unreadCount > 0" class="badge badge-primary badge-xs font-mono font-bold">{{ unreadCount }}</span>
                  </div>
                  <button
                    v-if="unreadCount > 0"
                    type="button"
                    class="text-[10px] font-mono text-primary hover:underline"
                    @click="markAllNotificationsRead"
                  >
                    Mark read
                  </button>
                </div>

                <div class="max-h-64 overflow-y-auto divide-y divide-base-200/60 p-1">
                  <div
                    v-for="item in notifications"
                    :key="item.id"
                    class="p-3 rounded-xl transition-colors"
                    :class="notificationsRead.includes(item.id) ? 'opacity-60 bg-transparent' : 'bg-base-200/40'"
                  >
                    <div class="flex items-start gap-2.5">
                      <div class="mt-0.5 shrink-0">
                        <AlertTriangle v-if="item.type === 'warning'" class="size-3.5 text-warning" />
                        <CheckCircle2 v-else-if="item.type === 'success'" class="size-3.5 text-success" />
                        <ShieldCheck v-else class="size-3.5 text-primary" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-1">
                          <p class="text-xs font-semibold leading-tight text-base-content">{{ item.title }}</p>
                          <span class="text-[9px] font-mono text-base-content/40 shrink-0">{{ item.time }}</span>
                        </div>
                        <p class="mt-1 text-[11px] text-base-content/70 leading-normal">{{ item.message }}</p>
                        <NuxtLink
                          v-if="item.to"
                          :to="item.to"
                          class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono text-primary font-semibold hover:underline"
                        >
                          <span>Inspect</span>
                          <ChevronRight class="size-2.5" />
                        </NuxtLink>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="border-t border-base-200 px-4 py-2 bg-base-200/30 text-[10px] text-base-content/40 font-mono text-center">
                  Live telemetry stream connected
                </div>
              </div>
            </div>

            <!-- View Public Site Button -->
            <NuxtLink
              to="/"
              class="btn btn-ghost btn-sm gap-1.5 text-xs font-mono text-base-content/70 hover:text-base-content"
              title="Visit public website"
            >
              <ExternalLink class="size-3.5" />
              <span class="hidden md:inline">Site</span>
            </NuxtLink>

            <ThemePicker />

            <!-- Profile Dropdown -->
            <div class="dropdown dropdown-end">
              <button
                tabindex="0"
                type="button"
                class="btn btn-ghost btn-sm btn-circle avatar placeholder ring-1 ring-base-300 hover:ring-primary/40 transition-all"
                aria-label="User menu"
              >
                <div class="size-7 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center font-mono">
                  {{ (sessionData?.user?.username || sessionData?.user?.name || 'A').charAt(0).toUpperCase() }}
                </div>
              </button>
              <ul
                tabindex="0"
                class="dropdown-content menu menu-sm z-50 mt-3 w-56 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl font-sans"
              >
                <!-- User Card in Dropdown -->
                <li class="px-2.5 py-2 pointer-events-none border-b border-base-200 mb-1">
                  <div class="flex items-center justify-between gap-1">
                    <p class="text-xs font-bold text-base-content truncate">
                      {{ sessionData?.user?.username || sessionData?.user?.name }}
                    </p>
                    <span class="badge badge-primary badge-xs font-mono font-bold uppercase">ADMIN</span>
                  </div>
                  <p class="text-[10px] text-base-content/40 font-mono truncate mt-0.5">{{ sessionData?.user?.email }}</p>
                </li>

                <li>
                  <NuxtLink :to="`${base}/profile`" class="flex items-center gap-2 py-2">
                    <User class="size-3.5 text-primary" />
                    <span>Admin Profile</span>
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink :to="`${base}/setup`" class="flex items-center gap-2 py-2">
                    <KeyRound class="size-3.5 text-primary" />
                    <span>2FA Security</span>
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink :to="`${base}/monitoring`" class="flex items-center gap-2 py-2">
                    <Activity class="size-3.5 text-primary" />
                    <span>System Metrics</span>
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink :to="`${base}/settings`" class="flex items-center gap-2 py-2">
                    <Sliders class="size-3.5 text-primary" />
                    <span>Site Settings</span>
                  </NuxtLink>
                </li>

                <div class="divider my-1 border-base-200" />
                <li>
                  <button type="button" class="flex items-center gap-2 py-2 text-error hover:bg-error/10 font-medium" @click="signOut">
                    <LogOut class="size-3.5" />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <!-- MAIN CONTENT AREA (INDEPENDENT SCROLL) -->
        <main class="flex-1 min-h-0 overflow-y-auto bg-base-100/60 flex flex-col justify-between">
          <div class="p-4 sm:p-6 lg:p-8 flex-1">
            <div class="mx-auto max-w-7xl w-full">
              <slot />
            </div>
          </div>

          <!-- FOOTER -->
          <footer class="shrink-0 border-t border-base-300 bg-base-200/40 px-4 sm:px-6 lg:px-8 py-3 text-xs text-base-content/50 font-mono">
            <div class="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-base-content/70">Tachy Admin Console</span>
                <span>·</span>
                <span>v1.0.0</span>
                <span>·</span>
                <span class="opacity-60">Status: All systems operational</span>
              </div>
              <div class="flex items-center gap-3 text-[11px] opacity-40">
                <span>All rights reserved</span>
                <span>© 2026 Tachy</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>

    <!-- Command Palette Component -->
    <AdminCommandPalette v-model="commandPaletteOpen" />
  </div>
</template>
