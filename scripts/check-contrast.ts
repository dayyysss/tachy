import { themes } from '../shared/config/themes'

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const num = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function luminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0]! * 0.2126 + a[1]! * 0.7152 + a[2]! * 0.0722
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(parseHex(hex1))
  const l2 = luminance(parseHex(hex2))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

let allPassed = true
console.log('Theme WCAG Contrast Check (target: >= 4.5:1 vs base):')

for (const theme of themes) {
  const primaryRatio = contrastRatio(theme.colors.primary, theme.colors.base)
  const ok = primaryRatio >= 4.5
  const status = ok ? 'PASS' : 'WARN'
  console.log(`[${status}] ${theme.label.padEnd(14)} primary vs base: ${primaryRatio.toFixed(2)}:1`)
  if (!ok && theme.recommended) {
    allPassed = false
    console.error(`  Error: recommended theme ${theme.id} failed contrast requirement!`)
  }
}

if (!allPassed) process.exit(1)
console.log('Contrast check complete.')
