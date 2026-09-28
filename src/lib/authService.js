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
import { sendOtpEmail } from './emailService'

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
        const email = (payload.email || '').toLowerCase()
        const proRegistry = JSON.parse(localStorage.getItem('inkluvia_pro_subscribers') || '{}')
        const verifiedRegistry = JSON.parse(localStorage.getItem('inkluvia_verified_emails') || '{}')
        const subscriber = proRegistry[email] || {}
        const isAdminUser = payload.role === 'admin' || meta.role === 'admin' || email.includes('admin')
        
        let isPro = Boolean(payload.isPro || meta.is_pro || subscriber.isPro || isAdminUser)
        let proExpiresAt = subscriber.expiresAt || payload.proExpiresAt || meta.pro_expires_at || null
        const isEmailVerified = Boolean(
          payload.isEmailVerified ||
          meta.email_verified ||
          verifiedRegistry[email] ||
          isAdminUser ||
          email.includes('@inkluvia.id') ||
          email === 'siswa@gmail.com'
        )

        // Check or initialize expiration date for non-admin PRO users
        if (isPro && !isAdminUser) {
          if (!proExpiresAt) {
            const baseTime = subscriber.activatedAt ? new Date(subscriber.activatedAt).getTime() : Date.now()
            proExpiresAt = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString()
            subscriber.expiresAt = proExpiresAt
            subscriber.isPro = true
            proRegistry[email] = subscriber
            localStorage.setItem('inkluvia_pro_subscribers', JSON.stringify(proRegistry))
          }

          if (proExpiresAt && new Date() > new Date(proExpiresAt)) {
            isPro = false
            subscriber.isPro = false
            proRegistry[email] = subscriber
            localStorage.setItem('inkluvia_pro_subscribers', JSON.stringify(proRegistry))
          }
        }

        return {
          id: payload.sub || payload.id || payload.email,
          name: payload.name || meta.full_name || payload.email?.split('@')[0],
          email: payload.email,
          role: payload.role || meta.role || (email.includes('admin') ? 'admin' : 'user'),
          avatar: payload.avatar || (payload.role === 'admin' ? '🛡️' : '👧'),
          isPro,
          tier: isPro ? 'pro' : 'free',
          proPlanName: subscriber.planName || payload.proPlanName || (isPro ? 'Inkluvia Premium PRO' : null),
          proExpiresAt,
          isEmailVerified,
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
        const email = legacyUser.email.toLowerCase()
        const proRegistry = JSON.parse(localStorage.getItem('inkluvia_pro_subscribers') || '{}')
        const isPro = Boolean(legacyUser.isPro || proRegistry[email]?.isPro || legacyUser.role === 'admin' || email.includes('admin'))

        const upgradedToken = signJWT({
          id: legacyUser.id || legacyUser.email,
          name: legacyUser.name,
          email: legacyUser.email,
          role: legacyUser.role || 'user',
          avatar: legacyUser.avatar,
          isPro,
          tier: isPro ? 'pro' : 'free'
        })
        setStoredToken(upgradedToken)
        return {
          ...legacyUser,
          isPro,
          tier: isPro ? 'pro' : 'free',
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
        avatar: user.avatar,
        isPro: Boolean(user.isPro),
        tier: user.isPro ? 'pro' : 'free'
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
export const isProUser = computed(() => {
  if (!currentUser.value) return false
  if (currentUser.value.role === 'admin' || (currentUser.value.email || '').includes('admin')) return true
  const info = getProStatusInfo(currentUser.value)
  return info.isPro
})
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
        avatar: role === 'admin' ? '🛡️' : '👧',
        isEmailVerified: false
      })

      const newUser = {
        id: data.user?.id || cleanEmail,
        name: cleanName,
        email: cleanEmail,
        role: role,
        avatar: role === 'admin' ? '🛡️' : '👧',
        isEmailVerified: false,
        token,
        isSupabase: true
      }
      currentUser.value = newUser
      saveUserSession(newUser, token)

      // Kirim email OTP verifikasi
      await requestEmailVerificationOtp(cleanEmail, cleanName)

      return { success: true, user: newUser, token, requiresOtp: true }
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
    avatar: role === 'admin' ? '🛡️' : '👧',
    isEmailVerified: false
  })

  const newUser = {
    id: cleanEmail,
    name: cleanName,
    email: cleanEmail,
    role: role,
    avatar: role === 'admin' ? '🛡️' : '👧',
    isEmailVerified: false,
    token,
    isSupabase: false
  }
  currentUser.value = newUser
  saveUserSession(newUser, token)

  // Kirim email OTP verifikasi
  await requestEmailVerificationOtp(cleanEmail, cleanName)

  return { success: true, user: newUser, token, requiresOtp: true }
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

