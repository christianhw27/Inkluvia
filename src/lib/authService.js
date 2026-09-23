import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import {
  signJWT,
  verifyJWT,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  JWT_STORAGE_KEY
} from './jwtHelper'

const LEGACY_STORAGE_KEY = 'inkluvia_auth_session_v2'

// Demo Accounts — 2 Peran Utama: Pengguna dan Administrator
const DEMO_ACCOUNTS = [
  {
    email: 'admin@inkluvia.id',
    password: 'admin123',
    name: 'Admin Inkluvia',
    role: 'admin',
    avatar: '🛡️'
  },
  {
    email: 'user@inkluvia.id',
    password: 'user123',
    name: 'Pengguna Inkluvia',
    role: 'user',
    avatar: '👤'
  },
  {
    email: 'siswa@gmail.com',
    password: 'siswa123',
    name: 'Dini',
    role: 'user',
    avatar: '👧'
  }
]

// Reactive Session State — load from JWT token
export const currentUser = ref(loadUserSession())

/**
 * Memuat sesi pengguna berdasarkan JWT token yang tersimpan di localStorage
 */
function loadUserSession() {
  try {
    const token = getStoredToken()
    if (token) {
      const { valid, payload, error } = verifyJWT(token)
      if (valid && payload) {
        const meta = payload.user_metadata || {}
        return {
          id: payload.sub || payload.id || payload.email,
          name: payload.name || meta.full_name || payload.email?.split('@')[0],
          email: payload.email,
          role: payload.role || meta.role || (payload.email?.includes('admin') ? 'admin' : 'user'),
          avatar: payload.avatar || (payload.role === 'admin' ? '🛡️' : '👧'),
          token,
          isSupabase: Boolean(payload.iss && payload.iss.includes('supabase'))
        }
      } else {
        console.warn('JWT token invalid or expired:', error)
        removeStoredToken()
      }
    }

    // Fallback migrasi jika ada sesi lama yang belum berformat JWT
    const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacySaved) {
      const legacyUser = JSON.parse(legacySaved)
      if (legacyUser && legacyUser.email) {
        const upgradedToken = signJWT({
          id: legacyUser.id || legacyUser.email,
          name: legacyUser.name,
          email: legacyUser.email,
          role: legacyUser.role || 'user',
          avatar: legacyUser.avatar
        })
        setStoredToken(upgradedToken)
        return {
          ...legacyUser,
          token: upgradedToken
        }
      }
    }
  } catch (e) {
    console.error('Failed to load JWT session:', e)
  }
  return null
}

/**
 * Menyimpan sesi pengguna dan JWT token
 */
function saveUserSession(user, token = null) {
  try {
    if (user) {
      // Jika token belum ada, buat JWT baru
      const jwtToken = token || user.token || signJWT({
        id: user.id || user.email,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        avatar: user.avatar
      })

      user.token = jwtToken
      setStoredToken(jwtToken)
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(user))
    } else {
      removeStoredToken()
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
  } catch (e) {
    console.error('Failed to save session:', e)
  }
}

export const isAuthenticated = computed(() => Boolean(currentUser.value && currentUser.value.token))
export const isAdmin = computed(() => currentUser.value?.role === 'admin')
export const isStudent = computed(() => currentUser.value?.role === 'user')
export const currentToken = computed(() => currentUser.value?.token || getStoredToken())

/**
 * Helper untuk mengambil token JWT yang aktif
 */
export function getAuthToken() {
  return currentUser.value?.token || getStoredToken()
}

// Sync sesi dari Supabase saat app dimuat (hanya jika user terdaftar di supabase)
if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      const meta = session.user.user_metadata || {}
      const token = session.access_token
      currentUser.value = {
        id: session.user.id,
        name: meta.full_name || session.user.email.split('@')[0],
        email: session.user.email,
        role: meta.role || 'user',
        avatar: meta.role === 'admin' ? '🛡️' : '👧',
        token,
        isSupabase: true
      }
      saveUserSession(currentUser.value, token)
    }
  })

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const meta = session.user.user_metadata || {}
      const token = session.access_token
      currentUser.value = {
        id: session.user.id,
        name: meta.full_name || session.user.email.split('@')[0],
        email: session.user.email,
        role: meta.role || 'user',
        avatar: meta.role === 'admin' ? '🛡️' : '👧',
        token,
        isSupabase: true
      }
      saveUserSession(currentUser.value, token)
    } else if (event === 'SIGNED_OUT' && currentUser.value?.isSupabase) {
      // Hanya bersihkan jika pengguna secara eksplisit menekan logout dari akun Supabase
      currentUser.value = null
      saveUserSession(null)
    }
  })
}

/**
 * Login dengan email & password menggunakan autentikasi JWT
 * Prioritas: (1) Supabase Auth → (2) Demo accounts
 */
