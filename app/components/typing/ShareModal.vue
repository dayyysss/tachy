<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Download,
  Copy,
  Check,
  Share2,
  Link2,
  FileText,
  Sparkles,
  X,
  Image as ImageIcon,
} from 'lucide-vue-next'
import type { TestResult } from '#shared/types/test'
import type { SeoConfig } from '#shared/schemas/seo'

const props = defineProps<{
  modelValue: boolean
  result: TestResult
  isPB?: boolean
  serverId?: string | null
  serverMeta?: {
    xpGained?: number
    level?: number
    newAchievements?: string[]
    ranks?: { daily?: number | null; weekly?: number | null }
  } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toast = useToast()
const { user } = useAuth()
const config = useRuntimeConfig()
const { brand } = useBrand()
const { data: siteConfig } = useFetch<{ seo?: SeoConfig }>('/api/site-config', {
  key: 'site-config',
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const previewDataUrl = ref<string>('')
const copiedLink = ref(false)
const copiedImage = ref(false)
const copiedText = ref(false)
const downloading = ref(false)

function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    if (!src || typeof window === 'undefined') return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Fallback attempt without crossOrigin
      const fallback = new Image()
      fallback.onload = () => resolve(fallback)
      fallback.onerror = () => resolve(null)
      fallback.src = src
    }
    img.src = src
  })
}

const siteUrl = computed(() => {
  if (siteConfig.value?.seo?.siteUrl?.trim()) {
    return siteConfig.value.seo.siteUrl.trim().replace(/\/$/, '')
  }
  if (import.meta.client) return window.location.origin
  return ((config.public.siteUrl as string) || 'https://tachy.app').replace(/\/$/, '')
})

const displayDomain = computed(() => {
  const configured = siteConfig.value?.seo?.siteUrl?.trim()
  if (configured) {
    try {
      const withProto = configured.startsWith('http://') || configured.startsWith('https://')
        ? configured
        : `https://${configured}`
      return new URL(withProto).host.toUpperCase()
    } catch {
      return configured.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toUpperCase()
    }
  }

  if (import.meta.client && window.location?.host) {
    return window.location.host.toUpperCase()
  }

  const runtime = (config.public.siteUrl as string) || ''
  if (runtime) {
    try {
      return new URL(runtime).host.toUpperCase()
    } catch {
      return runtime.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toUpperCase()
    }
  }

  return 'TACHY.APP'
})

const shareUrl = computed(() => {
  if (props.serverId) return `${siteUrl.value}/share/${props.serverId}`
  return `${siteUrl.value}/?wpm=${Math.round(props.result.wpm)}&acc=${Math.round(props.result.accuracy)}`
})

const modeLabel = computed(() => {
  const c = props.result.config
  if (c.mode === 'time') return `Time ${c.amount}s`
  if (c.mode === 'words') return `${c.amount} Words`
  if (c.mode === 'quote') return 'Quote'
  return c.codeLanguage || c.mode
})

const langLabel = computed(() => props.result.config.language.toUpperCase())

const shareText = computed(() => {
  const r = props.result
  return `⚡ Just scored ${Math.round(r.wpm)} WPM with ${Math.round(r.accuracy)}% accuracy on Tachy! (${modeLabel.value} · ${langLabel.value})`
})

function close() {
  emit('update:modelValue', false)
}

let renderTicket = 0