/**
 * Upgrade Pengguna Aktif ke Status Inkluvia Premium PRO
 * Setelah pembayaran Xendit Sandbox berhasil
 */
export async function upgradeCurrentUserToPro({
  planName = 'Inkluvia Premium PRO',
  invoiceId = '',
  paymentMethod = 'Xendit Sandbox',
  interval = 'bulan',
  durationDays = null
} = {}) {
  if (!currentUser.value) return null

  let days = durationDays
  if (!days) {
    const nameLower = planName.toLowerCase()
    if (interval === 'tahun' || nameLower.includes('tahun') || nameLower.includes('yearly') || nameLower.includes('annual')) {
      days = 365
    } else {
      days = 30
    }
  }

  const now = new Date()
  const expiresDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const proExpiresAt = expiresDate.toISOString()

  currentUser.value.isPro = true
  currentUser.value.tier = 'pro'
  currentUser.value.proActivatedAt = now.toISOString()
  currentUser.value.proExpiresAt = proExpiresAt
  currentUser.value.proPlanName = planName

  // Generate token JWT baru dengan klaim PRO & masa berlaku
  const token = signJWT({
    id: currentUser.value.id || currentUser.value.email,
    name: currentUser.value.name,
    email: currentUser.value.email,
    role: currentUser.value.role || 'user',
    avatar: currentUser.value.avatar,
    isPro: true,
    tier: 'pro',
    proExpiresAt
  })

  currentUser.value.token = token
  saveUserSession(currentUser.value, token)

  // Catat permanen di registry pelanggan pro lokal
  try {
    const emailKey = (currentUser.value.email || '').toLowerCase()
    const proRegistry = JSON.parse(localStorage.getItem('inkluvia_pro_subscribers') || '{}')
    proRegistry[emailKey] = {
      isPro: true,
      tier: 'pro',
      planName,
      invoiceId,
      paymentMethod,
      activatedAt: now.toISOString(),
      expiresAt: proExpiresAt
    }
    localStorage.setItem('inkluvia_pro_subscribers', JSON.stringify(proRegistry))
  } catch (e) {
    console.error('Failed to save to pro subscriber registry:', e)
  }

  // Jika Supabase aktif, perbarui metadata di Supabase
  if (isSupabaseConfigured && currentUser.value.isSupabase) {
    try {
      await supabase.auth.updateUser({
        data: {
          is_pro: true,
          tier: 'pro',
          pro_plan: planName,
          pro_invoice_id: invoiceId,
          pro_expires_at: proExpiresAt
        }
      })
    } catch (e) {
      console.warn('Supabase pro metadata update (non-critical):', e)
    }
  }

  return currentUser.value
}

/**
 * Helper untuk memformat tanggal ke Bahasa Indonesia (Contoh: 28 Oktober 2026)
 */
export function formatIndonesianDate(dateInput) {
  if (!dateInput) return '-'
  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return '-'
    const day = d.getDate()
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  } catch (e) {
    return '-'
  }
}

/**
 * Helper terpusat untuk mengambil status PRO & tanggal kadaluarsa pengguna
 */
export function getProStatusInfo(user = currentUser.value) {
  if (!user) {
    return { isPro: false, isExpired: false, label: 'Belum Log In', expiresText: '-', daysLeft: 0, expiresIso: null }
  }

  if (user.role === 'admin' || (user.email || '').includes('admin')) {
    return {
      isPro: true,
      isExpired: false,
      label: 'Akses Utama Administrator',
      expiresText: 'Akses Selamanya (Admin)',
      daysLeft: 9999,
      expiresIso: null
    }
  }

  const proRegistry = JSON.parse(localStorage.getItem('inkluvia_pro_subscribers') || '{}')
  const emailKey = (user.email || '').toLowerCase()
  const subscriber = proRegistry[emailKey] || {}
  let expIso = user.proExpiresAt || subscriber.expiresAt

  if (!expIso) {
    if (user.isPro) {
      // Inisialisasi default 30 hari jika belum tersimpan
      const defaultExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      user.proExpiresAt = defaultExp
      subscriber.expiresAt = defaultExp
      subscriber.isPro = true
      proRegistry[emailKey] = subscriber
      localStorage.setItem('inkluvia_pro_subscribers', JSON.stringify(proRegistry))

      return {
        isPro: true,
        isExpired: false,
        label: user.proPlanName || 'Inkluvia Premium PRO',
        expiresText: formatIndonesianDate(defaultExp),
        daysLeft: 30,
        expiresIso: defaultExp
      }
    }

    return {
      isPro: false,
      isExpired: false,
      label: 'Inkluvia Free Access',
      expiresText: '-',
      daysLeft: 0,
      expiresIso: null
    }
  }

  const expDate = new Date(expIso)
  const now = new Date()
  const diffMs = expDate.getTime() - now.getTime()
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  if (diffMs <= 0) {
    // MASA BERLANGGANAN EXPIRING / TELAH KADALUARSA
    user.isPro = false
    user.tier = 'free'
    subscriber.isPro = false
    proRegistry[emailKey] = subscriber
    localStorage.setItem('inkluvia_pro_subscribers', JSON.stringify(proRegistry))

    return {
      isPro: false,
      isExpired: true,
      label: 'Inkluvia Free Access',
      expiresText: formatIndonesianDate(expIso),
      daysLeft: 0,
      expiresIso: expIso
    }
  }

  return {
    isPro: true,
    isExpired: false,
    label: user.proPlanName || subscriber.planName || 'Inkluvia Premium PRO',
    expiresText: formatIndonesianDate(expIso),
    daysLeft: diffDays,
    expiresIso: expIso
  }
}

