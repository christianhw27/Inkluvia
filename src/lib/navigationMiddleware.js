import { isAuthenticated, isAdmin } from './authService'

/**
 * Route Permission Definitions:
 * - 'beranda': Public (Bebas diakses tanpa login)
 * - 'materi', 'materi-detail', 'mode-select', 'learning-player', 'guru': Protected (Harus login/buat akun)
 * - 'admin': Restricted (Harus login dan role === 'admin')
 */
export const PUBLIC_ROUTES = ['beranda', 'auth']

export const PROTECTED_ROUTES = [
  'materi',
  'materi-detail',
  'mode-select',
  'learning-player',
  'guru'
]

export const ADMIN_ROUTES = ['admin']

/**
 * Navigation Middleware Guard
 * Memeriksa izin akses sebelum pengguna berpindah route/tab.
 * 
 * @param {string} targetRoute - Tab / rute yang ingin diakses
 * @returns {{ allowed: boolean, reason?: string, tab?: 'login' | 'register' }}
 */
export function canAccessRoute(targetRoute) {
  // 1. Admin Route Check
  if (ADMIN_ROUTES.includes(targetRoute)) {
    if (!isAuthenticated.value) {
      return {
        allowed: false,
        reason: 'Halaman Dashboard Admin memerlukan akses Administrator. Silakan masuk terlebih dahulu.',
        tab: 'login'
      }
    }
    if (!isAdmin.value) {
      return {
        allowed: false,
        reason: 'Akses ditolak: Akun Anda tidak memiliki izin Administrator.',
        tab: 'login'
      }
    }
    return { allowed: true }
  }

  // 2. Protected User Routes (Katalog Materi, Detail Materi, Player, Mode Belajar, Portal Guru)
  if (PROTECTED_ROUTES.includes(targetRoute)) {
    if (!isAuthenticated.value) {
      return {
        allowed: false,
        reason: 'Yuk masuk atau buat akun Inkluvia terlebih dahulu untuk mengakses materi dan fitur pembelajaran!',
        tab: 'login'
      }
    }
  }

  // 3. Public Route (Beranda, dsb)
  return { allowed: true }
}
