<script setup>
import { ref, watch } from 'vue'
import {
  loginUser,
  registerUser,
  requestEmailVerificationOtp,
  verifyEmailOtp,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  currentUser
} from '../lib/authService'
import { playMascotChime } from '../lib/soundEffects'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Target,
  Accessibility,
  Gamepad2,
  ArrowRight,
  Send,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck
} from '@lucide/vue'
import DoodleOrnament from './DoodleOrnament.vue'

const props = defineProps({
  initialTab: { type: String, default: 'login' },
  noticeMessage: { type: String, default: '' }
})

const emit = defineEmits(['authenticated', 'backToHome'])

const tab = ref(props.initialTab || 'login')
const email = ref('')
const password = ref('')
const name = ref('')
const role = ref('user')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const showPassword = ref(false)

// Reset Password States
const resetNewPassword = ref('')
const resetConfirmPassword = ref('')
const showResetPasswordToggle = ref(false)

watch(() => props.initialTab, (val) => {
  if (val) tab.value = val
})

const switchTab = (t) => {
  tab.value = t
  errorMessage.value = ''
  successMessage.value = ''
}

// OTP Verification States
const otpDigits = ref(['', '', '', '', '', ''])
const resendTimer = ref(60)
let timerInterval = null

const startResendTimer = () => {
  resendTimer.value = 60
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (resendTimer.value > 0) {
      resendTimer.value--
    } else {
      clearInterval(timerInterval)
    }
  }, 1000)
}

const handleDigitInput = (index, event) => {
  const val = event.target.value.replace(/[^0-9]/g, '')
  otpDigits.value[index] = val ? val.slice(-1) : ''

  if (val && index < 5) {
    const inputs = event.target.form?.querySelectorAll('input[type="text"]') || event.target.parentElement?.querySelectorAll('input')
    if (inputs && inputs[index + 1]) {
      inputs[index + 1].focus()
    }
  }
}

const handleDigitKeyDown = (index, event) => {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    const inputs = event.target.parentElement?.querySelectorAll('input')
    if (inputs && inputs[index - 1]) {
      inputs[index - 1].focus()
    }
  }
}

const handleOtpPaste = (event) => {
  event.preventDefault()
  const pasted = (event.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '')
  if (pasted) {
    for (let i = 0; i < 6; i++) {
      otpDigits.value[i] = pasted[i] || ''
    }
  }
}

