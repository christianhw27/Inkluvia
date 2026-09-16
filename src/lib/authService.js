import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const AUTH_STORAGE_KEY = 'inkluvia_auth_session_v2'

// Demo Accounts — digunakan hanya jika Supabase belum dikonfigurasi
const DEMO_ACCOUNTS = [
  {
    email: 'admin@inkluvia.id',
    password: 'admin123',
    name: 'Admin Inkluvia',
    role: 'admin',
    avatar: '👨‍💼'
  },
  {
    email: 'siswa@gmail.com',
    password: 'siswa123',
    name: 'Dini',
    role: 'user',
    avatar: '👧'
  }
]

// Reactive Session State — mulai null (tidak login)
export const currentUser = ref(loadUserSession())

function loadUserSession() {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {
    console.error('Failed to load session:', e)
  }
  return null
}

function saveUserSession(user) {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch (e) {
    console.error('Failed to save session:', e)
  }
}

export const isAuthenticated = computed(() => Boolean(currentUser.value))
export const isAdmin = computed(() => currentUser.value?.role === 'admin')
export const isStudent = computed(() => currentUser.value?.role === 'user')

// Sync sesi dari Supabase saat app dimuat
if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      const meta = session.user.user_metadata || {}
      currentUser.value = {
        id: session.user.id,
        name: meta.full_name || session.user.email.split('@')[0],
        email: session.user.email,
        role: meta.role || 'user',
        avatar: meta.role === 'admin' ? '👨‍💼' : '👧'
      }
      saveUserSession(currentUser.value)
    }
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const meta = session.user.user_metadata || {}
      currentUser.value = {
        id: session.user.id,
        name: meta.full_name || session.user.email.split('@')[0],
        email: session.user.email,
        role: meta.role || 'user',
        avatar: meta.role === 'admin' ? '👨‍💼' : '👧'
      }
      saveUserSession(currentUser.value)
    } else {
      currentUser.value = null
      saveUserSession(null)
    }
  })
}

/**
 * Login dengan email & password
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
      currentUser.value = {
        id: data.user.id,
        name: meta.full_name || cleanEmail.split('@')[0],
        email: data.user.email,
        role: meta.role || 'user',
        avatar: meta.role === 'admin' ? '👨‍💼' : '👧'
      }
      saveUserSession(currentUser.value)
      return { success: true, user: currentUser.value }
    } catch (err) {
      // Jika bukan "invalid credentials" — tampilkan error
      if (!err.message?.includes('Invalid login credentials')) {
        return { success: false, message: err.message || 'Login gagal. Coba lagi.' }
      }
      // Lanjut ke cek demo accounts di bawah
    }
  }

  // 2. Fallback ke demo accounts
  const matched = DEMO_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === cleanEmail && acc.password === password
  )

  if (matched) {
    currentUser.value = {
      name: matched.name,
      email: matched.email,
      role: matched.role,
      avatar: matched.avatar
    }
    saveUserSession(currentUser.value)
    return { success: true, user: currentUser.value }
  }

  return {
    success: false,
    message: 'Email atau password salah. Periksa kembali dan coba lagi.'
  }
}

/**
 * Register akun baru
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

      const newUser = {
        id: data.user?.id,
        name: cleanName,
        email: cleanEmail,
        role: role,
        avatar: role === 'admin' ? '👨‍💼' : '👧'
      }
      currentUser.value = newUser
      saveUserSession(newUser)
      return { success: true, user: newUser }
    } catch (err) {
      return { success: false, message: err.message || 'Pendaftaran gagal. Coba lagi.' }
    }
  }

  // Fallback tanpa Supabase
  const newUser = {
    name: cleanName,
    email: cleanEmail,
    role: role,
    avatar: role === 'admin' ? '👨‍💼' : '👧'
  }
  currentUser.value = newUser
  saveUserSession(newUser)
  return { success: true, user: newUser }
}

/**
 * Logout
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
 * Quick Demo Login — hanya untuk development/demo
 * @param {'admin' | 'user'} role
 */
export function quickLogin(role = 'user') {
  const account = role === 'admin' ? DEMO_ACCOUNTS[0] : DEMO_ACCOUNTS[1]
  currentUser.value = {
    name: account.name,
    email: account.email,
    role: account.role,
    avatar: account.avatar
  }
  saveUserSession(currentUser.value)
  return currentUser.value
}
