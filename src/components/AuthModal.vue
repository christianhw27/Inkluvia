<script setup>
import { ref, watch } from 'vue'
import { loginUser, registerUser } from '../lib/authService'
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronDown } from '@lucide/vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialTab: { type: String, default: 'login' },
  noticeMessage: { type: String, default: '' }
})

const emit = defineEmits(['close', 'authenticated'])

const tab = ref(props.initialTab)
const email = ref('')
const password = ref('')
const name = ref('')
const role = ref('user')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const showPassword = ref(false)
const showDemoHint = ref(false)

watch(() => props.initialTab, (val) => { tab.value = val })
watch(() => props.isOpen, (val) => {
  if (val) {
    errorMessage.value = ''
    successMessage.value = ''
    email.value = ''
    password.value = ''
    name.value = ''
  }
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
      emit('close')
    } else {
      errorMessage.value = res.message || 'Login gagal. Coba lagi.'
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
    const res = await registerUser({ name: name.value, email: email.value, password: password.value, role: role.value })
    if (res.success) {
      emit('authenticated', res.user)
      emit('close')
    } else {
      errorMessage.value = res.message || 'Pendaftaran gagal.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style="background: rgba(9,32,64,0.72); backdrop-filter: blur(8px);"
    >
      <!-- Card -->
      <div
        class="relative bg-white rounded-3xl w-full max-w-[420px] overflow-hidden shadow-2xl"
        style="box-shadow: 0 32px 80px rgba(9,32,64,0.22), 0 0 0 1px rgba(61,165,255,0.08);"
      >
        <!-- Gradient Header Banner -->
        <div
          class="relative px-8 pt-10 pb-8 text-center overflow-hidden"
          style="background: linear-gradient(135deg, #0F3261 0%, #1e5fa8 60%, #3DA5FF 100%);"
        >
          <!-- Decorative circles -->
          <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style="background:#FF7315;"></div>
          <div class="absolute -bottom-4 -left-6 w-20 h-20 rounded-full opacity-10" style="background:#3DA5FF;"></div>

          <!-- Logo -->
          <div class="relative z-10 flex justify-center mb-4">
            <div class="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <img src="/Logo.png" alt="Inkluvia" class="w-9 h-9 object-contain" />
            </div>
          </div>

          <!-- Title -->
          <h2 class="relative z-10 text-2xl font-extrabold text-white tracking-tight">
            {{ tab === 'login' ? 'Selamat Datang!' : 'Buat Akun Baru' }}
          </h2>
          <p class="relative z-10 text-sm text-blue-200 mt-1 font-medium">
            {{ tab === 'login' ? 'Masuk untuk melanjutkan belajar' : 'Daftar dan mulai perjalanan belajarmu' }}
          </p>

          <!-- Close Button -->
          <button
            @click="emit('close')"
            class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Tab Switcher -->
        <div class="px-8 -mt-5 relative z-10">
          <div class="flex p-1 bg-slate-100 rounded-2xl shadow-inner">
            <button
              type="button"
              @click="switchTab('login')"
              :class="[
                'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer',
                tab === 'login'
                  ? 'bg-white text-[#0F3261] shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              ]"
            >
              Masuk
            </button>
            <button
              type="button"
              @click="switchTab('register')"
              :class="[
                'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer',
                tab === 'register'
                  ? 'bg-white text-[#0F3261] shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              ]"
            >
              Daftar
            </button>
          </div>
        </div>

        <!-- Middleware Access Notice -->
        <div
          v-if="noticeMessage"
          class="mx-8 mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs"
        >
          <div class="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
            <Lock class="w-3.5 h-3.5" />
          </div>
          <div class="flex-1 text-left">
            <span class="block font-bold text-amber-800 text-[10px] uppercase tracking-wider mb-0.5">Akses Terbatas</span>
            <p class="leading-relaxed font-medium text-amber-950">{{ noticeMessage }}</p>
          </div>
        </div>

        <!-- Form Body -->
        <div class="px-8 pb-8 pt-5 space-y-4">
          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- SUCCESS -->
          <div
            v-if="successMessage"
            class="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
          >
            <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ successMessage }}</span>
          </div>

          <!-- ===== LOGIN FORM ===== -->
          <form v-if="tab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
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

            <!-- Submit -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full py-3.5 rounded-xl font-bold text-sm text-white transition active:scale-95 disabled:opacity-60 cursor-pointer mt-2"
              style="background: linear-gradient(135deg, #FF7315 0%, #e86105 100%); box-shadow: 0 4px 16px rgba(255,115,21,0.35);"
            >
              {{ isSubmitting ? 'Memproses...' : 'Masuk Sekarang' }}
            </button>

            <!-- Hint -->
            <p class="text-center text-xs text-slate-400 pt-1">
              Belum punya akun?
              <button type="button" @click="switchTab('register')" class="text-[#3587CE] font-bold hover:underline cursor-pointer">
                Daftar di sini
              </button>
            </p>

            <!-- Demo Hint -->
            <div class="mt-3 rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                @click="showDemoHint = !showDemoHint"
                class="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-500 transition cursor-pointer"
              >
                <span class="flex items-center gap-1.5">
                  <span class="text-base">📍</span>
                  Akun Demo untuk Testing
                </span>
                <ChevronDown :class="['w-3.5 h-3.5 transition-transform', showDemoHint ? 'rotate-180' : '']" />
              </button>
              <div v-if="showDemoHint" class="px-4 py-3 space-y-2 border-t border-slate-200 bg-white">
                <button
                  type="button"
                  @click="email = 'admin@inkluvia.id'; password = 'admin123'; showDemoHint = false"
                  class="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 transition cursor-pointer"
                >
                  <div class="text-left">
                    <p class="text-xs font-bold text-[#FF7315]">🛡️ Admin — admin@inkluvia.id</p>
                    <p class="text-[11px] text-slate-500 font-mono">password: admin123</p>
                  </div>
                  <span class="text-[10px] text-[#FF7315] font-semibold bg-orange-100 px-2 py-0.5 rounded-full">Isi Otomatis</span>
                </button>
                <button
                  type="button"
                  @click="email = 'user@inkluvia.id'; password = 'user123'; showDemoHint = false"
                  class="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                >
                  <div class="text-left">
                    <p class="text-xs font-bold text-[#3587CE]">👤 Pengguna (Siswa/Guru) — user@inkluvia.id</p>
                    <p class="text-[11px] text-slate-500 font-mono">password: user123</p>
                  </div>
                  <span class="text-[10px] text-[#3587CE] font-semibold bg-blue-100 px-2 py-0.5 rounded-full">Isi Otomatis</span>
                </button>
              </div>
            </div>
          </form>

          <!-- ===== REGISTER FORM ===== -->
          <form v-else @submit.prevent="handleRegister" class="space-y-4">
            <!-- Nama -->
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
              <p class="text-[11px] text-slate-400 pl-1">Minimal 6 karakter</p>
            </div>

            <!-- Role Selection (2 Roles) -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide">Peran Akun</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="role = 'user'"
                  :class="[
                    'py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2',
                    role === 'user'
                      ? 'border-[#3DA5FF] bg-blue-50 text-[#3587CE]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  ]"
                >
                  👤 Pengguna
                </button>
                <button
                  type="button"
                  @click="role = 'admin'"
                  :class="[
                    'py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2',
                    role === 'admin'
                      ? 'border-[#FF7315] bg-orange-50 text-[#FF7315]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  ]"
                >
                  🛡️ Admin (CMS)
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full py-3.5 rounded-xl font-bold text-sm text-white transition active:scale-95 disabled:opacity-60 cursor-pointer mt-2"
              style="background: linear-gradient(135deg, #0F3261 0%, #1e5fa8 100%); box-shadow: 0 4px 16px rgba(15,50,97,0.30);"
            >
              {{ isSubmitting ? 'Membuat Akun...' : 'Buat Akun Sekarang' }}
            </button>

            <!-- Hint -->
            <p class="text-center text-xs text-slate-400 pt-1">
              Sudah punya akun?
              <button type="button" @click="switchTab('login')" class="text-[#FF7315] font-bold hover:underline cursor-pointer">
                Masuk di sini
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
