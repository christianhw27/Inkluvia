<script setup>
import { ref, watch, onMounted } from 'vue'
import { currentUser, updateUserProfile, isAdmin } from '../lib/authService'
import {
  X,
  User,
  Palette,
  Eye,
  Check,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Coffee,
  Sliders,
  ShieldCheck,
  Mail,
  Zap
} from '@lucide/vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialTab: { type: String, default: 'profile' }
})

const emit = defineEmits(['close', 'updated'])

// Tab state
const activeTab = ref(props.initialTab)
watch(() => props.initialTab, (val) => { activeTab.value = val })

// Profile Form State
const editedName = ref('')
const selectedAvatar = ref('👧')
const profileSaveSuccess = ref(false)
const profileSaveError = ref('')

const AVATAR_OPTIONS = [
  { emoji: '👧', label: 'Anak Perempuan' },
  { emoji: '👦', label: 'Anak Laki-laki' },
  { emoji: '🦊', label: 'Rubah Cerdas' },
  { emoji: '🐼', label: 'Panda Bijak' },
  { emoji: '🚀', label: 'Penjelajah Roket' },
  { emoji: '🛡️', label: 'Penjaga Tangguh' },
  { emoji: '🦉', label: 'Burung Hantu Cermat' },
  { emoji: '🎨', label: 'Seniman Kreatif' },
  { emoji: '🐱', label: 'Kucing Ceria' },
  { emoji: '🐶', label: 'Anjing Sahabat' },
  { emoji: '🌟', label: 'Bintang Terang' },
  { emoji: '🦁', label: 'Singa Berani' }
]

// Theme State
const currentTheme = ref('light')
const THEME_OPTIONS = [
  {
    id: 'light',
    name: 'Inkluvia Biru',
    badge: 'Standar Ceria',
    desc: 'Warna biru cerah khas Inkluvia, ramah untuk aktivitas belajar harian.',
    icon: Sun,
    bgClass: 'bg-gradient-to-br from-[#3DA5FF] to-[#0F3261]',
    textColor: 'text-[#3587CE]'
  },
  {
    id: 'soft',
    name: 'Pastel Hangat',
    badge: 'Ramah Mata',
    desc: 'Nuansa sepia lembut yang meredakan ketegangan mata saat membaca lama.',
    icon: Coffee,
    bgClass: 'bg-gradient-to-br from-[#FFE4C4] to-[#D9A066]',
    textColor: 'text-amber-700'
  },
  {
    id: 'dark',
    name: 'Mode Gelap',
    badge: 'Malam / Fokus',
    desc: 'Tampilan gelap elegan untuk kenyamanan belajar di ruangan redup.',
    icon: Moon,
    bgClass: 'bg-gradient-to-br from-slate-800 to-slate-950',
    textColor: 'text-indigo-400'
  },
  {
    id: 'contrast',
    name: 'Kontras Tinggi',
    badge: 'Aksesibilitas',
    desc: 'Garis dan batas kontras diperjelas untuk kemudahan visual maksimal.',
    icon: Eye,
    bgClass: 'bg-gradient-to-br from-black to-yellow-500',
    textColor: 'text-yellow-600'
  }
]

// Accessibility Preferences State
const fontSize = ref('normal') // 'normal' | 'lg' | 'xl'
const dyslexicFont = ref(false)
const soundEffects = ref(true)
const reduceMotion = ref(false)