export async function loginUser(email, password) {
  const cleanEmail = email.trim().toLowerCase()

  // 1. Coba via Supabase Auth dulu
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      })
      if (error) throw error

      const meta = data.user.user_metadata || {}
      const token = data.session?.access_token || signJWT({
        id: data.user.id,
        name: meta.full_name || cleanEmail.split('@')[0],
        email: data.user.email,
        role: meta.role || 'user',
        avatar: meta.role === 'admin' ? '🛡️' : '👧'
      })

      currentUser.value = {
        id: data.user.id,
        name: meta.full_name || cleanEmail.split('@')[0],
        email: data.user.email,
        role: meta.role || 'user',
        avatar: meta.role === 'admin' ? '🛡️' : '👧',
        token,
        isSupabase: true
      }
      saveUserSession(currentUser.value, token)
      return { success: true, user: currentUser.value, token }
    } catch (err) {
      if (!err.message?.includes('Invalid login credentials')) {
        console.warn('Supabase login check:', err.message)
      }
    }
  }

  // 2. Fallback ke Demo Accounts dengan token JWT
  const matched = DEMO_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === cleanEmail && acc.password === password
  )

  if (matched) {
    const token = signJWT({
      id: matched.email,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      avatar: matched.avatar
    })

    currentUser.value = {
      id: matched.email,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      avatar: matched.avatar,
      token,
      isSupabase: false
    }
    saveUserSession(currentUser.value, token)
    return { success: true, user: currentUser.value, token }
  }

  return {
    success: false,
    message: 'Email atau password salah. Periksa kembali dan coba lagi.'
  }
}

/**
 * Register akun baru dengan penerbitan token JWT
 */
export async function registerUser({ name, email, password, role = 'user' }) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: role
          }
        }
      })
      if (error) throw error

      const token = data.session?.access_token || signJWT({
        id: data.user?.id || cleanEmail,
        name: cleanName,
        email: cleanEmail,
        role: role,
        avatar: role === 'admin' ? '🛡️' : '👧'
      })

      const newUser = {
        id: data.user?.id || cleanEmail,
        name: cleanName,
        email: cleanEmail,
        role: role,
        avatar: role === 'admin' ? '🛡️' : '👧',
        token,
        isSupabase: true
      }
      currentUser.value = newUser
      saveUserSession(newUser, token)
      return { success: true, user: newUser, token }
    } catch (err) {
      return { success: false, message: err.message || 'Pendaftaran gagal. Coba lagi.' }
    }
  }

  // Fallback tanpa Supabase — buat token JWT langsung
  const token = signJWT({
    id: cleanEmail,
    name: cleanName,
    email: cleanEmail,
    role: role,
    avatar: role === 'admin' ? '🛡️' : '👧'
  })

  const newUser = {
    id: cleanEmail,
    name: cleanName,
    email: cleanEmail,
    role: role,
    avatar: role === 'admin' ? '🛡️' : '👧',
    token,
    isSupabase: false
  }
  currentUser.value = newUser
  saveUserSession(newUser, token)
  return { success: true, user: newUser, token }
}

/**
 * Logout & bersihkan JWT token dari localStorage
 */
export async function logoutUser() {
  currentUser.value = null
  saveUserSession(null)

  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Supabase signout failed (non-critical):', e)
    }
  }
}

/**
 * Quick Demo Login dengan token JWT
 * @param {'admin' | 'user'} role
 */
export function quickLogin(role = 'user') {
  const account = role === 'admin' ? DEMO_ACCOUNTS[0] : DEMO_ACCOUNTS[1]
  const token = signJWT({
    id: account.email,
    name: account.name,
    email: account.email,
    role: account.role,
    avatar: account.avatar
  })

  currentUser.value = {
    id: account.email,
    name: account.name,
    email: account.email,
    role: account.role,
    avatar: account.avatar,
    token,
    isSupabase: false
  }
  saveUserSession(currentUser.value, token)
  return currentUser.value
}

/**
 * Memperbarui data profil pengguna aktif (nama dan avatar)
 * dan memperbarui token JWT di sesi lokal
 */
export async function updateUserProfile({ name, avatar }) {
  if (!currentUser.value) return null

  if (name !== undefined && name.trim()) {
    currentUser.value.name = name.trim()
  }
  if (avatar !== undefined) {
    currentUser.value.avatar = avatar
  }

  // Generate token JWT baru dengan profil yang telah diperbarui
  const token = signJWT({
    id: currentUser.value.id || currentUser.value.email,
    name: currentUser.value.name,
    email: currentUser.value.email,
    role: currentUser.value.role || 'user',
    avatar: currentUser.value.avatar
  })

  currentUser.value.token = token
  saveUserSession(currentUser.value, token)

  // Sync demo accounts jika cocok
  const demoMatch = DEMO_ACCOUNTS.find(
    a => a.email.toLowerCase() === (currentUser.value.email || '').toLowerCase()
  )
  if (demoMatch) {
    if (name !== undefined && name.trim()) demoMatch.name = name.trim()
    if (avatar !== undefined) demoMatch.avatar = avatar
  }

  // Jika Supabase aktif, perbarui metadata di Supabase
  if (isSupabaseConfigured && currentUser.value.isSupabase) {
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: currentUser.value.name,
          avatar: currentUser.value.avatar
        }
      })
    } catch (e) {
      console.warn('Supabase profile metadata update failed (non-critical):', e)
    }
  }

  return currentUser.value
}

// Re-export JWT utilities for inspection / API client usage
export { signJWT, verifyJWT, getStoredToken, JWT_STORAGE_KEY }

