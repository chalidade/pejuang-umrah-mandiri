// Pemasangan sebagai aplikasi (PWA). Event beforeinstallprompt bisa muncul sebelum
// komponen mana pun dipasang, jadi ditangkap sedini mungkin dan disimpan di sini.
import { Capacitor } from '@capacitor/core'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as InstallPromptEvent
  notify()
})
window.addEventListener('appinstalled', () => {
  deferred = null
  notify()
})

export const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const canPrompt = () => !!deferred

export async function promptInstall() {
  if (!deferred) return false
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  notify()
  return outcome === 'accepted'
}

export const isInstalled = () =>
  Capacitor.isNativePlatform() || window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export type Platform = 'ios' | 'android' | 'lain'
export function platform(): Platform {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'lain'
}

const KEY = 'pasang-ditutup'
export function dismissedRecently() {
  try {
    return Date.now() - Number(localStorage.getItem(KEY) ?? 0) < 14 * 86_400_000
  } catch {
    return false
  }
}
export function dismiss() {
  try {
    localStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* abaikan */
  }
}