// Init data from localStorage & currentUser
const syncFromStorage = () => {
  if (currentUser.value) {
    editedName.value = currentUser.value.name || ''
    selectedAvatar.value = currentUser.value.avatar || '👧'
  }

  // Theme
  const savedTheme = localStorage.getItem('inkluvia_theme') || 'light'
  currentTheme.value = savedTheme
  applyTheme(savedTheme)

  // Font size
  const savedFontSize = localStorage.getItem('inkluvia_font_size') || 'normal'
  fontSize.value = savedFontSize
  applyFontSize(savedFontSize)

  // Dyslexic font
  const savedDyslexic = localStorage.getItem('inkluvia_dyslexic_font') === 'true'
  dyslexicFont.value = savedDyslexic
  applyDyslexicFont(savedDyslexic)

  // Sound effects
  const savedSound = localStorage.getItem('inkluvia_sound_effects') !== 'false'
  soundEffects.value = savedSound

  // Reduced motion
  const savedMotion = localStorage.getItem('inkluvia_reduce_motion') === 'true'
  reduceMotion.value = savedMotion
  applyReduceMotion(savedMotion)
}

watch(() => props.isOpen, (open) => {
  if (open) {
    syncFromStorage()
    profileSaveSuccess.value = false
    profileSaveError.value = ''
  }
})

onMounted(() => {
  syncFromStorage()
})

// Action: Save Profile
const handleSaveProfile = async () => {
  profileSaveSuccess.value = false
  profileSaveError.value = ''

  if (!editedName.value.trim()) {
    profileSaveError.value = 'Nama lengkap tidak boleh kosong.'
    return
  }

  try {
    const updated = await updateUserProfile({
      name: editedName.value.trim(),
      avatar: selectedAvatar.value
    })
    if (updated) {
      profileSaveSuccess.value = true
      emit('updated', updated)
      setTimeout(() => {
        profileSaveSuccess.value = false
      }, 3000)
    }
  } catch (e) {
    profileSaveError.value = 'Gagal menyimpan profil: ' + (e.message || 'Terjadi kesalahan')
  }
}

// Action: Apply Theme
const applyTheme = (themeId) => {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-soft', 'theme-dark', 'theme-contrast')
  root.classList.add(`theme-${themeId}`)
}

const selectTheme = (themeId) => {
  currentTheme.value = themeId
  localStorage.setItem('inkluvia_theme', themeId)
  applyTheme(themeId)
}

// Action: Font Size
const applyFontSize = (size) => {
  const root = document.documentElement
  root.classList.remove('font-size-lg', 'font-size-xl')
  if (size === 'lg') root.classList.add('font-size-lg')
  if (size === 'xl') root.classList.add('font-size-xl')
}

const selectFontSize = (size) => {
  fontSize.value = size
  localStorage.setItem('inkluvia_font_size', size)
  applyFontSize(size)
}

// Action: Dyslexic Font
const applyDyslexicFont = (enabled) => {
  const root = document.documentElement
  if (enabled) {
    root.classList.add('font-dyslexic')
  } else {
    root.classList.remove('font-dyslexic')
  }
}

const toggleDyslexicFont = () => {
  dyslexicFont.value = !dyslexicFont.value
  localStorage.setItem('inkluvia_dyslexic_font', String(dyslexicFont.value))
  applyDyslexicFont(dyslexicFont.value)
}

// Action: Sound Effects
const toggleSoundEffects = () => {
  soundEffects.value = !soundEffects.value
  localStorage.setItem('inkluvia_sound_effects', String(soundEffects.value))
}

// Action: Reduced Motion
const applyReduceMotion = (enabled) => {
  const root = document.documentElement
  if (enabled) {
    root.classList.add('reduce-motion')
  } else {
    root.classList.remove('reduce-motion')
  }
}

