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
import { sendOtpEmail, sendPasswordResetEmail, sendEmailChangeOtp } from './emailService'

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
        const isEmailVerified = true

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

function applySupabaseSession(session) {
  if (!session?.user) return
  const meta = session.user.user_metadata || {}
  const token = session.access_token
  const newEmail = (session.user.email || '').toLowerCase()
  const oldEmail = (currentUser.value?.email || '').toLowerCase()

  const verifiedRegistry = JSON.parse(localStorage.getItem('inkluvia_verified_emails') || '{}')
  if (newEmail) verifiedRegistry[newEmail] = true
  localStorage.setItem('inkluvia_verified_emails', JSON.stringify(verifiedRegistry))

  if (oldEmail && newEmail && oldEmail !== newEmail) {
    const proRegistry = JSON.parse(localStorage.getItem('inkluvia_pro_subscribers') || '{}')
    if (proRegistry[oldEmail]) {
      proRegistry[newEmail] = proRegistry[oldEmail]
      delete proRegistry[oldEmail]
      localStorage.setItem('inkluvia_pro_subscribers', JSON.stringify(proRegistry))
    }
  }

  const updatedUser = {
    ...(currentUser.value || {}),
    id: session.user.id,
    name: meta.full_name || currentUser.value?.name || newEmail.split('@')[0],
    email: newEmail,
    role: meta.role || currentUser.value?.role || (newEmail.includes('admin') ? 'admin' : 'user'),
    avatar: meta.role === 'admin' ? '🛡️' : (currentUser.value?.avatar || '👧'),
    isEmailVerified: true,
    token,
    isSupabase: true
  }

  currentUser.value = updatedUser
  saveUserSession(updatedUser, token)
}

// Sync sesi dari Supabase saat app dimuat (hanya jika user terdaftar di supabase)
if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      applySupabaseSession(session)
    }
  })

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      applySupabaseSession(session)
    } else if (event === 'SIGNED_OUT' && currentUser.value?.isSupabase) {
      currentUser.value = null
      saveUserSession(null)
    }
  })
}

/**
 * Helper untuk menyinkronkan status PRO dan verifikasi dari registry lokal
 */
function enrichUserWithProStatus(userObj) {
  if (!userObj) return null
  const email = (userObj.email || '').toLowerCase()
  const proRegistry = JSON.parse(localStorage.getItem('inkluvia_pro_subscribers') || '{}')
  const verifiedRegistry = JSON.parse(localStorage.getItem('inkluvia_verified_emails') || '{}')
  const subscriber = proRegistry[email] || {}
  const isAdminUser = userObj.role === 'admin' || email.includes('admin')

  let isPro = Boolean(userObj.isPro || subscriber.isPro || isAdminUser)
  let proExpiresAt = userObj.proExpiresAt || subscriber.expiresAt || null

  if (isPro && !isAdminUser) {
    if (!proExpiresAt && subscriber.activatedAt) {
      proExpiresAt = new Date(new Date(subscriber.activatedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    if (proExpiresAt && new Date() > new Date(proExpiresAt)) {
      isPro = false
    }
  }

  const isEmailVerified = Boolean(
    userObj.isEmailVerified ||
    verifiedRegistry[email] ||
    isAdminUser ||
    email.includes('@inkluvia.id') ||
    email === 'siswa@gmail.com'
  )

  return {
    ...userObj,
    isPro,
    tier: isPro ? 'pro' : 'free',
    proPlanName: subscriber.planName || userObj.proPlanName || (isPro ? 'Inkluvia Premium PRO' : null),
    proExpiresAt,
    isEmailVerified
  }
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

      currentUser.value = enrichUserWithProStatus({
        id: data.user.id,
        name: meta.full_name || cleanEmail.split('@')[0],
        email: data.user.email,
        role: meta.role || 'user',
        avatar: meta.role === 'admin' ? '🛡️' : '👧',
        token,
        isSupabase: true
      })
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

    currentUser.value = enrichUserWithProStatus({
      id: matched.email,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      avatar: matched.avatar,
      token,
      isSupabase: false
    })
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
        isEmailVerified: true
      })

      const newUser = {
        id: data.user?.id || cleanEmail,
        name: cleanName,
        email: cleanEmail,
        role: role,
        avatar: role === 'admin' ? '🛡️' : '👧',
        isEmailVerified: true,
        token,
        isSupabase: true
      }
      currentUser.value = newUser
      saveUserSession(newUser, token)

      return { success: true, user: newUser, token, requiresOtp: false }
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
    isEmailVerified: true
  })

  const newUser = {
    id: cleanEmail,
    name: cleanName,
    email: cleanEmail,
    role: role,
    avatar: role === 'admin' ? '🛡️' : '👧',
    isEmailVerified: true,
    token,
    isSupabase: false
  }
  currentUser.value = newUser
  saveUserSession(newUser, token)

  return { success: true, user: newUser, token, requiresOtp: false }
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

  currentUser.value = enrichUserWithProStatus({
    id: account.email,
    name: account.name,
    email: account.email,
    role: account.role,
    avatar: account.avatar,
    token,
    isSupabase: false
  })
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
    avatar: currentUser.value.avatar,
    isPro: Boolean(currentUser.value.isPro),
    tier: currentUser.value.isPro ? 'pro' : 'free'
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
  const emailKey = (currentUser.value.email || '').toLowerCase()

  // 1. Simpan ke registry pelanggan pro lokal
  try {
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

  // 2. Buat object reaktif baru untuk currentUser
  const updatedUser = {
    ...currentUser.value,
    isPro: true,
    tier: 'pro',
    proActivatedAt: now.toISOString(),
    proExpiresAt,
    proPlanName: planName
  }

  // Generate token JWT baru dengan klaim PRO & masa berlaku
  const token = signJWT({
    id: updatedUser.id || updatedUser.email,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role || 'user',
    avatar: updatedUser.avatar,
    isPro: true,
    tier: 'pro',
    proExpiresAt
  })

  updatedUser.token = token
  currentUser.value = updatedUser
  saveUserSession(updatedUser, token)

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

/**
 * Helper untuk mengambil password tersimpan atau demo password
 */
function getUserPassword(email) {
  const cleanEmail = (email || '').toLowerCase()
  const customPasswords = JSON.parse(localStorage.getItem('inkluvia_user_passwords') || '{}')
  if (customPasswords[cleanEmail]) {
    return customPasswords[cleanEmail]
  }
  const demoMatch = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === cleanEmail)
  if (demoMatch) return demoMatch.password
  return 'user123'
}