async function renderCard() {
  const ticket = ++renderTicket
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 0. Asynchronously resolve dynamic brand assets from database
  const logoUrl = brand.value?.['logo-on-dark']?.url
    || brand.value?.['logo-on-light']?.url
    || '/brand/logo-on-dark.png'
  const markUrl = brand.value?.['logo-mark']?.url
    || brand.value?.['favicon']?.url
    || '/brand/logo-mark.png'

  const [logoImg, markImg] = await Promise.all([
    loadImage(logoUrl),
    loadImage(markUrl),
  ])

  if (ticket !== renderTicket) return

  const W = 1200
  const H = 630
  canvas.width = W
  canvas.height = H

  // 1. Background Obsidian Base
  ctx.fillStyle = '#0c0e12'
  ctx.fillRect(0, 0, W, H)

  // 2. Radial Amber Brand Glows
  const glowTopRight = ctx.createRadialGradient(980, 80, 20, 980, 80, 480)
  glowTopRight.addColorStop(0, 'rgba(245, 158, 11, 0.22)')
  glowTopRight.addColorStop(0.5, 'rgba(245, 158, 11, 0.05)')
  glowTopRight.addColorStop(1, 'rgba(12, 14, 18, 0)')
  ctx.fillStyle = glowTopRight
  ctx.fillRect(0, 0, W, H)

  const glowBottomLeft = ctx.createRadialGradient(180, 560, 10, 180, 560, 360)
  glowBottomLeft.addColorStop(0, 'rgba(234, 179, 8, 0.12)')
  glowBottomLeft.addColorStop(1, 'rgba(12, 14, 18, 0)')
  ctx.fillStyle = glowBottomLeft
  ctx.fillRect(0, 0, W, H)

  // 3. Subtle Cyber Grid Dots Pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)'
  for (let x = 40; x < W - 40; x += 32) {
    for (let y = 40; y < H - 40; y += 32) {
      ctx.beginPath()
      ctx.arc(x, y, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 4. Outer Container Rounded Border
  const pad = 28
  const radius = 24
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, radius)
  ctx.stroke()

  // 5. Header: Dynamic Database Brand Logo & Verified Subtitle
  const headerX = 64
  const headerY = 56
  const targetH = 48

  if (logoImg && logoImg.naturalWidth && logoImg.naturalHeight) {
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight
    if (aspect > 1.4) {
      // Wide Horizontal Brand Logo (mark + typography from branding)
      const targetW = Math.min(320, Math.round(targetH * aspect))
      ctx.drawImage(logoImg, headerX, headerY, targetW, targetH)

      const subX = headerX + targetW + 24
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.font = '600 13px monospace'
      ctx.fillText('VERIFIED SPEED TYPING RESULT', subX, headerY + targetH / 2 + 1)
    } else {
      // Square Brand Mark
      const iconSize = targetH
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(headerX, headerY, iconSize, iconSize, 12)
      ctx.clip()
      ctx.drawImage(logoImg, headerX, headerY, iconSize, iconSize)
      ctx.restore()

      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText('TACHY', headerX + iconSize + 14, headerY + targetH / 2)

      const tachyW = ctx.measureText('TACHY').width
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.font = '600 13px monospace'
      ctx.fillText('VERIFIED SPEED TYPING RESULT', headerX + iconSize + 14 + tachyW + 18, headerY + targetH / 2 + 1)
    }
  } else if (markImg && markImg.naturalWidth && markImg.naturalHeight) {
    // Brand Mark
    const iconSize = targetH
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(headerX, headerY, iconSize, iconSize, 12)
    ctx.clip()
    ctx.drawImage(markImg, headerX, headerY, iconSize, iconSize)
    ctx.restore()

    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText('TACHY', headerX + iconSize + 14, headerY + targetH / 2)

    const tachyW = ctx.measureText('TACHY').width
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.font = '600 13px monospace'
    ctx.fillText('VERIFIED SPEED TYPING RESULT', headerX + iconSize + 14 + tachyW + 18, headerY + targetH / 2 + 1)
  } else {
    // Vector Fallback
    ctx.fillStyle = '#facc15'
    ctx.beginPath()
    ctx.roundRect(headerX, headerY, targetH, targetH, 12)
    ctx.fill()

    ctx.fillStyle = '#0c0e12'
    ctx.font = '900 26px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('t', headerX + targetH / 2 - 1, headerY + targetH / 2 + 1)

    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText('TACHY', headerX + targetH + 14, headerY + targetH / 2)

    const tachyW = ctx.measureText('TACHY').width
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.font = '600 13px monospace'
    ctx.fillText('VERIFIED SPEED TYPING RESULT', headerX + targetH + 14 + tachyW + 18, headerY + targetH / 2 + 1)
  }

  // Top Right Pill Badges
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const modePillText = `${modeLabel.value.toUpperCase()} · ${langLabel.value}`

  ctx.font = 'bold 13px monospace'
  const modeWidth = ctx.measureText(modePillText).width
  const pillW = modeWidth + 28
  const pillH = 34
  const pillX = W - 64 - pillW
  const pillY = 62

  ctx.fillStyle = 'rgba(250, 204, 21, 0.12)'
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, 17)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#fde047'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(modePillText, pillX + pillW / 2, pillY + pillH / 2 + 1)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.textAlign = 'right'
  ctx.font = '500 13px monospace'
  ctx.fillText(dateStr, pillX - 16, pillY + pillH / 2 + 1)

  // Divider Line Under Header
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(64, 126)
  ctx.lineTo(W - 64, 126)
  ctx.stroke()

  // 6. Hero WPM Display (Left Column)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 14px monospace'
  ctx.fillText('NET SPEED', 66, 175)

  // Huge WPM Number
  const wpmVal = Math.round(props.result.wpm).toString()
  ctx.fillStyle = '#facc15'
  ctx.font = 'bold 112px monospace'
  ctx.fillText(wpmVal, 64, 280)

  // WPM unit
  const wpmWidth = ctx.measureText(wpmVal).width
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px monospace'
  ctx.fillText('WPM', 64 + wpmWidth + 14, 230)

  // Personal Best Badge if applicable
  if (props.isPB) {
    ctx.fillStyle = '#f59e0b'
    ctx.font = 'bold 12px monospace'
    const pbText = '★ PERSONAL BEST'
    const pbW = ctx.measureText(pbText).width + 20
    ctx.fillStyle = 'rgba(245, 158, 11, 0.18)'
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(64 + wpmWidth + 14, 248, pbW, 26, 6)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#fef08a'
    ctx.fillText(pbText, 64 + wpmWidth + 24, 266)
  }

  // 7. Stats Grid (Right of Hero WPM)
  const statsX = 520
  const statsCol2 = 820
  const statY1 = 175
  const statY2 = 250

  function drawStat(x: number, y: number, label: string, val: string, color = '#f8fafc') {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#94a3b8'
    ctx.font = '600 12px monospace'
    ctx.fillText(label, x, y)

    ctx.fillStyle = color
    ctx.font = 'bold 36px monospace'
    ctx.fillText(val, x, y + 42)
  }

  const accVal = `${(props.result.accuracy).toFixed(1)}%`
  const accColor = props.result.accuracy >= 98 ? '#4ade80' : props.result.accuracy >= 94 ? '#facc15' : '#f87171'
  drawStat(statsX, statY1, 'ACCURACY', accVal, accColor)
  drawStat(statsCol2, statY1, 'RAW SPEED', `${Math.round(props.result.rawWpm)} WPM`)

  const consVal = `${Math.round(props.result.consistency)}%`
  drawStat(statsX, statY2, 'CONSISTENCY', consVal, '#38bdf8')
  const durSec = Math.max(1, Math.round(props.result.durationMs / 1000))
  drawStat(statsCol2, statY2, 'DURATION', `${durSec}s · ${props.result.wordsTyped}w`)

  // 8. Sparkline Chart Panel (y: 330 to 480)
  const chartX = 64
  const chartY = 328
  const chartW = W - 128
  const chartH = 150

  // Chart Frame Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(chartX, chartY, chartW, chartH, 16)
  ctx.fill()
  ctx.stroke()

  const series = props.result.series || []
  if (series.length >= 2) {
    const maxWpm = Math.max(...series.map(p => p.wpm), props.result.wpm * 1.1, 40)
    const minWpm = Math.max(0, Math.min(...series.map(p => p.wpm)) * 0.8)
    const range = Math.max(1, maxWpm - minWpm)

    const innerPadX = 36
    const innerPadY = 24
    const plotW = chartW - innerPadX * 2
    const plotH = chartH - innerPadY * 2
    const plotX = chartX + innerPadX
    const plotY = chartY + innerPadY

    // Draw Smooth Line
    ctx.beginPath()
    series.forEach((pt, idx) => {
      const px = plotX + (idx / (series.length - 1)) * plotW
      const py = plotY + plotH - ((pt.wpm - minWpm) / range) * plotH
      if (idx === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })

    // Stroke
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Fill under curve
    ctx.lineTo(plotX + plotW, plotY + plotH)
    ctx.lineTo(plotX, plotY + plotH)
    ctx.closePath()
    const chartGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH)
    chartGrad.addColorStop(0, 'rgba(250, 204, 21, 0.28)')
    chartGrad.addColorStop(1, 'rgba(250, 204, 21, 0.0)')
    ctx.fillStyle = chartGrad
    ctx.fill()

    // Error dots
    series.forEach((pt, idx) => {
      if (pt.errors > 0) {
        const px = plotX + (idx / (series.length - 1)) * plotW
        const py = plotY + plotH - ((pt.wpm - minWpm) / range) * plotH
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  // Character breakdown badges inside the chart panel (top left / top right)
  const { charsCorrect, charsIncorrect, charsExtra, charsMissed } = props.result
  const charsBreakdown = `✓ ${charsCorrect} correct   ✗ ${charsIncorrect} incorrect   + ${charsExtra} extra   - ${charsMissed} missed`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.font = '500 12px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(charsBreakdown, chartX + 24, chartY + 30)

  // 9. Footer: Typist & Verified Watermark
  const footerY = 540
  // Left: Typist Username + Rank/XP
  ctx.textAlign = 'left'
  const username = user.value?.username || user.value?.name || 'Guest Typist'
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 18px monospace'
  ctx.fillText(`@${username}`, 64, footerY + 12)

  let metaText = ''
  if (props.serverMeta?.level) {
    metaText += `Level ${props.serverMeta.level}`
  }
  if (props.serverMeta?.xpGained) {
    metaText += ` · +${props.serverMeta.xpGained} XP`
  }
  if (props.serverMeta?.ranks?.daily) {
    metaText += ` · Daily #${props.serverMeta.ranks.daily}`
  }
  if (metaText) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.85)'
    ctx.font = '600 13px monospace'
    ctx.fillText(metaText, 64, footerY + 34)
  }

  // Right: Dynamic Logo Mark & Dynamic Domain Watermark
  const rightX = W - 64
  const footerMark = markImg || (logoImg && Math.abs(logoImg.naturalWidth - logoImg.naturalHeight) < 20 ? logoImg : null)

  ctx.font = 'bold 18px monospace'
  const brandWord = displayDomain.value
  const brandW = ctx.measureText(brandWord).width

  if (footerMark && footerMark.naturalWidth && footerMark.naturalHeight) {
    const markS = 22
    const markX = rightX - brandW - markS - 10
    const markY = footerY - 5

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(markX, markY, markS, markS, 6)
    ctx.clip()
    ctx.drawImage(footerMark, markX, markY, markS, markS)
    ctx.restore()

    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#facc15'
    ctx.fillText(brandWord, rightX, footerY + 12)
  } else {
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#facc15'
    ctx.fillText('⚡ ' + brandWord, rightX, footerY + 12)
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = '500 12px monospace'
  ctx.fillText('Anti-Cheat Verified Score', rightX, footerY + 32)

  // Save data URL for image preview
  try {
    previewDataUrl.value = canvas.toDataURL('image/png')
  } catch (err) {
    console.error('Failed to export canvas to data URL:', err)
  }
}

// 1. Download Card Image
function downloadImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  downloading.value = true
  try {
    const a = document.createElement('a')
    a.download = `tachy-${Math.round(props.result.wpm)}wpm-${props.result.config.mode}.png`
    a.href = canvas.toDataURL('image/png')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Stats card image downloaded!')
  } catch {
    toast.error('Failed to download image.')
  } finally {
    downloading.value = false
  }
}

// 2. Copy Image to Clipboard
async function copyImageToClipboard() {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    canvas.toBlob(async blob => {
      if (!blob) {
        toast.error('Failed to generate image blob.')
        return
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        copiedImage.value = true
        toast.success('Image copied! You can paste it directly into Discord, WhatsApp, or X.')
        setTimeout(() => { copiedImage.value = false }, 3000)
      } catch {
        // Fallback: trigger download if clipboard blob not supported by browser
        downloadImage()
        toast.info('Direct image paste is not supported on this browser. Image downloaded instead!')
      }
    }, 'image/png')
  } catch {
    downloadImage()
  }
}

// 3. Copy Share Link
async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copiedLink.value = true
    toast.success('Verified score link copied to clipboard!')
    setTimeout(() => { copiedLink.value = false }, 3000)
  } catch {
    toast.error('Could not copy link.')
  }
}

