<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Keyboard,
  Command,
  Zap,
  ShieldCheck,
  BarChart3,
  Mail,
  MessageSquare,
  Github,
  Twitter,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Code2,
  CheckCircle2,
  Layers,
  Copy,
  Check,
  Flame,
  Globe2,
  Clock,
  Terminal,
  Share2,
  Youtube,
} from 'lucide-vue-next'
import type { PublicStats } from '#shared/types/test'
import type { SeoConfig } from '#shared/schemas/seo'
import type { SocialConfig } from '#shared/schemas/social'

useSeo('about')

const toast = useToast()
const config = useRuntimeConfig()
const { brand } = useBrand()
const { data: siteConfig } = await useFetch<{ seo?: SeoConfig; social?: SocialConfig }>('/api/site-config')

const { data: statsData } = await useFetch<PublicStats>('/api/stats/global', {
  default: () => ({ tests: 0, words: 0, timeMs: 0, users: 0 }),
})

const stats = computed(() => [
  { label: 'Tests Completed', value: (statsData.value?.tests || 0).toLocaleString(), icon: Zap },
  { label: 'Words Typed', value: (statsData.value?.words || 0).toLocaleString(), icon: Terminal },
  { label: 'Time Typed', value: `${Math.round((statsData.value?.timeMs || 0) / 3600000).toLocaleString()} h`, icon: Clock },
  { label: 'Registered Typists', value: (statsData.value?.users || 0).toLocaleString(), icon: Globe2 },
])

// Keybinds & Shortcuts Data
interface Shortcut {
  category: 'general' | 'typing' | 'results'
  keys: string[]
  description: string
  actionHint: string
  configurable?: boolean
}

const shortcutFilter = ref<'all' | 'general' | 'typing' | 'results'>('all')
const shortcutSearch = ref('')

const allShortcuts: Shortcut[] = [
  // General & Navigation
  {
    category: 'general',
    keys: ['Ctrl', 'K'],
    description: 'Open Command Palette',
    actionHint: 'Search & jump to any page, switch test modes, themes, or languages',
  },
  {
    category: 'general',
    keys: ['Tab'],
    description: 'Quick Restart Test',
    actionHint: 'Instantly resets the test with a fresh seed (or same seed if configured)',
    configurable: true,
  },
  {
    category: 'general',
    keys: ['Esc'],
    description: 'Quick Restart / Close Modals',
    actionHint: 'Closes dialogs, command palette, or restarts current test',
    configurable: true,
  },
  {
    category: 'general',
    keys: ['Enter'],
    description: 'Confirm Selection',
    actionHint: 'Executes the selected item in command palette or dialogs',
  },
  // During Typing
  {
    category: 'typing',
    keys: ['Space'],
    description: 'Submit Word & Advance',
    actionHint: 'Submits current word and jumps cursor to next word',
  },
  {
    category: 'typing',
    keys: ['Backspace'],
    description: 'Delete Character',
    actionHint: 'Erases the previous character in the active word',
  },
  {
    category: 'typing',
    keys: ['Ctrl', 'Backspace'],
    description: 'Delete Full Word',
    actionHint: 'Erases the entire typed string for the active word in one press',
  },
  {
    category: 'typing',
    keys: ['Alt', 'Backspace'],
    description: 'Delete Word (macOS / Linux)',
    actionHint: 'Option / Alt + Delete clears active word back to word boundary',
  },
  {
    category: 'typing',
    keys: ['Enter'],
    description: 'Submit Line / Newline',
    actionHint: 'Advances to next line in Code and Quote typing modes',
  },
  // On Results Screen
  {
    category: 'results',
    keys: ['Enter'],
    description: 'Next Test',
    actionHint: 'Starts a brand new typing test immediately from the result card',
  },
  {
    category: 'results',
    keys: ['Tab'],
    description: 'Restart Test',
    actionHint: 'Prepares a new test seed from the result screen',
  },
  {
    category: 'results',
    keys: ['Alt', 'R'],
    description: 'Repeat Same Text',
    actionHint: 'Replays the exact same word seed to practice missed words',
  },
]