const toggleReduceMotion = () => {
  reduceMotion.value = !reduceMotion.value
  localStorage.setItem('inkluvia_reduce_motion', String(reduceMotion.value))
  applyReduceMotion(reduceMotion.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-slide-up my-8 max-h-[90vh] flex flex-col"
        >
          <!-- Header Banner -->
          <div
            class="relative px-6 sm:px-8 pt-7 pb-6 text-white shrink-0 overflow-hidden"
            style="background: linear-gradient(135deg, #0F3261 0%, #1e5fa8 60%, #3DA5FF 100%);"
          >
            <!-- Decorative shapes -->
            <div class="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-15" style="background:#FF7315;"></div>
            <div class="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15" style="background:#3DA5FF;"></div>

            <div class="relative z-10 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shadow-inner backdrop-blur-sm">
                  ⚙️
                </div>
                <div>
                  <h3 class="text-xl sm:text-2xl font-black tracking-tight">Pengaturan & Preferensi</h3>
                  <p class="text-xs sm:text-sm text-blue-100 font-medium">Sesuaikan profil akun, tema visual, dan kenyamanan belajarmu</p>
                </div>
              </div>
              <button
                @click="emit('close')"
                class="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
                title="Tutup"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Tab Switcher -->
            <div class="flex items-center gap-2 mt-6 p-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
              <button
                @click="activeTab = 'profile'"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                  activeTab === 'profile'
                    ? 'bg-white text-[#0F3261] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                ]"
              >
                <User class="w-4 h-4" />
                <span>Profil</span>
              </button>

              <button
                @click="activeTab = 'theme'"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                  activeTab === 'theme'
                    ? 'bg-white text-[#0F3261] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                ]"
              >
                <Palette class="w-4 h-4" />
                <span>Tema</span>
              </button>

              <button
                @click="activeTab = 'accessibility'"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                  activeTab === 'accessibility'
                    ? 'bg-white text-[#0F3261] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                ]"
              >
                <Sliders class="w-4 h-4" />
                <span>Aksesibilitas</span>
              </button>
            </div>
          </div>

          <!-- Body Content (Scrollable) -->
          <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

            <!-- TAB 1: PROFIL PENGGUNA -->
            <div v-if="activeTab === 'profile'" class="space-y-6">
              <!-- Success Alert -->
              <div
                v-if="profileSaveSuccess"
                class="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold animate-slide-up"
              >
                <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Profil dan avatar berhasil diperbarui! Sesi login Anda tersinkronisasi otomatis.</span>
              </div>

              <!-- Error Alert -->
              <div
                v-if="profileSaveError"
                class="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold"
              >
                {{ profileSaveError }}
              </div>

              <!-- Avatar Preview & Selector -->
              <div class="bg-gradient-to-r from-blue-50/70 to-indigo-50/40 p-5 rounded-3xl border border-blue-100 flex flex-col sm:flex-row items-center gap-6">
                <!-- Large Avatar Preview -->
                <div class="relative shrink-0">
                  <div
                    class="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md border-4 border-white ring-4 ring-[#3DA5FF]/30 transition-transform duration-200 hover:scale-105"
                    style="background: linear-gradient(135deg, #3DA5FF, #0F3261);"
                  >
                    {{ selectedAvatar }}
                  </div>
                  <div class="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow">
                    <Check class="w-3.5 h-3.5" />
                  </div>
                </div>

                <div class="flex-1 text-center sm:text-left">
                  <h4 class="text-sm font-black text-[#0F3261]">Pilih Avatar Karakter</h4>
                  <p class="text-xs text-slate-500 mt-0.5">Pilih ikon yang paling menggambarkan kepribadian belajarmu:</p>
                  
                  <!-- Avatar Grid -->
                  <div class="grid grid-cols-6 gap-2 mt-3 max-w-xs sm:max-w-none">
                    <button
                      v-for="item in AVATAR_OPTIONS"
                      :key="item.emoji"
                      type="button"
                      @click="selectedAvatar = item.emoji"
                      :title="item.label"
                      :class="[
                        'w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all duration-150 cursor-pointer border',
                        selectedAvatar === item.emoji
                          ? 'bg-[#3DA5FF] text-white border-[#0F3261] ring-2 ring-[#3DA5FF] scale-110 shadow-md'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:scale-105'
                      ]"
                    >
                      {{ item.emoji }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Input Form -->
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Nama Tampilan
                  </label>
                  <div class="relative">
                    <User class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      v-model="editedName"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      class="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 text-sm font-semibold text-slate-800 outline-none transition"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Email Akun
                    </label>
                    <div class="relative">
                      <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        :value="currentUser?.email || 'Belum masuk'"
                        type="email"
                        disabled
                        class="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100 text-sm font-medium text-slate-500 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Hak Akses / Peran
                    </label>
                    <div class="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50">
                      <ShieldCheck :class="isAdmin ? 'text-[#FF7315]' : 'text-[#3587CE]'" class="w-4 h-4 shrink-0" />
                      <span class="text-xs font-bold" :class="isAdmin ? 'text-[#FF7315]' : 'text-[#0F3261]'">
                        {{ isAdmin ? 'Administrator Platform' : 'Siswa / Pengguna Belajar' }}
                      </span>
                      <span class="ml-auto text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                        :class="isAdmin ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'">
                        {{ currentUser?.role || 'User' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Session Security Info -->
                <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="font-medium">Autentikasi Terenkripsi JWT Aktif</span>
                  </div>
                  <span class="font-mono text-[10px] text-slate-400">HS256 Verified</span>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="pt-2">
                <button
                  type="button"
                  @click="handleSaveProfile"
                  class="w-full py-3.5 px-6 rounded-2xl text-white font-extrabold text-sm transition-all duration-200 active:scale-98 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  style="background: linear-gradient(135deg, #FF7315 0%, #e86105 100%); box-shadow: 0 4px 15px rgba(255,115,21,0.35);"
                >
                  <Sparkles class="w-4 h-4" />
                  <span>Simpan Perubahan Profil</span>
                </button>
              </div>
            </div>

            <!-- TAB 2: TEMA TAMPILAN -->
            <div v-if="activeTab === 'theme'" class="space-y-6">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-sm font-black text-[#0F3261]">Pilih Gaya Tampilan</h4>
                  <p class="text-xs text-slate-500">Pilih tema warna yang paling nyaman di matamu saat belajar.</p>
                </div>
                <span class="text-xs font-bold px-3 py-1 bg-blue-50 text-[#3587CE] rounded-full border border-blue-100">
                  Aktif: {{ THEME_OPTIONS.find(t => t.id === currentTheme)?.name || 'Inkluvia Biru' }}
                </span>
              </div>

              <!-- Theme Cards Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  v-for="theme in THEME_OPTIONS"
                  :key="theme.id"
                  @click="selectTheme(theme.id)"
                  :class="[
                    'relative p-4 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.02]',
                    currentTheme === theme.id
                      ? 'border-[#3DA5FF] bg-blue-50/50 shadow-md ring-2 ring-[#3DA5FF]/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <!-- Card Header -->
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2.5">
                      <div :class="['w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-sm', theme.bgClass]">
                        <component :is="theme.icon" class="w-5 h-5" />
                      </div>
                      <div>
                        <p class="text-sm font-extrabold text-[#0F3261]">{{ theme.name }}</p>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {{ theme.badge }}
                        </span>
                      </div>
                    </div>

                    <!-- Active Radio Indicator -->
                    <div
                      :class="[
                        'w-6 h-6 rounded-full flex items-center justify-center border-2 transition',
                        currentTheme === theme.id
                          ? 'border-[#3DA5FF] bg-[#3DA5FF] text-white'
                          : 'border-slate-300 bg-white'
                      ]"
                    >
                      <Check v-if="currentTheme === theme.id" class="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <p class="text-xs text-slate-500 leading-relaxed">{{ theme.desc }}</p>
                </div>
              </div>

              <!-- Theme preview strip -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-600">Mode visual disimpan otomatis di peramban ini.</span>
                <span class="text-xs font-extrabold text-[#3587CE]">Instant Switch ⚡</span>
              </div>
            </div>

            <!-- TAB 3: AKSESIBILITAS & PREFERENSI -->
            <div v-if="activeTab === 'accessibility'" class="space-y-6">
              <div>
                <h4 class="text-sm font-black text-[#0F3261]">Penyesuaian Aksesibilitas Pembelajaran</h4>
                <p class="text-xs text-slate-500">Fitur inklusif untuk kenyamanan neurodiverse, disleksia, dan sensori.</p>
              </div>

              <!-- 1. Text Size Option -->
              <div class="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-base">🔤</span>
                    <label class="text-xs font-black text-[#0F3261] uppercase tracking-wide">
                      Skala Ukuran Huruf / Teks
                    </label>
                  </div>
                  <span class="text-xs font-bold text-slate-400">
                    {{ fontSize === 'normal' ? 'Normal (100%)' : fontSize === 'lg' ? 'Besar (110%)' : 'Ekstra Besar (120%)' }}
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    @click="selectFontSize('normal')"
                    :class="[
                      'py-2 px-3 rounded-2xl border text-xs font-extrabold transition cursor-pointer text-center',
                      fontSize === 'normal'
                        ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    ]"
                  >
                    Normal (A)
                  </button>
                  <button
                    type="button"
                    @click="selectFontSize('lg')"
                    :class="[
                      'py-2 px-3 rounded-2xl border text-sm font-extrabold transition cursor-pointer text-center',
                      fontSize === 'lg'
                        ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    ]"
                  >
                    Besar (A+)
                  </button>
                  <button
                    type="button"
                    @click="selectFontSize('xl')"
                    :class="[
                      'py-2 px-3 rounded-2xl border text-base font-black transition cursor-pointer text-center',
                      fontSize === 'xl'
                        ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    ]"
                  >
                    Ekstra (A++)
                  </button>
                </div>
              </div>

              <!-- 2. Dyslexia Font Toggle -->
              <div class="p-4 rounded-3xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-base">📖</span>
                    <span class="text-xs font-black text-[#0F3261] uppercase tracking-wide">Font Ramah Disleksia</span>
                  </div>
                  <p class="text-xs text-slate-500">Bentuk huruf lebih lebar & berbobot bawah untuk mencegah pembalikan karakter.</p>
                </div>
                <button
                  type="button"
                  @click="toggleDyslexicFont"
                  :class="[
                    'w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0',
                    dyslexicFont ? 'bg-[#3DA5FF]' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200',
                      dyslexicFont ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  ></div>
                </button>
              </div>

              <!-- 3. Sound Effects Toggle -->
              <div class="p-4 rounded-3xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <component :is="soundEffects ? Volume2 : VolumeX" class="w-4 h-4 text-[#3587CE]" />
                    <span class="text-xs font-black text-[#0F3261] uppercase tracking-wide">Efek Suara Gamifikasi</span>
                  </div>
                  <p class="text-xs text-slate-500">Bunyi klik, apresiasi kuis berhasil, dan umpan balik suara interaktif.</p>
                </div>
                <button
                  type="button"
                  @click="toggleSoundEffects"
                  :class="[
                    'w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0',
                    soundEffects ? 'bg-emerald-500' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200',
                      soundEffects ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  ></div>
                </button>
              </div>

              <!-- 4. Reduced Motion Toggle -->
              <div class="p-4 rounded-3xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-base">🧘</span>
                    <span class="text-xs font-black text-[#0F3261] uppercase tracking-wide">Kurangi Gerakan Animasi</span>
                  </div>
                  <p class="text-xs text-slate-500">Meredam getaran dan animasi mengambang bagi pengguna yang sensitif gerak.</p>
                </div>
                <button
                  type="button"
                  @click="toggleReduceMotion"
                  :class="[
                    'w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0',
                    reduceMotion ? 'bg-[#FF7315]' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200',
                      reduceMotion ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  ></div>
                </button>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span class="text-[11px] text-slate-400 font-medium">Inkluvia v2.4 • Inklusif untuk Semua</span>
            <button
              type="button"
              @click="emit('close')"
              class="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