// 4. Copy Formatted Text Card
async function copyScoreText() {
  const r = props.result
  const text = [
    `⚡ Tachy Typing Test`,
    `🏆 ${Math.round(r.wpm)} WPM · ${r.accuracy.toFixed(1)}% Accuracy`,
    `📊 Raw: ${Math.round(r.rawWpm)} WPM · Consistency: ${Math.round(r.consistency)}%`,
    `⏱️ ${modeLabel.value} (${langLabel.value})`,
    `🔗 ${shareUrl.value}`,
  ].join('\n')

  try {
    await navigator.clipboard.writeText(text)
    copiedText.value = true
    toast.success('Score summary copied to clipboard!')
    setTimeout(() => { copiedText.value = false }, 3000)
  } catch {
    toast.error('Could not copy score text.')
  }
}

// 5. Social Share Openers
function shareTo(platform: 'twitter' | 'threads' | 'whatsapp' | 'telegram' | 'discord' | 'bluesky' | 'reddit' | 'linkedin' | 'facebook' | 'line') {
  const url = encodeURIComponent(shareUrl.value)
  const rawText = shareText.value
  const text = encodeURIComponent(rawText)

  if (platform === 'discord') {
    const discordText = [
      `⚡ **Tachy Speed Typing Result**`,
      `🏆 **${Math.round(props.result.wpm)} WPM** · **${props.result.accuracy.toFixed(1)}% Accuracy**`,
      `📊 Raw: ${Math.round(props.result.rawWpm)} WPM · Consistency: ${Math.round(props.result.consistency)}%`,
      `⏱️ ${modeLabel.value} (${langLabel.value})`,
      `🔗 ${shareUrl.value}`,
    ].join('\n')
    navigator.clipboard?.writeText(discordText)
    toast.success('Formatted Discord markdown copied! Paste directly into Discord.')
    return
  }

  let shareLink = ''
  switch (platform) {
    case 'twitter':
      shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=Tachy,TypingSpeed,TypingTest`
      break
    case 'threads':
      shareLink = `https://threads.net/intent/post?text=${encodeURIComponent(rawText + ' ' + shareUrl.value)}`
      break
    case 'whatsapp':
      shareLink = `https://api.whatsapp.com/send?text=${text}%20${url}`
      break
    case 'telegram':
      shareLink = `https://t.me/share/url?url=${url}&text=${text}`
      break
    case 'bluesky':
      shareLink = `https://bsky.app/intent/compose?text=${encodeURIComponent(rawText + ' ' + shareUrl.value)}`
      break
    case 'reddit':
      shareLink = `https://reddit.com/submit?url=${url}&title=${text}`
      break
    case 'linkedin':
      shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
      break
    case 'facebook':
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`
      break
    case 'line':
      shareLink = `https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`
      break
  }

  if (shareLink && import.meta.client) {
    window.open(shareLink, '_blank', 'noopener,noreferrer,width=650,height=520')
  }
}

watch(
  () => props.modelValue,
  open => {
    if (open) {
      setTimeout(() => renderCard(), 60)
    }
  },
  { immediate: true }
)

watch(
  [brand, siteConfig],
  () => {
    if (props.modelValue) {
      renderCard()
    }
  },
  { deep: true }
)

onMounted(() => {
  if (props.modelValue) renderCard()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto"
        @click.self="close"
      >
        <div class="relative z-10 flex max-h-[95vh] w-full max-w-2xl flex-col rounded-3xl border border-base-300/80 bg-base-100 p-0 shadow-2xl overflow-hidden font-sans">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-base-300 bg-base-200/50 px-6 py-4">
            <div class="flex items-center gap-2.5">
              <div class="rounded-xl bg-primary/15 p-2 text-primary">
                <Sparkles class="size-5" />
              </div>
              <div>
                <h3 class="text-base font-bold text-base-content flex items-center gap-2">
                  <span>Share Your Score</span>
                  <span class="badge badge-primary badge-xs font-mono font-bold">{{ Math.round(result.wpm) }} WPM</span>
                </h3>
                <p class="text-xs text-base-content/50 font-mono">
                  Verified stats card & instant social sharing
                </p>
              </div>
            </div>

            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
              aria-label="Close share modal"
              @click="close"
            >
              <X class="size-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-base-100">
            <!-- Hidden Canvas for crisp 1200x630 rendering -->
            <canvas ref="canvasRef" class="hidden" />

            <!-- Visual Stats Card Preview -->
            <div class="group relative overflow-hidden rounded-2xl border border-base-300/80 bg-base-300/30 p-1 shadow-lg">
              <img
                v-if="previewDataUrl"
                :src="previewDataUrl"
                alt="Tachy Score Card"
                class="w-full h-auto rounded-xl object-contain shadow-xs transition-transform duration-200"
              >
              <div v-else class="flex h-56 items-center justify-center font-mono text-xs text-base-content/40">
                <span class="loading loading-spinner loading-md text-primary mr-2" />
                Generating high-res stats card…
              </div>

              <!-- Overlay Badge -->
              <div class="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-mono font-semibold text-white/80 backdrop-blur-md">
                1200 × 630 HD Card
              </div>
            </div>

            <!-- Primary Actions: Download & Copy Image -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
              <button
                type="button"
                class="btn btn-primary btn-sm gap-2 font-bold shadow-xs"
                :disabled="!previewDataUrl || downloading"
                @click="downloadImage"
              >
                <Download class="size-4" />
                <span>{{ downloading ? 'Saving…' : 'Download Card (PNG)' }}</span>
              </button>

              <button
                type="button"
                class="btn btn-neutral btn-sm gap-2 font-semibold border border-base-300 hover:border-primary/50"
                :disabled="!previewDataUrl"
                @click="copyImageToClipboard"
              >
                <Check v-if="copiedImage" class="size-4 text-success" />
                <ImageIcon v-else class="size-4" />
                <span>{{ copiedImage ? 'Copied to Clipboard!' : 'Copy Image to Clipboard' }}</span>
              </button>
            </div>

            <!-- Secondary Actions: Copy Link & Copy Text -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
              <button
                type="button"
                class="btn btn-ghost btn-sm gap-2 border border-base-300 hover:bg-base-200"
                @click="copyLink"
              >
                <Check v-if="copiedLink" class="size-4 text-success" />
                <Link2 v-else class="size-4" />
                <span>{{ copiedLink ? 'Link Copied!' : 'Copy Verified Link' }}</span>
              </button>

              <button
                type="button"
                class="btn btn-ghost btn-sm gap-2 border border-base-300 hover:bg-base-200"
                @click="copyScoreText"
              >
                <Check v-if="copiedText" class="size-4 text-success" />
                <FileText v-else class="size-4" />
                <span>{{ copiedText ? 'Text Summary Copied!' : 'Copy Text Card' }}</span>
              </button>
            </div>

            <!-- 1-Click Social Media Sharing Section -->
            <div class="rounded-2xl border border-base-300 bg-base-200/40 p-4 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-mono uppercase tracking-wider text-base-content/50 font-semibold">
                  Share Directly to Social Media
                </p>
                <span class="text-[10px] font-mono text-base-content/40">10 Platforms</span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <!-- X / Twitter -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-neutral hover:text-white hover:border-neutral transition-all group"
                  title="Share on X"
                  @click="shareTo('twitter')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">X (Twitter)</span>
                </button>

                <!-- Threads -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#101010] hover:text-white hover:border-[#333] transition-all group"
                  title="Share on Threads"
                  @click="shareTo('threads')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 192 192">
                    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4384 44.7443 97.3155 44.7443 97.1932 44.745C75.2536 44.745 57.8761 58.7459 57.8761 87.8451C57.8761 116.944 75.2536 130.945 97.1932 130.945C114.735 130.945 127.464 121.258 132.844 105.748L114.887 99.4587C111.97 107.574 104.381 113.109 97.1932 113.109C82.8806 113.109 74.4533 103.385 74.4533 87.8451C74.4533 72.3054 82.8806 62.5813 97.1932 62.5813C108.973 62.5813 118.067 69.5711 119.988 84.1481C110.871 85.8078 100.865 89.2678 94.2709 95.8614C86.7441 103.388 84.2882 112.551 87.3917 121.03C90.4952 129.509 98.7183 135.034 108.877 135.034C121.849 135.034 133.09 126.331 137.155 113.333C142.235 123.957 151.729 128.531 163.639 128.531C179.521 128.531 192 116.592 192 98.8105C192 56.4025 155.133 26 97.1932 26C47.881 26 12 58.7459 12 116.944C12 175.142 47.881 207.888 97.1932 207.888C137.896 207.888 170.832 187.351 179.178 148.918L161.42 144.593C155.074 172.935 129.623 189.96 97.1932 189.96C60.2798 189.96 29.8761 162.779 29.8761 116.944C29.8761 71.1091 60.2798 43.928 97.1932 43.928C143.743 43.928 174.124 67.5735 174.124 98.8105C174.124 107.574 167.925 112.723 158.824 112.723C150.841 112.723 144.912 107.728 141.537 88.9883ZM103.882 118.237C99.8824 118.237 96.9412 115.648 95.8824 111.412C94.8235 107.176 96.1176 102.706 99.4118 99.4118C103.882 94.9412 111.882 92.2353 118.941 90.9412C117.882 108.471 111.882 118.237 103.882 118.237Z"/>
                  </svg>
                  <span class="text-[10px] font-mono font-medium">Threads</span>
                </button>

                <!-- WhatsApp -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all group"
                  title="Share on WhatsApp"
                  @click="shareTo('whatsapp')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">WhatsApp</span>
                </button>

                <!-- Telegram -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#229ED9] hover:text-white hover:border-[#229ED9] transition-all group"
                  title="Share on Telegram"
                  @click="shareTo('telegram')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.944z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">Telegram</span>
                </button>

                <!-- Discord -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] transition-all group"
                  title="Copy Discord Markdown Card"
                  @click="shareTo('discord')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">Discord</span>
                </button>

                <!-- Bluesky -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#0285FF] hover:text-white hover:border-[#0285FF] transition-all group"
                  title="Share on Bluesky"
                  @click="shareTo('bluesky')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 568 501">
                    <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.25 122.392-172.246-30.82-185.733-70.528C274.113 422.5 221.117 575.712 101.867 453.32c-63.111-64.76-33.889-129.52 80.986-149.07-65.72 11.185-139.6-7.295-159.875-79.748C17.145 203.66 7.2 75.293 7.2 57.947 7.2-28.906 83.334-1.61 123.121 33.664Z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">Bluesky</span>
                </button>

                <!-- Reddit -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#FF4500] hover:text-white hover:border-[#FF4500] transition-all group"
                  title="Share on Reddit"
                  @click="shareTo('reddit')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">Reddit</span>
                </button>

                <!-- LinkedIn -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all group"
                  title="Share on LinkedIn"
                  @click="shareTo('linkedin')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">LinkedIn</span>
                </button>

                <!-- Facebook -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all group"
                  title="Share on Facebook"
                  @click="shareTo('facebook')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">Facebook</span>
                </button>

                <!-- LINE -->
                <button
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2.5 hover:bg-[#06C755] hover:text-white hover:border-[#06C755] transition-all group"
                  title="Share on LINE"
                  @click="shareTo('line')"
                >
                  <svg class="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.578.39.082.923.256 1.057.591.12.304.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.018 14.593 24 12.569 24 10.304z" />
                  </svg>
                  <span class="text-[10px] font-mono font-medium">LINE</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between border-t border-base-300 bg-base-200/40 px-6 py-3.5 text-xs font-mono text-base-content/50">
            <span class="truncate">Verified URL: <strong class="text-primary">{{ shareUrl }}</strong></span>
            <button type="button" class="btn btn-ghost btn-xs font-semibold" @click="close">Done</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