const filteredShortcuts = computed(() => {
  return allShortcuts.filter(s => {
    const matchCategory = shortcutFilter.value === 'all' || s.category === shortcutFilter.value
    if (!matchCategory) return false
    if (!shortcutSearch.value.trim()) return true
    const q = shortcutSearch.value.toLowerCase()
    return s.description.toLowerCase().includes(q)
      || s.actionHint.toLowerCase().includes(q)
      || s.keys.some(k => k.toLowerCase().includes(q))
  })
})

function openCommandPalette() {
  if (import.meta.client) {
    window.dispatchEvent(new CustomEvent('open-palette'))
  }
}

// Dynamic Contact & Community Links from site-config
const copiedContactEmail = ref(false)

const supportEmail = computed(() => siteConfig.value?.social?.email || 'support@tachy.app')
const githubUrl = computed(() => siteConfig.value?.social?.github || 'https://github.com/dayyysss/tachy')
const discordUrl = computed(() => siteConfig.value?.social?.discord || 'https://discord.gg')
const twitterUrl = computed(() => {
  if (siteConfig.value?.social?.twitter) return siteConfig.value.social.twitter
  if (siteConfig.value?.seo?.twitterHandle) {
    const handle = siteConfig.value.seo.twitterHandle.replace('@', '')
    return `https://x.com/${handle}`
  }
  return 'https://x.com'
})
const twitterDisplay = computed(() => {
  if (siteConfig.value?.seo?.twitterHandle) {
    return siteConfig.value.seo.twitterHandle.startsWith('@')
      ? siteConfig.value.seo.twitterHandle
      : `@${siteConfig.value.seo.twitterHandle}`
  }
  return '@tachyapp'
})
const blueskyUrl = computed(() => siteConfig.value?.social?.bluesky || '')
const youtubeUrl = computed(() => siteConfig.value?.social?.youtube || '')

const socialCards = computed(() => {
  const cards = [
    {
      title: 'Direct Support',
      desc: 'General inquiries, security disclosures, and account questions.',
      actionText: 'Send Email',
      url: `mailto:${supportEmail.value}`,
      copyable: true,
      display: supportEmail.value,
      icon: Mail,
      iconColor: 'text-primary',
      btnClass: 'btn btn-primary btn-xs flex-1 font-semibold',
      external: false,
    },
    {
      title: 'GitHub',
      desc: 'Open-source issue tracking, technical bug reports, and roadmap discussions.',
      actionText: 'GitHub Repository',
      url: githubUrl.value,
      copyable: false,
      display: null,
      icon: Github,
      iconColor: 'text-base-content',
      btnClass: 'btn btn-neutral btn-xs font-semibold gap-1.5',
      external: true,
    },
    {
      title: 'Discord Community',
      desc: 'Chat with fellow typists, participate in speed runs, and share your personal bests.',
      actionText: 'Join Discord',
      url: discordUrl.value,
      copyable: false,
      display: null,
      icon: MessageSquare,
      iconColor: 'text-[#5865F2]',
      btnClass: 'btn btn-outline btn-xs border-base-300 font-semibold gap-1.5 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2]',
      external: true,
    },
    {
      title: 'X (Twitter)',
      desc: 'Follow announcements, release notes, and community speed highlights.',
      actionText: `Follow ${twitterDisplay.value}`,
      url: twitterUrl.value,
      copyable: false,
      display: null,
      icon: Twitter,
      iconColor: 'text-base-content',
      btnClass: 'btn btn-outline btn-xs border-base-300 font-semibold gap-1.5 hover:bg-neutral hover:text-white',
      external: true,
    },
  ]

  if (blueskyUrl.value) {
    cards.push({
      title: 'Bluesky',
      desc: 'Decentralized social network feed, platform changelogs, and typist highlights.',
      actionText: 'Open Bluesky',
      url: blueskyUrl.value,
      copyable: false,
      display: null,
      icon: Share2,
      iconColor: 'text-info',
      btnClass: 'btn btn-outline btn-xs border-base-300 font-semibold gap-1.5 hover:bg-info hover:text-white',
      external: true,
    })
  }

  if (youtubeUrl.value) {
    cards.push({
      title: 'YouTube',
      desc: 'Typing masterclasses, speed benchmark runs, and platform video tutorials.',
      actionText: 'Watch Channel',
      url: youtubeUrl.value,
      copyable: false,
      display: null,
      icon: Youtube,
      iconColor: 'text-error',
      btnClass: 'btn btn-outline btn-xs border-base-300 font-semibold gap-1.5 hover:bg-error hover:text-white',
      external: true,
    })
  }

  return cards
})