const handleLogin = async () => {
  errorMessage.value = ''
  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Email dan password wajib diisi.'
    return
  }
  isSubmitting.value = true
  try {
    const res = await loginUser(email.value, password.value)
    if (res.success) {
      emit('authenticated', res.user)
    } else {
      errorMessage.value = res.message || 'Login gagal. Silakan periksa kembali email dan password.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleRegister = async () => {
  errorMessage.value = ''
  if (!name.value.trim() || !email.value.trim() || !password.value) {
    errorMessage.value = 'Semua field wajib diisi.'
    return
  }
  if (password.value.length < 6) {
    errorMessage.value = 'Password minimal 6 karakter.'
    return
  }
  isSubmitting.value = true
  try {
    const res = await registerUser({
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value
    })
    if (res.success) {
      if (res.requiresOtp !== false) {
        tab.value = 'verify-otp'
        startResendTimer()
        successMessage.value = `Link verifikasi dan kode OTP 6-digit telah dikirimkan ke ${email.value}. Silakan cek email Anda.`
      } else {
        successMessage.value = 'Pendaftaran akun berhasil! Selamat datang di Inkluvia.'
        try { playMascotChime() } catch (e) {}
        setTimeout(() => {
          emit('authenticated', res.user || currentUser.value)
        }, 800)
      }
    } else {
      errorMessage.value = res.message || 'Pendaftaran gagal.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleVerifyOtp = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  const fullOtp = otpDigits.value.join('')

  if (fullOtp.length < 6) {
    errorMessage.value = 'Silakan masukkan 6 digit kode OTP verifikasi.'
    return
  }

  isSubmitting.value = true
  try {
    const res = verifyEmailOtp(email.value, fullOtp)
    if (res.success) {
      successMessage.value = 'Verifikasi email berhasil! Selamat datang di Inkluvia.'
      try { playMascotChime() } catch (e) {}
      setTimeout(() => {
        emit('authenticated', currentUser.value)
      }, 900)
    } else {
      errorMessage.value = res.message || 'Kode OTP yang Anda masukkan tidak valid.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleResendOtp = async () => {
  if (resendTimer.value > 0) return
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true
  try {
    const res = await requestEmailVerificationOtp(email.value, name.value)
    if (res.success) {
      successMessage.value = 'Kode OTP baru telah dikirimkan ke email Anda!'
      startResendTimer()
    } else {
      errorMessage.value = res.message || 'Gagal mengirim ulang kode OTP.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleRequestResetOtp = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value.trim()) {
    errorMessage.value = 'Silakan masukkan alamat email Anda.'
    return
  }

  isSubmitting.value = true
  try {
    const res = await requestPasswordResetOtp(email.value)
    if (res.success) {
      tab.value = 'reset-password-otp'
      startResendTimer()
      otpDigits.value = ['', '', '', '', '', '']
      successMessage.value = `Kode OTP reset kata sandi telah dikirimkan ke ${email.value}.`
    } else {
      errorMessage.value = res.message || 'Gagal mengirimkan kode OTP reset.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleResetPasswordWithOtp = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const fullOtp = otpDigits.value.join('')
  if (fullOtp.length < 6) {
    errorMessage.value = 'Silakan masukkan 6 digit kode OTP verifikasi.'
    return
  }
  if (!resetNewPassword.value || resetNewPassword.value.length < 6) {
    errorMessage.value = 'Kata sandi baru minimal 6 karakter.'
    return
  }
  if (resetNewPassword.value !== resetConfirmPassword.value) {
    errorMessage.value = 'Konfirmasi kata sandi baru tidak cocok.'
    return
  }

  isSubmitting.value = true
  try {
    const res = resetPasswordWithOtp({
      email: email.value,
      otpCode: fullOtp,
      newPassword: resetNewPassword.value
    })

    if (res.success) {
      password.value = resetNewPassword.value
      successMessage.value = 'Kata sandi berhasil diubah! Membuka halaman login...'
      try { playMascotChime() } catch (e) {}
      setTimeout(() => {
        switchTab('login')
      }, 1200)
    } else {
      errorMessage.value = res.message || 'Gagal mereset kata sandi.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center pt-24 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F0F7FF] via-[#EBF4FE] to-[#F5F9FF] relative overflow-hidden font-sans"
    style="background-image: radial-gradient(#d5e6f8 1.2px, transparent 1.2px); background-size: 28px 28px;"
  >
    <!-- Dynamic Glowing Backdrop Blobs -->
    <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FFDC58]/20 blur-[100px] pointer-events-none animate-pulse-subtle"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#3DA5FF]/20 blur-[100px] pointer-events-none animate-pulse-subtle" style="animation-delay: 1.5s;"></div>
    <div class="absolute top-1/3 right-10 w-72 h-72 rounded-full bg-[#FF74BC]/15 blur-[90px] pointer-events-none"></div>

    <!-- Authentic Floating Doodles Around Auth Card -->
    <div class="absolute top-12 left-12 pointer-events-none select-none hidden sm:block -rotate-12 animate-float-slow">
      <DoodleOrnament name="star-outline" color="#FFDC58" :size="44" />
    </div>
    <div class="absolute top-16 right-16 pointer-events-none select-none hidden sm:block rotate-12 animate-float-medium">
      <DoodleOrnament name="arrow-loop" color="#3DA5FF" :size="50" />
    </div>
    <div class="absolute bottom-12 left-16 pointer-events-none select-none hidden md:block">
      <DoodleOrnament name="squiggle" color="#FF7315" :size="68" />
    </div>
    <div class="absolute bottom-14 right-16 pointer-events-none select-none hidden sm:block rotate-6 animate-pulse-subtle">
      <DoodleOrnament name="heart-outline" color="#FF74BC" :size="38" />
    </div>
    <div class="absolute top-1/2 left-8 pointer-events-none select-none hidden xl:block animate-float-slow">
      <DoodleOrnament name="dots-duo" :size="44" />
    </div>

    <!-- Main Card Shell -->
    <div class="w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[36px] border border-slate-100/90 shadow-2xl shadow-blue-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 animate-soft-pop">
      
      <!-- ================= SISI KIRI: BRANDING & HIGHLIGHT (Desktop) ================= -->
      <div
        class="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 text-white relative overflow-hidden"
        style="background: linear-gradient(150deg, #0B2545 0%, #0F3261 45%, #195293 80%, #3587CE 100%);"
      >
        <!-- Decorative Ambient Light Gradients -->
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#FF7315]/20 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#3DA5FF]/30 blur-3xl pointer-events-none"></div>
        <div class="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-[#FFDC58]/10 blur-2xl pointer-events-none"></div>

        <!-- Geometric Pattern Overlay -->
        <div class="absolute inset-0 opacity-5 pointer-events-none" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"></div>

        <!-- Top Header & Navigation -->
        <div class="relative z-10 space-y-7">
          <div>
            <button
              @click="emit('backToHome')"
              class="inline-flex items-center gap-2 text-xs font-bold text-white/85 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 rounded-full transition-all duration-200 backdrop-blur-md cursor-pointer group shadow-sm active:scale-95"
            >
              <ArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Beranda
            </button>
          </div>

          <div class="space-y-3 pt-1">
            <div class="flex items-center gap-3.5">
              <div class="p-2 bg-white rounded-2xl shadow-lg shadow-black/10 ring-2 ring-white/30">
                <img src="/Logo.png" alt="Inkluvia" class="h-8 w-auto" />
              </div>
              <div>
                <span class="text-2xl font-black tracking-tight text-white block">Inkluvia</span>
                <span class="text-[10px] font-extrabold uppercase tracking-widest text-[#FFDC58] block -mt-0.5">Edukasi Adaptif</span>
              </div>
            </div>
            <p class="text-xs text-blue-100/90 leading-relaxed font-medium">
              Platform media pembelajaran adaptif & inklusif yang ramah untuk seluruh anak Indonesia.
            </p>
          </div>
        </div>

        <!-- Middle: 3 Pillars Cards -->
        <div class="relative z-10 my-6 space-y-3.5">
          <!-- Pillar 1 -->
          <div class="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8C38] to-[#FF7315] flex items-center justify-center shrink-0 shadow-md text-white group-hover:scale-105 transition-transform">
              <Target class="w-5 h-5 text-white" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white group-hover:text-[#FFDC58] transition-colors">Pembelajaran Adaptif</h4>
              <p class="text-[11px] text-blue-100/90 leading-snug">Menyesuaikan ritme & pemahaman siswa secara fleksibel.</p>
            </div>
          </div>

          <!-- Pillar 2 -->
          <div class="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3DA5FF] to-[#3587CE] flex items-center justify-center shrink-0 shadow-md text-white group-hover:scale-105 transition-transform">
              <Accessibility class="w-5 h-5 text-white" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white group-hover:text-[#FFDC58] transition-colors">Ramah & Inklusif</h4>
              <p class="text-[11px] text-blue-100/90 leading-snug">Dirancang untuk keragaman gaya dan kebutuhan belajar.</p>
            </div>
          </div>

          <!-- Pillar 3 -->
          <div class="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF74BC] to-[#E1529C] flex items-center justify-center shrink-0 shadow-md text-white group-hover:scale-105 transition-transform">
              <Gamepad2 class="w-5 h-5 text-white" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white group-hover:text-[#FFDC58] transition-colors">Eksperimen Interaktif</h4>
              <p class="text-[11px] text-blue-100/90 leading-snug">Visualisasi dan simulasi ceria yang mudah dipahami.</p>
            </div>
          </div>
        </div>

        <!-- Bottom Footer Quote -->
        <div class="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-100/80 font-medium">
          <span>&copy; 2026 Inkluvia Edukasi</span>
          <span class="flex items-center gap-1.5 font-bold text-[#FFDC58] bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <Sparkles class="w-3.5 h-3.5" /> Akses Lengkap
          </span>
        </div>
      </div>

      <!-- ================= SISI KANAN: FORM AUTHENTICATION ================= -->
      <div class="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
        
        <!-- Mobile Header: Back Button -->
        <div class="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <button
            @click="emit('backToHome')"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0F3261] transition cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4" />
            Kembali ke Beranda
          </button>
          <div class="flex items-center gap-2">
            <img src="/Logo.png" alt="Inkluvia" class="h-6 w-auto" />
            <span class="font-extrabold text-[#0F3261] text-sm">Inkluvia</span>
          </div>
        </div>

        <!-- Header Titles -->
        <div class="text-left space-y-2 mb-6">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#3587CE] text-[11px] font-bold">
            <Sparkles class="w-3 h-3 text-[#FF7315]" />
            <span>{{ tab === 'login' ? 'Selamat Datang Kembali 👋' : (tab === 'verify-otp' ? 'Verifikasi Keamanan' : (tab === 'forgot-password' || tab === 'reset-password-otp' ? 'Pemulihan Akun' : 'Bergabung Bersama Kami 🚀')) }}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-[#0F3261] tracking-tight">
            {{ tab === 'login' ? 'Masuk ke Akunmu' : (tab === 'verify-otp' ? 'Verifikasi Email' : (tab === 'forgot-password' || tab === 'reset-password-otp' ? 'Reset Kata Sandi' : 'Buat Akun Inkluvia')) }}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            {{ tab === 'login'
              ? 'Silakan masuk untuk melanjutkan penjelajahan materi pembelajaran.'
              : (tab === 'verify-otp' ? `Masukkan 6 digit kode OTP yang dikirimkan ke ${email}.` : (tab === 'forgot-password' || tab === 'reset-password-otp' ? 'Masukkan kode OTP dan kata sandi baru untuk akun Anda.' : 'Daftar sekarang untuk membuka akses penuh ke seluruh modul & fitur adaptif.')) }}
          </p>
        </div>

        <!-- Segmented Tab Switcher -->
        <div class="flex p-1.5 bg-slate-100/80 rounded-2xl mb-6 border border-slate-200/50 shadow-inner">
          <button
            type="button"
            @click="switchTab('login')"
            :class="[
              'flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2',
              tab === 'login'
                ? 'bg-white text-[#0F3261] shadow-md shadow-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            ]"
          >
            <LogIn class="w-4 h-4" :class="tab === 'login' ? 'text-[#FF7315]' : 'text-slate-400'" />
            Masuk
          </button>
          <button
            type="button"
            @click="switchTab('register')"
            :class="[
              'flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2',
              tab === 'register'
                ? 'bg-white text-[#0F3261] shadow-md shadow-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            ]"
          >
            <UserPlus class="w-4 h-4" :class="tab === 'register' ? 'text-[#3587CE]' : 'text-slate-400'" />
            Daftar Akun Baru
          </button>
        </div>

        <!-- Access Restriction Notice -->
        <div
          v-if="noticeMessage"
          class="mb-5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-3 shadow-sm"
        >
          <div class="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
            <Lock class="w-4 h-4" />
          </div>
          <div class="flex-1 text-left">
            <span class="block font-extrabold text-amber-800 text-[10px] uppercase tracking-wider mb-0.5">Akses Dibatasi</span>
            <p class="leading-relaxed font-semibold text-amber-950">{{ noticeMessage }}</p>
          </div>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="mb-4 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm text-left shadow-sm animate-shake"
        >
          <AlertCircle class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span class="font-medium leading-snug">{{ errorMessage }}</span>
        </div>

        <!-- Success Alert -->
        <div
          v-if="successMessage"
          class="mb-4 flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm text-left shadow-sm animate-soft-pop"
        >
          <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span class="font-semibold leading-snug">{{ successMessage }}</span>
        </div>

        <!-- ================= FORM LOGIN ================= -->
        <form v-if="tab === 'login'" @submit.prevent="handleLogin" class="space-y-4 text-left">
          <!-- Email Field -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Email</label>
            <div class="relative group">
              <Mail class="w-4 h-4 text-slate-400 group-focus-within:text-[#3DA5FF] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="nama@email.com"
                class="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/15 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Password</label>
              <button
                type="button"
                @click="switchTab('forgot-password')"
                class="text-xs font-bold text-[#3587CE] hover:text-[#0F3261] transition cursor-pointer hover:underline"
              >
                Lupa Password?
              </button>
            </div>
            <div class="relative group">
              <Lock class="w-4 h-4 text-slate-400 group-focus-within:text-[#3DA5FF] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/15 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer mt-3 flex items-center justify-center gap-2 group shadow-lg"
            style="background: linear-gradient(135deg, #FF7315 0%, #E86105 100%); box-shadow: 0 6px 20px rgba(255, 115, 21, 0.35);"
          >
            <span>{{ isSubmitting ? 'Memproses...' : 'Masuk Sekarang' }}</span>
            <ArrowRight v-if="!isSubmitting" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <!-- Register Prompt Footer -->
          <p class="text-center text-xs text-slate-500 font-medium pt-2">
            Belum punya akun?
            <button type="button" @click="switchTab('register')" class="text-[#3587CE] font-bold hover:text-[#0F3261] hover:underline cursor-pointer ml-1">
              Daftar di sini
            </button>
          </p>
        </form>

        <!-- ================= FORM REGISTER ================= -->
        <form v-else-if="tab === 'register'" @submit.prevent="handleRegister" class="space-y-4 text-left">
          <!-- Nama Lengkap -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
            <div class="relative group">
              <User class="w-4 h-4 text-slate-400 group-focus-within:text-[#3DA5FF] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                v-model="name"
                required
                placeholder="Nama kamu"
                class="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/15 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Email</label>
            <div class="relative group">
              <Mail class="w-4 h-4 text-slate-400 group-focus-within:text-[#3DA5FF] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="email@contoh.com"
                class="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/15 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Password</label>
            <div class="relative group">
              <Lock class="w-4 h-4 text-slate-400 group-focus-within:text-[#3DA5FF] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Min. 6 karakter"
                class="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/15 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[11px] text-slate-400 font-medium pl-1">Minimal 6 karakter kombinasi angka & huruf</p>
          </div>

          <!-- Role Selection -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Peran Akun</label>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                @click="role = 'user'"
                :class="[
                  'py-3 px-3.5 rounded-2xl border-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2',
                  role === 'user'
                    ? 'border-[#3DA5FF] bg-blue-50/80 text-[#3587CE] shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                ]"
              >
                <span>👤 Pengguna</span>
              </button>
              <button
                type="button"
                @click="role = 'admin'"
                :class="[
                  'py-3 px-3.5 rounded-2xl border-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2',
                  role === 'admin'
                    ? 'border-[#FF7315] bg-orange-50/80 text-[#FF7315] shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                ]"
              >
                <span>🛡️ Administrator</span>
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer mt-3 flex items-center justify-center gap-2 group shadow-lg"
            style="background: linear-gradient(135deg, #0F3261 0%, #195293 100%); box-shadow: 0 6px 20px rgba(15, 50, 97, 0.30);"
          >
            <span>{{ isSubmitting ? 'Membuat Akun...' : 'Daftar Sekarang' }}</span>
            <ArrowRight v-if="!isSubmitting" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <!-- Login Prompt Footer -->
          <p class="text-center text-xs text-slate-500 font-medium pt-2">
            Sudah punya akun?
            <button type="button" @click="switchTab('login')" class="text-[#3587CE] font-bold hover:text-[#0F3261] hover:underline cursor-pointer ml-1">
              Masuk di sini
            </button>
          </p>
        </form>

        <!-- ================= VERIFIKASI LINK EMAIL ================= -->
        <div v-else-if="tab === 'verify-otp'" class="space-y-6 text-center pt-2">
          <div class="w-20 h-20 rounded-3xl bg-blue-50 border-2 border-blue-200 text-[#3DA5FF] flex items-center justify-center mx-auto text-4xl shadow-inner">
            📩
          </div>

          <div class="space-y-2">
            <h3 class="text-xl font-black text-[#0F3261]">
              Cek Email Verifikasi Anda
            </h3>
            <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
              Link konfirmasi verifikasi email telah dikirimkan ke <strong class="text-[#0F3261] font-black">{{ email }}</strong>.
            </p>
            <p class="text-xs text-blue-900 bg-blue-50/90 p-4 rounded-2xl border border-blue-200 text-left font-medium leading-relaxed">
              👉 <em>Buka kotak masuk / folder spam email Anda dan klik <strong>Link Konfirmasi</strong> dari Supabase untuk mengaktifkan akun Anda.</em>
            </p>
          </div>

          <button
            @click="() => { emit('authenticated', currentUser); }"
            class="w-full py-4 rounded-2xl font-extrabold text-sm text-white transition active:scale-[0.98] cursor-pointer shadow-lg flex items-center justify-center gap-2"
            style="background: linear-gradient(135deg, #FF7315 0%, #E86105 100%); box-shadow: 0 6px 20px rgba(255, 115, 21, 0.35);"
          >
            <span>Masuk ke Beranda Akun</span>
            <CheckCircle2 class="w-4 h-4" />
          </button>

          <div class="text-xs font-semibold text-slate-500 pt-2 flex items-center justify-between">
            <button
              type="button"
              @click="handleResendOtp"
              :disabled="resendTimer > 0 || isSubmitting"
              class="font-black text-[#3587CE] hover:underline cursor-pointer disabled:opacity-50"
            >
              {{ resendTimer > 0 ? `Kirim Ulang Link (${resendTimer}s)` : 'Kirim Ulang Link Verifikasi' }}
            </button>
            <button
              type="button"
              @click="switchTab('login')"
              class="text-slate-400 hover:text-slate-600 underline text-xs cursor-pointer font-bold"
            >
              Kembali ke Login
            </button>
          </div>
        </div>

        <!-- ================= FORM LUPA PASSWORD (REQUEST OTP) ================= -->
        <div v-else-if="tab === 'forgot-password'" class="space-y-5 text-left">
          <div class="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-slate-600 font-medium leading-relaxed flex items-start gap-3">
            <KeyRound class="w-5 h-5 text-[#3587CE] shrink-0 mt-0.5" />
            <div>
              Masukkan alamat email terdaftar akun Anda. Kami akan mengirimkan 6 digit kode OTP verifikasi untuk mereset kata sandi Anda.
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Alamat Email Terdaftar</label>
            <div class="relative group">
              <Mail class="w-4 h-4 text-slate-400 group-focus-within:text-[#3DA5FF] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="nama@email.com"
                class="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/15 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300"
              />
            </div>
          </div>

          <button
            @click="handleRequestResetOtp"
            :disabled="isSubmitting || !email.trim()"
            class="w-full py-4 rounded-2xl font-extrabold text-sm text-white transition active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-lg flex items-center justify-center gap-2"
            style="background: linear-gradient(135deg, #FF7315 0%, #E86105 100%); box-shadow: 0 6px 20px rgba(255, 115, 21, 0.35);"
          >
            <span>{{ isSubmitting ? 'Mengirim OTP...' : 'Kirim Kode OTP Reset' }}</span>
            <Send class="w-4 h-4" />
          </button>

          <p class="text-center text-xs text-slate-500 font-medium pt-1">
            Kembali ke
            <button type="button" @click="switchTab('login')" class="text-[#3587CE] font-bold hover:underline cursor-pointer ml-1">
              Halaman Log In
            </button>
          </p>
        </div>

        <!-- ================= FORM RESET PASSWORD ================= -->
        <div v-else-if="tab === 'reset-password-otp'" class="space-y-4 text-left">
          <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-3">
            <ShieldCheck class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              Masukkan 6 digit kode OTP yang dikirim ke <strong class="text-amber-950 font-black">{{ email }}</strong> dan buat kata sandi baru.
            </div>
          </div>

          <!-- 6 Digit OTP Input -->
          <div class="space-y-2 text-center">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-left">Kode OTP 6-Digit</label>
            <div class="flex items-center justify-center gap-2" @paste="handleOtpPaste">
              <input
                v-for="(digit, idx) in otpDigits"
                :key="idx"
                v-model="otpDigits[idx]"
                type="text"
                maxlength="1"
                inputmode="numeric"
                pattern="[0-9]*"
                @input="handleDigitInput(idx, $event)"
                @keydown="handleDigitKeyDown(idx, $event)"
                class="w-11 h-13 text-center text-xl font-black text-[#0F3261] bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/20 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          <!-- Password Baru -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Kata Sandi Baru</label>
            <div class="relative group">
              <Lock class="w-4 h-4 text-slate-400 group-focus-within:text-[#3DA5FF] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                v-model="resetNewPassword"
                :type="showResetPasswordToggle ? 'text' : 'password'"
                required
                placeholder="Minimal 6 karakter"
                class="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/15 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300"
              />
              <button
                type="button"
                @click="showResetPasswordToggle = !showResetPasswordToggle"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <component :is="showResetPasswordToggle ? EyeOff : Eye" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Konfirmasi Password Baru -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Konfirmasi Kata Sandi Baru</label>
            <div class="relative group">
              <Lock class="w-4 h-4 text-slate-400 group-focus-within:text-[#3DA5FF] absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                v-model="resetConfirmPassword"
                :type="showResetPasswordToggle ? 'text' : 'password'"
                required
                placeholder="Ulangi kata sandi baru"
                class="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#3DA5FF] focus:ring-4 focus:ring-[#3DA5FF]/15 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300"
              />
            </div>
          </div>

          <button
            @click="handleResetPasswordWithOtp"
            :disabled="isSubmitting || otpDigits.join('').length < 6 || !resetNewPassword"
            class="w-full py-4 rounded-2xl font-extrabold text-sm text-white transition active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-2"
            style="background: linear-gradient(135deg, #0F3261 0%, #195293 100%); box-shadow: 0 6px 20px rgba(15, 50, 97, 0.30);"
          >
            <span>{{ isSubmitting ? 'Menyimpan Password...' : 'Simpan Password Baru' }}</span>
            <CheckCircle2 v-if="!isSubmitting" class="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
