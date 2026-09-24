<script setup>
import { ref, watch } from 'vue'
import { loginUser, registerUser } from '../lib/authService'
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
  ArrowRight
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
const showDemoHint = ref(false)

watch(() => props.initialTab, (val) => {
  if (val) tab.value = val
})

const switchTab = (t) => {
  tab.value = t
  errorMessage.value = ''
  successMessage.value = ''
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
      emit('authenticated', res.user)
    } else {
      errorMessage.value = res.message || 'Pendaftaran gagal.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const fillDemo = (demoEmail, demoPass) => {
  email.value = demoEmail
  password.value = demoPass
  showDemoHint.value = false
}
</script>

<template>
  <div
    class="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#F4F8FD] relative overflow-hidden"
    style="background-image: radial-gradient(#d3e5fa 1.2px, transparent 1.2px); background-size: 30px 30px;"
  >
    <!-- Background Ambient Glow Blobs -->
    <div class="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#FFDC58]/15 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#3DA5FF]/15 blur-3xl pointer-events-none"></div>

    <!-- Authentic Floating Doodles Around Auth Card -->
    <div class="absolute top-10 left-10 pointer-events-none select-none hidden sm:block -rotate-12 animate-bounce-subtle">
      <DoodleOrnament name="star-outline" color="#FFDC58" :size="42" />
    </div>
    <div class="absolute top-12 right-12 pointer-events-none select-none hidden sm:block rotate-12 animate-float-slow">
      <DoodleOrnament name="arrow-loop" color="#3DA5FF" :size="48" />
    </div>
    <div class="absolute bottom-10 left-12 pointer-events-none select-none hidden md:block">
      <DoodleOrnament name="squiggle" color="#FF7315" :size="65" />
    </div>
    <div class="absolute bottom-12 right-12 pointer-events-none select-none hidden sm:block rotate-6 animate-pulse-subtle">
      <DoodleOrnament name="heart-outline" color="#FF74BC" :size="36" />
    </div>
    <div class="absolute top-1/2 left-6 pointer-events-none select-none hidden xl:block animate-float-medium">
      <DoodleOrnament name="dots-duo" :size="42" />
    </div>

    <div class="w-full max-w-5xl bg-white rounded-3xl sm:rounded-[36px] border border-slate-100 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
      
      <!-- ================= SISI KIRI: BRANDING & HIGHLIGHT (Desktop) ================= -->
      <div
        class="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 text-white relative overflow-hidden"
        style="background: linear-gradient(145deg, #0F3261 0%, #174b88 55%, #3587CE 100%);"
      >
        <!-- Background Ornaments -->
        <div class="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#FF7315]/15 blur-2xl pointer-events-none"></div>
        <div class="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#3DA5FF]/20 blur-2xl pointer-events-none"></div>

        <!-- Top: Logo & Back -->
        <div class="relative z-10 space-y-6">
          <button
            @click="emit('backToHome')"
            class="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full transition backdrop-blur-sm cursor-pointer"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            Kembali ke Beranda
          </button>

          <div class="space-y-3 pt-2">
            <div class="flex items-center gap-3">
              <img src="/Logo.png" alt="Inkluvia" class="h-10 w-auto bg-white rounded-xl p-1 shadow-sm" />
              <span class="text-2xl font-extrabold tracking-tight">Inkluvia</span>
            </div>
            <p class="text-xs text-blue-100/90 leading-relaxed">
              Platform media pembelajaran adaptif & inklusif yang ramah untuk seluruh anak Indonesia.
            </p>
          </div>
        </div>

        <!-- Middle: 3 Pillars Highlight -->
        <div class="relative z-10 my-8 space-y-3">
          <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div class="w-9 h-9 rounded-xl bg-[#FFEFE6] flex items-center justify-center shrink-0">
              <Target class="w-5 h-5 text-[#FF7315]" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white">Pembelajaran Adaptif</h4>
              <p class="text-[11px] text-blue-100 leading-snug">Menyesuaikan ritme & pemahaman siswa secara fleksibel.</p>
            </div>
          </div>

          <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div class="w-9 h-9 rounded-xl bg-[#EAF3FD] flex items-center justify-center shrink-0">
              <Accessibility class="w-5 h-5 text-[#3587CE]" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white">Ramah & Inklusif</h4>
              <p class="text-[11px] text-blue-100 leading-snug">Dirancang untuk keragaman gaya dan kebutuhan belajar.</p>
            </div>
          </div>

          <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div class="w-9 h-9 rounded-xl bg-[#F3EBF7] flex items-center justify-center shrink-0">
              <Gamepad2 class="w-5 h-5 text-[#E1529C]" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white">Eksperimen Interaktif</h4>
              <p class="text-[11px] text-blue-100 leading-snug">Visualisasi dan simulasi ceria yang mudah dipahami.</p>
            </div>
          </div>
        </div>

        <!-- Bottom Banner Quote -->
        <div class="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-100">
          <span>&copy; 2026 Inkluvia Edukasi</span>
          <span class="flex items-center gap-1 font-bold text-amber-300">
            <Sparkles class="w-3.5 h-3.5" /> Akses Lengkap
          </span>
        </div>
      </div>

      <!-- ================= SISI KANAN: FORM LOGIN & REGISTER ================= -->
      <div class="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
        
        <!-- Mobile: Back Button -->
        <div class="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <button
            @click="emit('backToHome')"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0F3261] cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4" />
            Kembali ke Beranda
          </button>
          <div class="flex items-center gap-2">
            <img src="/Logo.png" alt="Inkluvia" class="h-6 w-auto" />
            <span class="font-extrabold text-[#0F3261] text-sm">Inkluvia</span>
          </div>
        </div>

        <!-- Form Header -->
        <div class="text-left space-y-1.5 mb-6">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F3261] tracking-tight">
            {{ tab === 'login' ? 'Masuk ke Akunmu' : 'Buat Akun Inkluvia' }}
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 font-medium">
            {{ tab === 'login'
              ? 'Silakan masuk untuk melanjutkan penjelajahan materi pembelajaran.'
              : 'Daftar sekarang untuk membuka akses penuh ke seluruh modul & fitur adaptif.' }}
          </p>
        </div>

        <!-- Tab Switcher -->
        <div class="flex p-1 bg-slate-100 rounded-2xl mb-5 shadow-inner">
          <button
            type="button"
            @click="switchTab('login')"
            :class="[
              'flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer',
              tab === 'login'
                ? 'bg-white text-[#0F3261] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            ]"
          >
            Masuk
          </button>
          <button
            type="button"
            @click="switchTab('register')"
            :class="[
              'flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer',
              tab === 'register'
                ? 'bg-white text-[#0F3261] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            ]"
          >
            Daftar Akun Baru
          </button>
        </div>

        <!-- Middleware Access Notice Banner -->
        <div
          v-if="noticeMessage"
          class="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs"
        >
          <div class="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
            <Lock class="w-3.5 h-3.5" />
          </div>
          <div class="flex-1 text-left">
            <span class="block font-bold text-amber-800 text-[10px] uppercase tracking-wider mb-0.5">Akses Dibatasi</span>
            <p class="leading-relaxed font-medium text-amber-950">{{ noticeMessage }}</p>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs sm:text-sm text-left"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Success Message -->
        <div
          v-if="successMessage"
          class="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm text-left"
        >
          <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- ================= FORM LOGIN ================= -->
        <form v-if="tab === 'login'" @submit.prevent="handleLogin" class="space-y-4 text-left">
          <!-- Email -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="email@contoh.com"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 focus:outline-none text-sm text-slate-800 transition"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 focus:outline-none text-sm text-slate-800 transition"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3.5 rounded-xl font-bold text-sm text-white transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-2"
            style="background: linear-gradient(135deg, #FF7315 0%, #e86105 100%); box-shadow: 0 4px 16px rgba(255,115,21,0.35);"
          >
            <span>{{ isSubmitting ? 'Memproses...' : 'Masuk Sekarang' }}</span>
            <ArrowRight v-if="!isSubmitting" class="w-4 h-4" />
          </button>

          <!-- Toggle hint to Register -->
          <p class="text-center text-xs text-slate-500 pt-1">
            Belum punya akun?
            <button type="button" @click="switchTab('register')" class="text-[#3587CE] font-bold hover:underline cursor-pointer ml-1">
              Daftar di sini
            </button>
          </p>

          <!-- Demo Account Box -->
          <div class="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="showDemoHint = !showDemoHint"
              class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition cursor-pointer border border-slate-200/60"
            >
              <span class="flex items-center gap-2">
                <span>🔑</span>
                Gunakan Akun Demo Cepat
              </span>
              <ChevronDown :class="['w-3.5 h-3.5 transition-transform duration-200', showDemoHint ? 'rotate-180' : '']" />
            </button>

            <div v-if="showDemoHint" class="mt-2 space-y-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <button
                type="button"
                @click="fillDemo('admin@inkluvia.id', 'admin123')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 transition text-left cursor-pointer group"
              >
                <div>
                  <p class="text-xs font-bold text-[#0F3261] group-hover:text-[#FF7315]">🛡️ Akun Administrator</p>
                  <p class="text-[11px] text-slate-500 font-mono">admin@inkluvia.id &bull; admin123</p>
                </div>
                <span class="text-[10px] font-bold text-[#FF7315] bg-orange-100 px-2 py-0.5 rounded-full">Pilih</span>
              </button>

              <button
                type="button"
                @click="fillDemo('user@inkluvia.id', 'user123')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition text-left cursor-pointer group"
              >
                <div>
                  <p class="text-xs font-bold text-[#0F3261] group-hover:text-[#3587CE]">👤 Akun Pengguna</p>
                  <p class="text-[11px] text-slate-500 font-mono">user@inkluvia.id &bull; user123</p>
                </div>
                <span class="text-[10px] font-bold text-[#3587CE] bg-blue-100 px-2 py-0.5 rounded-full">Pilih</span>
              </button>
            </div>
          </div>
        </form>

        <!-- ================= FORM REGISTER ================= -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4 text-left">
          <!-- Nama Lengkap -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide">Nama Lengkap</label>
            <div class="relative">
              <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="name"
                required
                placeholder="Nama kamu"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 focus:outline-none text-sm text-slate-800 transition"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="email@contoh.com"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 focus:outline-none text-sm text-slate-800 transition"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Min. 6 karakter"
                class="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 focus:outline-none text-sm text-slate-800 transition"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[11px] text-slate-400 pl-1">Minimal 6 karakter kombinasi angka & huruf</p>
          </div>

          <!-- Role Selection -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide">Peran Akun</label>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                @click="role = 'user'"
                :class="[
                  'py-2.5 px-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2',
                  role === 'user'
                    ? 'border-[#3DA5FF] bg-blue-50 text-[#3587CE] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                ]"
              >
                👤 Pengguna
              </button>
              <button
                type="button"
                @click="role = 'admin'"
                :class="[
                  'py-2.5 px-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2',
                  role === 'admin'
                    ? 'border-[#FF7315] bg-orange-50 text-[#FF7315] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                ]"
              >
                🛡️ Administrator
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3.5 rounded-xl font-bold text-sm text-white transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-2"
            style="background: linear-gradient(135deg, #0F3261 0%, #1e5fa8 100%); box-shadow: 0 4px 16px rgba(15,50,97,0.30);"
          >
            <span>{{ isSubmitting ? 'Membuat Akun...' : 'Daftar Sekarang' }}</span>
            <ArrowRight v-if="!isSubmitting" class="w-4 h-4" />
          </button>

          <!-- Toggle hint to Login -->
          <p class="text-center text-xs text-slate-500 pt-1">
            Sudah punya akun?
            <button type="button" @click="switchTab('login')" class="text-[#3587CE] font-bold hover:underline cursor-pointer ml-1">
              Masuk di sini
            </button>
          </p>
        </form>

      </div>
    </div>
  </div>
</template>