function copyEmail(address: string) {
  if (import.meta.client) {
    navigator.clipboard?.writeText(address)
    copiedContactEmail.value = true
    toast.success('Support email copied to clipboard!')
    setTimeout(() => { copiedContactEmail.value = false }, 2500)
  }
}

// FAQ Accordion Data
const faqs = [
  {
    q: 'How is Net WPM calculated and why divide by 5?',
    a: 'Standard typing benchmarks treat 5 keystrokes (including letters, spaces, and punctuation) as one "standard word". Net WPM penalizes uncorrected errors, calculated strictly as: (Correct Characters ÷ 5) ÷ (Time in seconds ÷ 60). This provides an internationally comparable standard independent of word length.',
  },
  {
    q: 'What is the difference between Raw WPM and Net WPM?',
    a: 'Raw WPM represents your absolute speed across all keypresses, calculated as (Total Characters ÷ 5) ÷ Minutes. Net WPM only counts words typed correctly. The difference between Raw and Net WPM indicates how much speed you lost due to typing errors.',
  },
  {
    q: 'What does the Consistency percentage mean?',
    a: 'Consistency measures your rhythm stability. Calculated as 100 × (1 − σ ÷ μ), where σ is the standard deviation of your per-second typing speed and μ is your mean speed. A higher percentage (>85%) means you maintain a continuous, smooth keystroke cadence without stuttering or pausing.',
  },
  {
    q: 'Do I have to register an account to use Tachy?',
    a: 'No! Tachy is fully accessible as a guest. Your last 50 tests and custom preferences remain in your browser storage. If you choose to register or sign in later, clicking "Sign in to save" automatically syncs your score, keystrokes, and XP to your account without losing your test.',
  },
  {
    q: 'How does the anti-cheat verification system work?',
    a: 'Every ranked test records millisecond-precision keystroke telemetry signed by a one-time server token. When submitted, the backend re-simulates the typing session against the deterministic seed. Tests with impossible reaction speeds (<30ms), synthetic robotic pacing, or pasted blocks are flagged or rejected automatically.',
  },
  {
    q: 'How can I customize themes, sound effects, and caret styling?',
    a: 'Press Ctrl + K anywhere to open the Command Palette, or visit the Settings page. You can customize font size, switch between 10+ handcrafted themes, toggle mechanical keypress audio, and choose between line, block, underline, or outline carets with optional smooth animations.',
  },
]
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12 space-y-12 font-sans">
    <!-- Hero Banner -->
    <section class="relative overflow-hidden rounded-3xl border border-base-300 bg-base-200/50 p-6 sm:p-12 shadow-sm">
      <div class="absolute -right-16 -top-16 size-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div class="relative z-10 max-w-2xl space-y-4">
        <div class="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-mono font-semibold text-primary">
          <Sparkles class="size-3.5" />
          <span>Minimalist Speed Typing Platform</span>
        </div>

        <h1 class="text-3xl font-extrabold tracking-tight text-base-content sm:text-5xl">
          About Tachy
        </h1>

        <p class="text-sm sm:text-base leading-relaxed text-base-content/75">
          Tachy (from the Greek <em>tachys</em>, meaning swift) is an ultra-fast, distraction-free typing benchmark
          engineered for typists, programmers, and writers. No advertisements, no bloated tracking scripts, and
          instant practice available offline or synced to your cloud profile.
        </p>

        <!-- Quick Section Anchor Jump Pills -->
        <div class="flex flex-wrap gap-2 pt-2">
          <a href="#shortcuts" class="btn btn-xs rounded-lg border border-base-300 bg-base-100 font-mono hover:border-primary">
            <Keyboard class="size-3 text-primary mr-1" />
            Keybinds
          </a>
          <a href="#metrics" class="btn btn-xs rounded-lg border border-base-300 bg-base-100 font-mono hover:border-primary">
            <BarChart3 class="size-3 text-primary mr-1" />
            Metrics & Formulas
          </a>
          <a href="#modes" class="btn btn-xs rounded-lg border border-base-300 bg-base-100 font-mono hover:border-primary">
            <Layers class="size-3 text-primary mr-1" />
            Test Modes
          </a>
          <a href="#contact" class="btn btn-xs rounded-lg border border-base-300 bg-base-100 font-mono hover:border-primary">
            <Mail class="size-3 text-primary mr-1" />
            Contact
          </a>
          <a href="#faq" class="btn btn-xs rounded-lg border border-base-300 bg-base-100 font-mono hover:border-primary">
            <HelpCircle class="size-3 text-primary mr-1" />
            FAQ
          </a>
        </div>

        <div class="pt-2 flex flex-wrap gap-3">
          <NuxtLink to="/" class="btn btn-primary btn-sm px-5 font-semibold shadow-xs">
            Start Typing Test →
          </NuxtLink>
          <button
            type="button"
            class="btn btn-ghost btn-sm border border-base-300 font-mono text-xs gap-1.5"
            @click="openCommandPalette"
          >
            <Command class="size-3.5 text-primary" />
            <span>Command Palette (Ctrl+K)</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Global Platform Live Numbers -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xs font-mono font-semibold uppercase tracking-widest text-base-content/50">
          Live Global Benchmark Statistics
        </h2>
        <span class="text-[11px] font-mono text-base-content/40">Real-time database tally</span>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono">
        <div
          v-for="item in stats"
          :key="item.label"
          class="flex items-center gap-3.5 rounded-2xl border border-base-300/80 bg-base-200/40 p-4 transition-all hover:border-primary/40 hover:bg-base-200/70"
        >
          <div class="rounded-xl bg-primary/10 p-2.5 text-primary">
            <component :is="item.icon" class="size-5" />
          </div>
          <div>
            <p class="text-[11px] uppercase tracking-wider text-base-content/40">{{ item.label }}</p>
            <p class="text-xl sm:text-2xl font-bold tabular-nums text-primary">{{ item.value }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION: Keyboard Shortcuts & Keybinds -->
    <section id="shortcuts" class="rounded-3xl border border-base-300 bg-base-200/30 p-6 sm:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-300/80 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <Keyboard class="size-5 text-primary" />
            <h2 class="text-xl font-bold text-base-content">Keybinds & Keyboard Shortcuts</h2>
          </div>
          <p class="text-xs text-base-content/60 mt-1">
            Complete quick-action matrix designed for seamless keyboard-only navigation.
          </p>
        </div>

        <button
          type="button"
          class="btn btn-outline btn-xs font-mono gap-1.5 self-start sm:self-auto"
          @click="openCommandPalette"
        >
          <Command class="size-3" />
          <span>Test Command Palette (Ctrl+K)</span>
        </button>
      </div>

      <!-- Controls: Category Filter Tabs & Quick Search -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
        <div class="flex flex-wrap gap-1 rounded-xl bg-base-300/40 p-1 border border-base-300">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-semibold transition-all"
            :class="shortcutFilter === 'all' ? 'bg-primary text-primary-content shadow-xs' : 'text-base-content/60 hover:text-base-content'"
            @click="shortcutFilter = 'all'"
          >
            All ({{ allShortcuts.length }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-semibold transition-all"
            :class="shortcutFilter === 'general' ? 'bg-primary text-primary-content shadow-xs' : 'text-base-content/60 hover:text-base-content'"
            @click="shortcutFilter = 'general'"
          >
            Navigation
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-semibold transition-all"
            :class="shortcutFilter === 'typing' ? 'bg-primary text-primary-content shadow-xs' : 'text-base-content/60 hover:text-base-content'"
            @click="shortcutFilter = 'typing'"
          >
            During Test
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-semibold transition-all"
            :class="shortcutFilter === 'results' ? 'bg-primary text-primary-content shadow-xs' : 'text-base-content/60 hover:text-base-content'"
            @click="shortcutFilter = 'results'"
          >
            Results Screen
          </button>
        </div>

        <input
          v-model="shortcutSearch"
          type="text"
          placeholder="Filter shortcuts..."
          class="input input-bordered input-sm text-xs font-sans bg-base-100 max-w-xs"
        >
      </div>

      <!-- Shortcuts Table / Matrix -->
      <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
        <div class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="border-b border-base-300 bg-base-200/50 font-mono text-[11px] text-base-content/50 uppercase">
                <th class="py-3 px-4">Keybind</th>
                <th class="py-3 px-4">Function</th>
                <th class="py-3 px-4 hidden md:table-cell">Context & Details</th>
                <th class="py-3 px-4 text-right">Scope</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base-300/60 font-mono text-xs">
              <tr
                v-for="item in filteredShortcuts"
                :key="item.description"
                class="hover:bg-base-200/40 transition-colors"
              >
                <!-- Key combination -->
                <td class="py-3 px-4 whitespace-nowrap">
                  <div class="inline-flex items-center gap-1.5">
                    <template v-for="(k, kIdx) in item.keys" :key="k">
                      <kbd class="kbd kbd-sm rounded-md border border-base-300 bg-base-200/80 px-2 py-0.5 font-bold font-mono text-primary shadow-xs">
                        {{ k }}
                      </kbd>
                      <span v-if="kIdx < item.keys.length - 1" class="text-base-content/40 font-mono text-xs">+</span>
                    </template>
                  </div>
                </td>

                <!-- Description -->
                <td class="py-3 px-4 font-bold text-base-content">
                  {{ item.description }}
                  <span v-if="item.configurable" class="badge badge-xs badge-ghost ml-1.5 font-normal text-[10px]">Configurable</span>
                </td>

                <!-- Details -->
                <td class="py-3 px-4 text-base-content/65 font-sans text-xs hidden md:table-cell">
                  {{ item.actionHint }}
                </td>

                <!-- Category badge -->
                <td class="py-3 px-4 text-right">
                  <span
                    class="badge badge-xs font-mono uppercase font-semibold"
                    :class="{
                      'badge-primary': item.category === 'general',
                      'badge-secondary': item.category === 'typing',
                      'badge-accent': item.category === 'results',
                    }"
                  >
                    {{ item.category }}
                  </span>
                </td>
              </tr>

              <tr v-if="filteredShortcuts.length === 0">
                <td colspan="4" class="py-8 text-center text-xs font-mono text-base-content/40">
                  No matching shortcuts found for "{{ shortcutSearch }}".
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- SECTION: Standardized Metric Formulas -->
    <section id="metrics" class="space-y-6">
      <div class="border-b border-base-300/80 pb-4">
        <div class="flex items-center gap-2">
          <BarChart3 class="size-5 text-primary" />
          <h2 class="text-xl font-bold text-base-content">Standardized Metric Formulas</h2>
        </div>
        <p class="text-xs text-base-content/60 mt-1">
          Tachy adheres to authoritative international typing standards established by speed typing competitions.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono">
        <!-- Net WPM Card -->
        <div class="rounded-2xl border border-base-300 bg-base-200/40 p-5 space-y-3 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-primary">Net Speed</span>
            <span class="badge badge-primary badge-xs">Standard</span>
          </div>
          <p class="text-2xl font-bold text-base-content">WPM</p>
          <div class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs leading-relaxed text-base-content/80">
            <code>(Correct Chars ÷ 5) ÷ Minutes</code>
          </div>
          <p class="text-[11px] font-sans text-base-content/60">
            5 characters equals 1 standard word. Penalizes uncorrected typos.
          </p>
        </div>

        <!-- Raw WPM Card -->
        <div class="rounded-2xl border border-base-300 bg-base-200/40 p-5 space-y-3 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-secondary">Gross Speed</span>
            <span class="badge badge-ghost badge-xs">Raw</span>
          </div>
          <p class="text-2xl font-bold text-base-content">Raw WPM</p>
          <div class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs leading-relaxed text-base-content/80">
            <code>(Total Chars ÷ 5) ÷ Minutes</code>
          </div>
          <p class="text-[11px] font-sans text-base-content/60">
            Gross speed before error deduction. Measures pure finger velocity.
          </p>
        </div>

        <!-- Accuracy Card -->
        <div class="rounded-2xl border border-base-300 bg-base-200/40 p-5 space-y-3 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-accent">Precision</span>
            <span class="badge badge-accent badge-xs">Accuracy</span>
          </div>
          <p class="text-2xl font-bold text-base-content">Accuracy %</p>
          <div class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs leading-relaxed text-base-content/80">
            <code>(Correct Keys ÷ Total Keys) × 100</code>
          </div>
          <p class="text-[11px] font-sans text-base-content/60">
            Percentage of exact keypresses matching the target prompt.
          </p>
        </div>

        <!-- Consistency Card -->
        <div class="rounded-2xl border border-base-300 bg-base-200/40 p-5 space-y-3 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-info">Rhythm</span>
            <span class="badge badge-info badge-xs">Consistency</span>
          </div>
          <p class="text-2xl font-bold text-base-content">Consistency %</p>
          <div class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs leading-relaxed text-base-content/80">
            <code>100 × (1 − σ ÷ μ)</code>
          </div>
          <p class="text-[11px] font-sans text-base-content/60">
            Stability of speed per second. Higher values denote steady flow without stutter.
          </p>
        </div>
      </div>

      <!-- Character Breakdown Guide -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 space-y-3">
        <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-base-content/60">
          Character Telemetry Breakdown
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div class="rounded-xl border border-base-300/80 bg-base-200/40 p-3 space-y-1">
            <span class="badge badge-success badge-xs font-bold">✓ Correct</span>
            <p class="text-[11px] font-sans text-base-content/70">Keypresses matching target prompt characters.</p>
          </div>
          <div class="rounded-xl border border-error/20 bg-error/5 p-3 space-y-1">
            <span class="badge badge-error badge-xs font-bold">✗ Incorrect</span>
            <p class="text-[11px] font-sans text-base-content/70">Mistyped letters requiring backspace correction.</p>
          </div>
          <div class="rounded-xl border border-warning/20 bg-warning/5 p-3 space-y-1">
            <span class="badge badge-warning badge-xs font-bold">+ Extra</span>
            <p class="text-[11px] font-sans text-base-content/70">Surplus characters typed past the target word boundary.</p>
          </div>
          <div class="rounded-xl border border-base-300/80 bg-base-200/40 p-3 space-y-1">
            <span class="badge badge-ghost badge-xs font-bold">- Missed</span>
            <p class="text-[11px] font-sans text-base-content/70">Characters skipped when spacebar was hit prematurely.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION: Test Modes & Engine -->
    <section id="modes" class="rounded-3xl border border-base-300 bg-base-200/30 p-6 sm:p-8 space-y-6">
      <div class="border-b border-base-300/80 pb-4">
        <div class="flex items-center gap-2">
          <Layers class="size-5 text-primary" />
          <h2 class="text-xl font-bold text-base-content">Test Modes & Features</h2>
        </div>
        <p class="text-xs text-base-content/60 mt-1">
          Train with realistic workflows, competitive timers, or infinite zen mode.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-2">
          <div class="flex items-center gap-2 font-mono font-bold text-primary">
            <Clock class="size-4" />
            <span>Time Mode</span>
          </div>
          <p class="font-sans text-base-content/70 leading-relaxed">
            15s, 30s, 60s, or 120s timer. Practice pacing under pressure with live speed counters.
          </p>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-2">
          <div class="flex items-center gap-2 font-mono font-bold text-secondary">
            <Terminal class="size-4" />
            <span>Words Mode</span>
          </div>
          <p class="font-sans text-base-content/70 leading-relaxed">
            10, 25, 50, or 100 fixed word counts. Focus on 100% accuracy without clock expiration.
          </p>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-2">
          <div class="flex items-center gap-2 font-mono font-bold text-accent">
            <Sparkles class="size-4" />
            <span>Quote Mode</span>
          </div>
          <p class="font-sans text-base-content/70 leading-relaxed">
            Curated quotes, literature, and proverbs with authentic capital letters and punctuation.
          </p>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-2">
          <div class="flex items-center gap-2 font-mono font-bold text-info">
            <Code2 class="size-4" />
            <span>Code Mode</span>
          </div>
          <p class="font-sans text-base-content/70 leading-relaxed">
            Authentic syntax, indentation, and brackets for TypeScript, Python, Go, Rust, and SQL.
          </p>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-2">
          <div class="flex items-center gap-2 font-mono font-bold text-success">
            <Flame class="size-4" />
            <span>Zen Mode</span>
          </div>
          <p class="font-sans text-base-content/70 leading-relaxed">
            Uncapped, infinite typing stream. No timers, no error locks, pure flow-state meditation.
          </p>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-2">
          <div class="flex items-center gap-2 font-mono font-bold text-warning">
            <ShieldCheck class="size-4" />
            <span>Anti-Cheat Replay</span>
          </div>
          <p class="font-sans text-base-content/70 leading-relaxed">
            Full keystroke telemetry. Replay every completed test stroke-by-stroke with microsecond precision.
          </p>
        </div>
      </div>
    </section>

    <!-- SECTION: Contact, Community & Bug Reports -->
    <section id="contact" class="space-y-6">
      <div class="border-b border-base-300/80 pb-4">
        <div class="flex items-center gap-2">
          <Mail class="size-5 text-primary" />
          <h2 class="text-xl font-bold text-base-content">Contact & Community</h2>
        </div>
        <p class="text-xs text-base-content/60 mt-1">
          Have feedback, found a bug, or want to suggest new features? We would love to hear from you.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
        <div
          v-for="card in socialCards"
          :key="card.title"
          class="flex flex-col justify-between rounded-2xl border border-base-300 bg-base-200/40 p-5 space-y-4 shadow-xs transition-colors hover:border-primary/40"
        >
          <div>
            <div class="flex items-center gap-2 font-bold" :class="card.iconColor">
              <component :is="card.icon" class="size-4" />
              <span>{{ card.title }}</span>
            </div>
            <p class="mt-2 font-sans text-xs text-base-content/70">
              {{ card.desc }}
            </p>
            <p v-if="card.display" class="mt-3 font-mono font-bold text-primary truncate">
              {{ card.display }}
            </p>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <a
              :href="card.url"
              :target="card.external ? '_blank' : undefined"
              :rel="card.external ? 'noopener noreferrer' : undefined"
              :class="card.btnClass"
            >
              <span>{{ card.actionText }}</span>
              <ExternalLink v-if="card.external" class="size-3" />
            </a>

            <button
              v-if="card.copyable"
              type="button"
              class="btn btn-ghost btn-xs border border-base-300"
              title="Copy email to clipboard"
              @click="copyEmail(card.display || supportEmail)"
            >
              <Check v-if="copiedContactEmail" class="size-3.5 text-success" />
              <Copy v-else class="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION: Frequently Asked Questions (FAQ) -->
    <section id="faq" class="rounded-3xl border border-base-300 bg-base-200/30 p-6 sm:p-8 space-y-6">
      <div class="border-b border-base-300/80 pb-4">
        <div class="flex items-center gap-2">
          <HelpCircle class="size-5 text-primary" />
          <h2 class="text-xl font-bold text-base-content">Frequently Asked Questions</h2>
        </div>
        <p class="text-xs text-base-content/60 mt-1">
          Everything you need to know about typing mechanics, privacy, and rankings.
        </p>
      </div>

      <div class="space-y-3">
        <div
          v-for="(faq, fIdx) in faqs"
          :key="faq.q"
          class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100"
        >
          <input type="checkbox" :name="`faq-${fIdx}`">
          <div class="collapse-title text-sm font-bold text-base-content pr-10">
            {{ faq.q }}
          </div>
          <div class="collapse-content text-xs leading-relaxed text-base-content/75 font-sans">
            <p>{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tech Stack Credits -->
    <section class="rounded-2xl border border-base-300/80 bg-base-200/20 p-6 text-center space-y-3 font-mono text-xs">
      <p class="text-[11px] uppercase tracking-wider text-base-content/50 font-semibold">
        Built With Modern Open Source Technologies
      </p>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <span class="badge badge-sm badge-ghost border border-base-300">Nuxt 4</span>
        <span class="badge badge-sm badge-ghost border border-base-300">Vue 3.5</span>
        <span class="badge badge-sm badge-ghost border border-base-300">Bun</span>
        <span class="badge badge-sm badge-ghost border border-base-300">Tailwind CSS 4</span>
        <span class="badge badge-sm badge-ghost border border-base-300">DaisyUI 5</span>
        <span class="badge badge-sm badge-ghost border border-base-300">Better Auth</span>
        <span class="badge badge-sm badge-ghost border border-base-300">Drizzle ORM</span>
        <span class="badge badge-sm badge-ghost border border-base-300">PostgreSQL</span>
      </div>
    </section>
  </div>
</template>