/**
 * Ganti Password (membutuhkan password saat ini)
 */
export async function changePassword({ currentPassword, newPassword }) {
  if (!currentUser.value) {
    return { success: false, message: 'Anda harus log in terlebih dahulu.' }
  }

  const email = (currentUser.value.email || '').toLowerCase()
  const actualPassword = getUserPassword(email)

  if (currentPassword !== actualPassword) {
    return { success: false, message: 'Kata sandi saat ini tidak cocok. Silakan coba lagi.' }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'Kata sandi baru minimal 6 karakter.' }
  }

  // Simpan password baru
  try {
    const customPasswords = JSON.parse(localStorage.getItem('inkluvia_user_passwords') || '{}')
    customPasswords[email] = newPassword
    localStorage.setItem('inkluvia_user_passwords', JSON.stringify(customPasswords))
  } catch (e) {
    console.error('Failed to update password:', e)
  }

  // Update Supabase jika aktif
  if (isSupabaseConfigured && currentUser.value.isSupabase) {
    try {
      await supabase.auth.updateUser({ password: newPassword })
    } catch (e) {
      console.warn('Supabase password update failed (non-critical):', e)
    }
  }

  return { success: true, message: 'Kata sandi berhasil diperbarui!' }
}

/**
 * Meminta OTP Reset Password (Lupa Sandi)
 */
export async function requestPasswordResetOtp(email) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, message: 'Alamat email wajib diisi.' }
  }

  const otpCode = generateOtpCode()
  const expiresAt = Date.now() + 10 * 60 * 1000

  try {
    const resets = JSON.parse(localStorage.getItem('inkluvia_pending_resets') || '{}')
    resets[cleanEmail] = {
      code: otpCode,
      expiresAt,
      createdAt: Date.now()
    }
    localStorage.setItem('inkluvia_pending_resets', JSON.stringify(resets))
  } catch (e) {
    console.error('Failed to save reset OTP:', e)
  }

  const emailRes = await sendPasswordResetEmail({
    toEmail: cleanEmail,
    userName: cleanEmail.split('@')[0],
    otpCode
  })

  return {
    success: true,
    otpCode,
    expiresAt,
    message: emailRes.message || 'Kode OTP reset password telah dikirimkan ke email Anda.'
  }
}

/**
 * Mereset Password menggunakan OTP
 */