// Re-export JWT utilities for inspection / API client usage
export { signJWT, verifyJWT, getStoredToken, JWT_STORAGE_KEY }

/**
 * Membuat 6 digit kode OTP acak
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Meminta & mengirimkan kode OTP verifikasi 6-digit ke email
 */
export async function requestEmailVerificationOtp(email, name = '') {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, message: 'Alamat email wajib diisi.' }
  }

  const otpCode = generateOtpCode()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 menit

  try {
    const otps = JSON.parse(localStorage.getItem('inkluvia_pending_otps') || '{}')
    otps[cleanEmail] = {
      code: otpCode,
      expiresAt,
      name: name || cleanEmail.split('@')[0],
      createdAt: Date.now()
    }
    localStorage.setItem('inkluvia_pending_otps', JSON.stringify(otps))
  } catch (e) {
    console.error('Failed to save pending OTP:', e)
  }

  // Kirim email resmi via Resend API
  const emailRes = await sendOtpEmail({
    toEmail: cleanEmail,
    userName: name || cleanEmail.split('@')[0],
    otpCode
  })

  return {
    success: true,
    otpCode,
    expiresAt,
    message: emailRes.message || 'Kode OTP telah dikirimkan ke email Anda.'
  }
}

/**
 * Memverifikasi 6 digit kode OTP yang dimasukkan pengguna
 */
export function verifyEmailOtp(email, inputOtp) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanOtp = (inputOtp || '').toString().trim().replace(/[^0-9]/g, '')

  if (!cleanEmail || !cleanOtp) {
    return { success: false, message: 'Silakan masukkan 6 digit kode OTP.' }
  }

  try {
    const otps = JSON.parse(localStorage.getItem('inkluvia_pending_otps') || '{}')
    const record = otps[cleanEmail]

    if (!record) {
      return { success: false, message: 'Kode OTP tidak ditemukan atau telah kadaluarsa. Silakan klik kirim ulang.' }
    }

    if (Date.now() > record.expiresAt) {
      delete otps[cleanEmail]
      localStorage.setItem('inkluvia_pending_otps', JSON.stringify(otps))
      return { success: false, message: 'Kode OTP telah kadaluarsa (lebih dari 10 menit). Silakan minta kode baru.' }
    }

    if (record.code !== cleanOtp) {
      return { success: false, message: 'Kode OTP yang Anda masukkan salah. Periksa kembali dan coba lagi.' }
    }

    // VERIFIKASI BERHASIL! Hapus OTP pending & tandai email terverifikasi
    delete otps[cleanEmail]
    localStorage.setItem('inkluvia_pending_otps', JSON.stringify(otps))

    const verifiedRegistry = JSON.parse(localStorage.getItem('inkluvia_verified_emails') || '{}')
    verifiedRegistry[cleanEmail] = true
    localStorage.setItem('inkluvia_verified_emails', JSON.stringify(verifiedRegistry))

    if (currentUser.value && (currentUser.value.email || '').toLowerCase() === cleanEmail) {
      currentUser.value.isEmailVerified = true
      saveUserSession(currentUser.value)
    }

    return { success: true, message: 'Verifikasi email berhasil! Akun Anda aktif sepenuhnya.' }
  } catch (e) {
    console.error('Error verifying OTP:', e)
    return { success: false, message: 'Gagal memverifikasi kode OTP.' }
  }
}