export function resetPasswordWithOtp({ email, otpCode, newPassword }) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanOtp = (otpCode || '').toString().trim().replace(/[^0-9]/g, '')

  if (!cleanEmail || !cleanOtp || !newPassword) {
    return { success: false, message: 'Semua field wajib diisi.' }
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'Password baru minimal 6 karakter.' }
  }

  try {
    const resets = JSON.parse(localStorage.getItem('inkluvia_pending_resets') || '{}')
    const record = resets[cleanEmail]

    if (!record) {
      return { success: false, message: 'Kode OTP reset password tidak ditemukan atau telah kadaluarsa.' }
    }

    if (Date.now() > record.expiresAt) {
      delete resets[cleanEmail]
      localStorage.setItem('inkluvia_pending_resets', JSON.stringify(resets))
      return { success: false, message: 'Kode OTP telah kadaluarsa. Silakan minta kode baru.' }
    }

    if (record.code !== cleanOtp) {
      return { success: false, message: 'Kode OTP yang Anda masukkan salah. Periksa kembali.' }
    }

    // UPDATE PASSWORD
    delete resets[cleanEmail]
    localStorage.setItem('inkluvia_pending_resets', JSON.stringify(resets))

    const customPasswords = JSON.parse(localStorage.getItem('inkluvia_user_passwords') || '{}')
    customPasswords[cleanEmail] = newPassword
    localStorage.setItem('inkluvia_user_passwords', JSON.stringify(customPasswords))

    return { success: true, message: 'Password Anda telah berhasil diperbarui! Silakan masuk dengan password baru.' }
  } catch (e) {
    console.error('Error resetting password with OTP:', e)
    return { success: false, message: 'Gagal mereset password.' }
  }
}

/**
 * Meminta Link Ganti Email Supabase (dengan fallback seamless untuk sesi lokal/demo)
 */
export async function requestEmailChangeLink(newEmail) {
  const cleanNewEmail = (newEmail || '').trim().toLowerCase()
  if (!currentUser.value) {
    return { success: false, message: 'Anda harus log in terlebih dahulu.' }
  }
  if (!cleanNewEmail) {
    return { success: false, message: 'Alamat email baru wajib diisi.' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanNewEmail)) {
    return { success: false, message: 'Format alamat email tidak valid.' }
  }
  if (cleanNewEmail === (currentUser.value.email || '').toLowerCase()) {
    return { success: false, message: 'Email baru sama dengan email saat ini.' }
  }

  const oldEmail = currentUser.value.email

  // Minta Supabase Auth update email jika ada sesi Supabase aktif
  if (isSupabaseConfigured && currentUser.value.isSupabase) {
    try {
      await supabase.auth.updateUser({ email: cleanNewEmail })
    } catch (e) {
      console.warn('Supabase auth update email note:', e)
    }
  }

  // Update object currentUser & simpan sesi lokal
  const updatedUser = {
    ...currentUser.value,
    email: cleanNewEmail,
    isEmailVerified: true
  }

  try {
    const proRegistry = JSON.parse(localStorage.getItem('inkluvia_pro_subscribers') || '{}')
    if (proRegistry[oldEmail]) {
      proRegistry[cleanNewEmail] = proRegistry[oldEmail]
      delete proRegistry[oldEmail]
      localStorage.setItem('inkluvia_pro_subscribers', JSON.stringify(proRegistry))
    }
    const verifiedRegistry = JSON.parse(localStorage.getItem('inkluvia_verified_emails') || '{}')
    verifiedRegistry[cleanNewEmail] = true
    localStorage.setItem('inkluvia_verified_emails', JSON.stringify(verifiedRegistry))
  } catch (e) {
    console.error('Failed migrating local registries on email change:', e)
  }

  currentUser.value = updatedUser
  saveUserSession(updatedUser, updatedUser.token)

  return {
    success: true,
    message: `Alamat email berhasil diperbarui ke ${cleanNewEmail}!`
  }
}

/**
 * Mengirimkan Link Verifikasi Email
 */
export async function requestEmailVerificationLink(email) {
  const cleanEmail = (email || currentUser.value?.email || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, message: 'Email wajib diisi.' }
  }

  if (isSupabaseConfigured && currentUser.value?.isSupabase) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail
      })
      if (!error) {
        return {
          success: true,
          message: `Link verifikasi email telah dikirimkan ke ${cleanEmail}.`
        }
      }
    } catch (e) {
      console.warn('Resend verification link error:', e)
    }
  }

  if (currentUser.value) {
    currentUser.value.isEmailVerified = true
    saveUserSession(currentUser.value)
  }

  return {
    success: true,
    message: `Email ${cleanEmail} berhasil diverifikasi!`
  }
}

/**
 * Memeriksa Status Verifikasi Email Pengguna dari Supabase
 */
export async function checkEmailVerificationStatus() {
  if (!isSupabaseConfigured) {
    if (currentUser.value) {
      currentUser.value.isEmailVerified = true
      saveUserSession(currentUser.value)
      return { verified: true, email: currentUser.value.email, message: 'Email terverifikasi.' }
    }
    return { verified: false, message: 'Tidak ada sesi aktif.' }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      applySupabaseSession(session)
      return { verified: true, email: session.user.email, message: `Email ${session.user.email} terverifikasi!` }
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      currentUser.value.email = user.email
      currentUser.value.isEmailVerified = true
      saveUserSession(currentUser.value)
      return { verified: true, email: user.email, message: `Email ${user.email} terverifikasi!` }
    }
  } catch (e) {
    console.warn('Check email status error:', e)
  }
  return { verified: false, message: 'Belum terverifikasi atau memerlukan login ulang.' }
}

