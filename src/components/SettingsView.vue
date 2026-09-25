<script setup>
import { ref, watch, onMounted } from 'vue'
import { currentUser, updateUserProfile, isAdmin } from '../lib/authService'
import {
  ArrowLeft,
  User,
  Palette,
  Sliders,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Check,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Coffee,
  Eye,
  Mail,
  ChevronRight,
  Star,
  Trash2,
  ExternalLink,
  MessageSquareHeart
} from '@lucide/vue'
import {
  getUserReview,
  saveUserReview,
  deleteUserReview,
  fetchSiteReviewsFromSupabase
} from '../lib/reviewService.js'
import DoodleOrnament from './DoodleOrnament.vue'

const props = defineProps({
  initialTab: { type: String, default: 'profile' }
})

const emit = defineEmits(['back', 'navigate', 'logout', 'updated'])

// Tab state: 'profile' | 'theme' | 'accessibility'
const activeTab = ref(props.initialTab || 'profile')
watch(() => props.initialTab, (val) => {
  if (val) activeTab.value = val
})

// Profile Form State
const editedName = ref('')
const selectedAvatar = ref('👧')
const profileSaveSuccess = ref(false)
const profileSaveError = ref('')
const isSaving = ref(false)

// Logout confirmation dialog modal
const showLogoutConfirm = ref(false)

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
    textColor: 'text-[#3587CE]',
    accentColor: '#3DA5FF'
  },
  {
    id: 'soft',
    name: 'Pastel Hangat',
    badge: 'Ramah Mata',
    desc: 'Nuansa sepia lembut yang meredakan ketegangan mata saat membaca lama.',
    icon: Coffee,
    bgClass: 'bg-gradient-to-br from-[#FFE4C4] to-[#D9A066]',
    textColor: 'text-amber-700',
    accentColor: '#D9A066'
  },
  {
    id: 'dark',
    name: 'Mode Gelap',
    badge: 'Malam / Fokus',
    desc: 'Tampilan gelap elegan untuk kenyamanan belajar di ruangan redup.',
    icon: Moon,
    bgClass: 'bg-gradient-to-br from-slate-800 to-slate-950',
    textColor: 'text-indigo-400',
    accentColor: '#475569'
  },
  {
    id: 'contrast',
    name: 'Kontras Tinggi',
    badge: 'Aksesibilitas',
    desc: 'Garis dan batas kontras diperjelas untuk kemudahan visual maksimal.',
    icon: Eye,
    bgClass: 'bg-gradient-to-br from-black to-yellow-500',
    textColor: 'text-yellow-600',
    accentColor: '#EAB308'
  }
]

// Accessibility Preferences State
const fontSize = ref('normal') // 'normal' | 'lg' | 'xl'
const dyslexicFont = ref(false)
const soundEffects = ref(true)
const reduceMotion = ref(false)

// ==================== USER WEBSITE REVIEW STATE ====================
const reviewRating = ref(5)
const reviewRole = ref('Orang Tua Murid')
const reviewComment = ref('')
const reviewSaveSuccess = ref(false)
const reviewSaveError = ref('')
const isReviewSaving = ref(false)
const hasExistingReview = ref(false)
const existingReviewData = ref(null)
const showDeleteReviewConfirm = ref(false)

const ROLE_SUGGESTIONS = [
  'Orang Tua Murid',
  'Guru Kelas Inklusi SD',
  'Praktisi Perkembangan Anak',
  'Guru Mata Pelajaran',
  'Pemerhati Pendidikan Anak',
  'Siswa / Pelajar'
]

// ==================== ACTION FUNCTIONS ====================

// Action: Theme
function applyTheme(themeId) {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-soft', 'theme-dark', 'theme-contrast')
  root.classList.add(`theme-${themeId}`)
}

function selectTheme(themeId) {
  currentTheme.value = themeId
  localStorage.setItem('inkluvia_theme', themeId)
  applyTheme(themeId)
}

// Action: Font Size
function applyFontSize(size) {
  const root = document.documentElement
  root.classList.remove('font-size-lg', 'font-size-xl')
  if (size === 'lg') root.classList.add('font-size-lg')
  if (size === 'xl') root.classList.add('font-size-xl')
}

function selectFontSize(size) {
  fontSize.value = size
  localStorage.setItem('inkluvia_font_size', size)
  applyFontSize(size)
}

// Action: Dyslexic Font
function applyDyslexicFont(enabled) {
  const root = document.documentElement
  if (enabled) {
    root.classList.add('font-dyslexic')
  } else {
    root.classList.remove('font-dyslexic')
  }
}

function toggleDyslexicFont() {
  dyslexicFont.value = !dyslexicFont.value
  localStorage.setItem('inkluvia_dyslexic_font', String(dyslexicFont.value))
  applyDyslexicFont(dyslexicFont.value)
}

// Action: Sound Effects
function toggleSoundEffects() {
  soundEffects.value = !soundEffects.value
  localStorage.setItem('inkluvia_sound_effects', String(soundEffects.value))
}

// Action: Reduced Motion
function applyReduceMotion(enabled) {
  const root = document.documentElement
  if (enabled) {
    root.classList.add('reduce-motion')
  } else {
    root.classList.remove('reduce-motion')
  }
}

function toggleReduceMotion() {
  reduceMotion.value = !reduceMotion.value
  localStorage.setItem('inkluvia_reduce_motion', String(reduceMotion.value))
  applyReduceMotion(reduceMotion.value)
}

function triggerLogout() {
  showLogoutConfirm.value = false
  emit('logout')
}

// Action: Reviews
function loadUserReviewState() {
  const userKey = currentUser.value?.id || currentUser.value?.email
  if (userKey) {
    const existing = getUserReview(userKey)
    if (existing) {
      existingReviewData.value = existing
      reviewRating.value = existing.rating || 5
      reviewRole.value = existing.userRole || ''
      reviewComment.value = existing.comment || ''
      hasExistingReview.value = true
      return
    }
  }
  existingReviewData.value = null
  reviewRating.value = 5
  reviewRole.value = currentUser.value?.role === 'admin' ? 'Guru / Pengajar' : 'Orang Tua Murid'
  reviewComment.value = ''
  hasExistingReview.value = false
}

async function handleSaveReview() {
  const userKey = currentUser.value?.id || currentUser.value?.email
  if (!userKey) {
    reviewSaveError.value = 'Silakan login terlebih dahulu untuk memberikan ulasan.'
    return
  }
  if (!reviewComment.value.trim()) {
    reviewSaveError.value = 'Silakan tuliskan pesan ulasan Anda terlebih dahulu.'
    return
  }

  isReviewSaving.value = true
  reviewSaveError.value = ''
  reviewSaveSuccess.value = false

  try {
    const res = await saveUserReview({
      userId: userKey,
      userEmail: currentUser.value?.email,
      userName: editedName.value.trim() || currentUser.value?.name || 'Pengguna Inkluvia',
      userAvatar: selectedAvatar.value || currentUser.value?.avatar || '👧',
      userRole: reviewRole.value.trim() || 'Orang Tua / Siswa',
      rating: reviewRating.value,
      comment: reviewComment.value.trim()
    })

    if (res.success) {
      hasExistingReview.value = true
      existingReviewData.value = res.review
      reviewSaveSuccess.value = true
      emit('updated')
      setTimeout(() => {
        reviewSaveSuccess.value = false
      }, 4000)
    } else {
      reviewSaveError.value = res.error || 'Gagal menyimpan ulasan.'
    }
  } catch (err) {
    reviewSaveError.value = 'Terjadi kesalahan saat menyimpan ulasan.'
  } finally {
    isReviewSaving.value = false
  }
}

async function handleDeleteReview() {
  const userKey = currentUser.value?.id || currentUser.value?.email
  if (!userKey) return

  isReviewSaving.value = true
  try {
    await deleteUserReview(userKey)
    hasExistingReview.value = false
    existingReviewData.value = null
    reviewComment.value = ''
    showDeleteReviewConfirm.value = false
    reviewSaveSuccess.value = false
    emit('updated')
  } catch (err) {
    console.error('Gagal menghapus ulasan:', err)
  } finally {
    isReviewSaving.value = false
  }
}

// Action: Profile
async function handleSaveProfile() {
  profileSaveSuccess.value = false
  profileSaveError.value = ''

  if (!editedName.value.trim()) {
    profileSaveError.value = 'Nama lengkap tidak boleh kosong.'
    return
  }

  isSaving.value = true
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
      }, 4000)
    }
  } catch (e) {
    profileSaveError.value = 'Gagal menyimpan profil: ' + (e.message || 'Terjadi kesalahan')
  } finally {
    isSaving.value = false
  }
}

// Sync preferences from storage & user profile
function syncFromStorage() {
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

// ==================== WATCHERS & LIFECYCLE ====================
watch(currentUser, (user) => {
  if (user) {
    editedName.value = user.name || ''
    selectedAvatar.value = user.avatar || '👧'
    loadUserReviewState()
  }
}, { immediate: true })

onMounted(async () => {
  syncFromStorage()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await fetchSiteReviewsFromSupabase()
  loadUserReviewState()
})
</script>

<template>
  <div
    class="w-full min-h-[calc(100vh-68px)] bg-[#F8FAFD] py-8 sm:py-10 relative overflow-hidden"
    style="background-image: radial-gradient(#d3e5fa 1.2px, transparent 1.2px); background-size: 30px 30px;"
  >
    <!-- Background Ambient Glow Blobs -->
    <div class="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#FFDC58]/15 blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-[#3DA5FF]/12 blur-3xl pointer-events-none"></div>

    <!-- Authentic Floating Doodles in Settings View -->
    <div class="absolute top-12 right-12 pointer-events-none select-none hidden md:block rotate-12 animate-float-slow">
      <DoodleOrnament name="arrow-loop" color="#3DA5FF" :size="46" />
    </div>
    <div class="absolute bottom-16 left-8 pointer-events-none select-none hidden lg:block -rotate-6 animate-bounce-subtle">
      <DoodleOrnament name="star-outline" color="#FFDC58" :size="38" />
    </div>
    <div class="absolute bottom-12 right-14 pointer-events-none select-none hidden md:block">
      <DoodleOrnament name="squiggle" color="#FF74BC" :size="65" />
    </div>
    <div class="absolute top-1/3 left-6 pointer-events-none select-none hidden xl:block animate-float-medium">
      <DoodleOrnament name="dots-duo" :size="40" />
    </div>

    <div class="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6 relative z-10">

      <!-- Breadcrumbs & Top Navigation Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button
            @click="emit('back')"
            class="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4 text-[#3587CE]" />
            <span>Kembali</span>
          </button>

          <div class="h-5 w-px bg-slate-200 hidden sm:block"></div>

          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-[#0F3261] tracking-tight flex items-center gap-2">
              <span>Pengaturan & Akun</span>
              <DoodleOrnament name="burst" color="#3DA5FF" :size="26" class="pointer-events-none animate-pulse-subtle" />
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 font-medium">
              Sesuaikan profil belajar, tampilan warna, dan kenyamanan aksesibilitas inklusif Anda
            </p>
          </div>
        </div>

        <!-- Quick Quicklink: Jelajahi Materi button on desktop header -->
        <button
          @click="emit('navigate', 'materi')"
          class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#3587CE] bg-blue-50 hover:bg-blue-100 transition cursor-pointer border border-blue-200"
        >
          <GraduationCap class="w-4 h-4" />
          <span>Jelajahi Materi</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Main Layout: Sidebar Navigation + Settings Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- ================= LEFT COLUMN: Profile Summary & Tabs ================= -->
        <aside class="lg:col-span-4 space-y-4">
          
          <!-- User Profile Card -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden">
            <!-- Decorative Accent Background -->
            <div
              class="absolute top-0 left-0 right-0 h-20 opacity-90"
              :style="{
                background: isAdmin
                  ? 'linear-gradient(135deg, #FF7315 0%, #e86105 100%)'
                  : 'linear-gradient(135deg, #0F3261 0%, #3587CE 100%)'
              }"
            ></div>

            <!-- Subtle Doodle in Profile Card Corner -->
            <div class="absolute top-3 right-3 pointer-events-none select-none z-10 opacity-60 rotate-12">
              <DoodleOrnament name="heart-outline" color="#FFFFFF" :size="24" />
            </div>

            <div class="relative pt-6 flex flex-col items-center text-center">
              <!-- Avatar Circle -->
              <div class="relative group">
                <div
                  class="w-22 h-22 rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-white ring-4 cursor-pointer transition-transform duration-300 hover:scale-105"
                  :class="isAdmin ? 'ring-[#FF7315]/40 bg-gradient-to-br from-[#FF7315] to-[#e86105]' : 'ring-[#3DA5FF]/40 bg-gradient-to-br from-[#3DA5FF] to-[#0F3261]'"
                  @click="activeTab = 'profile'"
                  title="Klik untuk ubah avatar"
                >
                  <span class="select-none leading-none">{{ currentUser?.avatar || '👧' }}</span>
                </div>
                <div class="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center">
                  <Check class="w-3 h-3 text-white stroke-[3]" />
                </div>
              </div>

              <!-- Name & Email -->
              <h2 class="mt-3.5 text-lg font-black text-[#0F3261] truncate max-w-full">
                {{ currentUser?.name || 'Pengguna Inkluvia' }}
              </h2>
              <p class="text-xs text-slate-500 font-medium truncate max-w-full">
                {{ currentUser?.email || 'user@inkluvia.id' }}
              </p>

              <!-- Role Tag & PRO Badge -->
              <div class="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs"
                  :class="isAdmin ? 'bg-orange-100 text-[#FF7315] border border-orange-200' : 'bg-blue-100 text-[#3587CE] border border-blue-200'"
                >
                  <span>{{ isAdmin ? '🛡️' : '🎓' }}</span>
                  <span>{{ isAdmin ? 'Administrator Inkluvia' : 'Siswa Pelajar' }}</span>
                </span>
                <span
                  v-if="currentUser?.isPro || isAdmin"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-900 border border-amber-300 shadow-xs"
                >
                  <span>👑</span>
                  <span>MEMBER PRO</span>
                </span>
              </div>
            </div>

            <!-- Divider -->
            <div class="my-5 border-t border-slate-100"></div>

            <!-- Quick Meta Status -->
            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between text-slate-500">
                <span class="font-medium">Status Akun:</span>
                <span class="font-bold text-emerald-600 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Aktif & Terverifikasi
                </span>
              </div>
              <div class="flex items-center justify-between text-slate-500">
                <span class="font-medium">Tipe Layanan:</span>
                <span v-if="currentUser?.isPro || isAdmin" class="font-black text-amber-600 flex items-center gap-1">
                  <span>👑</span>
                  <span>Inkluvia Premium PRO</span>
                </span>
                <span v-else class="font-bold text-[#0F3261]">Inkluvia Free Access</span>
              </div>
            </div>
          </div>

          <!-- Navigation Menu / Tabs (The options that were in the dropdown) -->
          <div class="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-sm space-y-1">
            <div class="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Menu Pengaturan
            </div>

            <!-- 1. Pengaturan Profil -->
            <button
              @click="activeTab = 'profile'"
              :class="[
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer text-left',
                activeTab === 'profile'
                  ? 'bg-blue-50 text-[#3587CE] shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              ]"
            >
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                :class="activeTab === 'profile' ? 'bg-[#3587CE] text-white' : 'bg-slate-100 text-slate-600'"
              >
                <User class="w-4 h-4" />
              </div>
              <div class="flex-1">
                <div class="leading-tight">Pengaturan Profil</div>
                <div class="text-[11px] font-normal text-slate-400">Nama tampilan & avatar</div>
              </div>
              <ChevronRight class="w-4 h-4 text-slate-300" />
            </button>

            <!-- 2. Tema Tampilan -->
            <button
              @click="activeTab = 'theme'"
              :class="[
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer text-left',
                activeTab === 'theme'
                  ? 'bg-amber-50 text-amber-700 shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              ]"
            >
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                :class="activeTab === 'theme' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'"
              >
                <Palette class="w-4 h-4" />
              </div>
              <div class="flex-1">
                <div class="leading-tight">Tema Tampilan</div>
                <div class="text-[11px] font-normal text-slate-400">Warna, mode gelap & kontras</div>
              </div>
              <ChevronRight class="w-4 h-4 text-slate-300" />
            </button>

            <!-- 3. Aksesibilitas -->
            <button
              @click="activeTab = 'accessibility'"
              :class="[
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer text-left',
                activeTab === 'accessibility'
                  ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              ]"
            >
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                :class="activeTab === 'accessibility' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'"
              >
                <Sliders class="w-4 h-4" />
              </div>
              <div class="flex-1">
                <div class="leading-tight">Aksesibilitas</div>
                <div class="text-[11px] font-normal text-slate-400">Disleksia, font & audio</div>
              </div>
              <ChevronRight class="w-4 h-4 text-slate-300" />
            </button>

            <div class="my-2 border-t border-slate-100"></div>

            <div class="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Navigasi Cepat
            </div>

            <!-- 4. Jelajahi Materi Shortcut -->
            <button
              @click="emit('navigate', 'materi')"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-[#3587CE] transition cursor-pointer text-left"
            >
              <div class="w-8 h-8 rounded-xl bg-blue-100/60 text-[#3587CE] flex items-center justify-center">
                <GraduationCap class="w-4 h-4" />
              </div>
              <span class="flex-1">Jelajahi Materi</span>
              <ChevronRight class="w-4 h-4 text-slate-300" />
            </button>

            <!-- 5. Admin Dashboard Shortcut (Only if admin) -->
            <button
              v-if="isAdmin"
              @click="emit('navigate', 'admin')"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-white transition cursor-pointer text-left shadow-sm"
              style="background: linear-gradient(135deg, #FF7315, #e86105);"
            >
              <div class="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
                <LayoutDashboard class="w-4 h-4" />
              </div>
              <span class="flex-1">Dashboard Admin</span>
              <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">CMS</span>
            </button>

            <!-- 6. Ulasan Website Saya (Tampil di Landing Page) -->
            <button
              @click="activeTab = 'review'"
              :class="[
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition cursor-pointer text-left',
                activeTab === 'review'
                  ? 'bg-[#FF7315] text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-[#0F3261]'
              ]"
            >
              <div
                :class="[
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                  activeTab === 'review' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
                ]"
              >
                <Star class="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <span class="flex-1">Ulasan Website</span>
              <span
                v-if="hasExistingReview"
                class="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800"
              >
                Aktif ⭐
              </span>
              <span
                v-else
                class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800"
              >
                Tulis
              </span>
            </button>

            <!-- 7. Logout Button -->
            <button
              @click="showLogoutConfirm = true"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left mt-1"
            >
              <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <LogOut class="w-4 h-4" />
              </div>
              <span class="flex-1">Keluar Akun</span>
            </button>
          </div>
        </aside>

        <!-- ================= RIGHT COLUMN: Active Setting Details ================= -->
        <main class="lg:col-span-8 space-y-6">

          <!-- TAB 1: PENGATURAN PROFIL -->
          <div
            v-if="activeTab === 'profile'"
            class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-slide-up"
          >
            <!-- Tab Header -->
            <div class="border-b border-slate-100 pb-5">
              <h3 class="text-xl font-black text-[#0F3261] flex items-center gap-2">
                <User class="w-5 h-5 text-[#3587CE]" />
                <span>Pengaturan Profil Akun</span>
              </h3>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Perbarui nama lengkap dan avatar karakter yang akan tampil pada papan aktivitas pembelajaran.
              </p>
            </div>

            <!-- Success Alert -->
            <div
              v-if="profileSaveSuccess"
              class="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold animate-slide-up"
            >
              <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Profil berhasil disimpan! Nama dan avatar akunmu telah diperbarui di seluruh aplikasi.</span>
            </div>

            <!-- Error Alert -->
            <div
              v-if="profileSaveError"
              class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold"
            >
              {{ profileSaveError }}
            </div>

            <!-- Avatar Picker Card -->
            <div class="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-6 rounded-3xl border border-blue-100">
              <div class="flex flex-col sm:flex-row items-center gap-6">
                <!-- Large Avatar Preview -->
                <div class="relative shrink-0 text-center">
                  <div
                    class="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-white ring-4 ring-[#3DA5FF]/30 transition-transform duration-200 hover:scale-105"
                    style="background: linear-gradient(135deg, #3DA5FF, #0F3261);"
                  >
                    {{ selectedAvatar }}
                  </div>
                  <span class="mt-2 inline-block text-[11px] font-bold text-slate-500">Avatar Terpilih</span>
                </div>

                <!-- Avatar Selection Grid -->
                <div class="flex-1 text-center sm:text-left">
                  <h4 class="text-sm font-black text-[#0F3261]">Pilih Karakter Inklusif</h4>
                  <p class="text-xs text-slate-500 mt-0.5">
                    Klik karakter favoritmu untuk menjadikannya ikon profil:
                  </p>
                  
                  <div class="grid grid-cols-4 sm:grid-cols-6 gap-2.5 mt-3.5">
                    <button
                      v-for="item in AVATAR_OPTIONS"
                      :key="item.emoji"
                      type="button"
                      @click="selectedAvatar = item.emoji"
                      :title="item.label"
                      :class="[
                        'h-12 rounded-2xl flex flex-col items-center justify-center text-2xl transition-all duration-150 cursor-pointer border',
                        selectedAvatar === item.emoji
                          ? 'bg-[#3DA5FF] text-white border-[#0F3261] ring-2 ring-[#3DA5FF] scale-110 shadow-md'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:scale-105 shadow-xs'
                      ]"
                    >
                      <span>{{ item.emoji }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="space-y-4 pt-2">
              <!-- Name Input -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Nama Lengkap / Panggilan
                </label>
                <div class="relative">
                  <User class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    v-model="editedName"
                    type="text"
                    placeholder="Contoh: Budi Pratama"
                    class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 text-sm font-semibold text-slate-800 outline-none transition bg-white"
                  />
                </div>
              </div>

              <!-- Email Input (Full width, clean) -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Alamat Email (Akun)
                </label>
                <div class="relative">
                  <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    :value="currentUser?.email || 'Belum masuk'"
                    type="email"
                    disabled
                    class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-100/90 text-sm font-medium text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>
                <span class="text-[11px] text-slate-400 mt-1 block">Email terikat permanen dengan akun.</span>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                @click="handleSaveProfile"
                :disabled="isSaving"
                class="w-full sm:w-auto py-3.5 px-8 rounded-2xl text-white font-extrabold text-sm transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                style="background: linear-gradient(135deg, #FF7315 0%, #e86105 100%); box-shadow: 0 4px 15px rgba(255,115,21,0.30);"
              >
                <Sparkles class="w-4 h-4" />
                <span>{{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil' }}</span>
              </button>
            </div>
          </div>

          <!-- TAB 2: TEMA TAMPILAN -->
          <div
            v-if="activeTab === 'theme'"
            class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-slide-up"
          >
            <!-- Tab Header -->
            <div class="border-b border-slate-100 pb-5">
              <h3 class="text-xl font-black text-[#0F3261] flex items-center gap-2">
                <Palette class="w-5 h-5 text-amber-600" />
                <span>Tema & Gaya Tampilan</span>
              </h3>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Pilih nuansa warna tampilan antarmuka yang paling nyaman bagi indra visual Anda.
              </p>
            </div>

            <!-- Theme Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="theme in THEME_OPTIONS"
                :key="theme.id"
                @click="selectTheme(theme.id)"
                :class="[
                  'relative p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] shadow-xs',
                  currentTheme === theme.id
                    ? 'border-[#3DA5FF] bg-blue-50/40 shadow-md ring-2 ring-[#3DA5FF]/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                ]"
              >
                <!-- Card Header -->
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div :class="['w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm', theme.bgClass]">
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
                    <Check v-if="currentTheme === theme.id" class="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <p class="text-xs text-slate-500 leading-relaxed">{{ theme.desc }}</p>

                <!-- Color preview dots -->
                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Pratinjau Palet</span>
                  <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: theme.accentColor }"></span>
                    <span class="w-3 h-3 rounded-full bg-slate-200"></span>
                    <span class="w-3 h-3 rounded-full bg-white border border-slate-300"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Information strip -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <span>Tema tersimpan otomatis di perangkat dan berlaku di semua halaman Inkluvia.</span>
              <span class="font-extrabold text-[#3587CE] hidden sm:inline">Penerapan Instan ⚡</span>
            </div>
          </div>

          <!-- TAB 3: AKSESIBILITAS -->
          <div
            v-if="activeTab === 'accessibility'"
            class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-slide-up"
          >
            <!-- Tab Header -->
            <div class="border-b border-slate-100 pb-5">
              <h3 class="text-xl font-black text-[#0F3261] flex items-center gap-2">
                <Sliders class="w-5 h-5 text-emerald-600" />
                <span>Preferensi Aksesibilitas & Inklusif</span>
              </h3>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Pengaturan khusus untuk kenyamanan neurodiverse, disleksia, dan sensori agar proses belajar menyenangkan.
              </p>
            </div>

            <div class="space-y-4">
              <!-- 1. Text Size Option -->
              <div class="p-5 rounded-3xl border border-slate-200 bg-white space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xl">🔤</span>
                    <div>
                      <h4 class="text-sm font-black text-[#0F3261]">Skala Ukuran Teks / Huruf</h4>
                      <p class="text-xs text-slate-500">Perbesar teks bacaan untuk kemudahan membaca tanpa zoom browser.</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {{ fontSize === 'normal' ? 'Normal (100%)' : fontSize === 'lg' ? 'Besar (108%)' : 'Ekstra Besar (118%)' }}
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    @click="selectFontSize('normal')"
                    :class="[
                      'py-3 px-3 rounded-2xl border text-xs font-extrabold transition cursor-pointer text-center',
                      fontSize === 'normal'
                        ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    ]"
                  >
                    Normal (A)
                  </button>
                  <button
                    type="button"
                    @click="selectFontSize('lg')"
                    :class="[
                      'py-3 px-3 rounded-2xl border text-sm font-extrabold transition cursor-pointer text-center',
                      fontSize === 'lg'
                        ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    ]"
                  >
                    Besar (A+)
                  </button>
                  <button
                    type="button"
                    @click="selectFontSize('xl')"
                    :class="[
                      'py-3 px-3 rounded-2xl border text-base font-black transition cursor-pointer text-center',
                      fontSize === 'xl'
                        ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    ]"
                  >
                    Ekstra (A++)
                  </button>
                </div>
              </div>

              <!-- 2. Dyslexia Font Toggle -->
              <div class="p-5 rounded-3xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xl">📖</span>
                    <h4 class="text-sm font-black text-[#0F3261]">Font Ramah Disleksia (OpenDyslexic)</h4>
                  </div>
                  <p class="text-xs text-slate-500">
                    Bentuk huruf berbobot bawah unik dan jarak renggang yang mencegah pembalikan karakter saat membaca.
                  </p>
                </div>
                <button
                  type="button"
                  @click="toggleDyslexicFont"
                  :class="[
                    'w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0',
                    dyslexicFont ? 'bg-[#3DA5FF]' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center text-[10px]',
                      dyslexicFont ? 'translate-x-6 text-[#3DA5FF]' : 'translate-x-0 text-slate-400'
                    ]"
                  >
                    <Check v-if="dyslexicFont" class="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              </div>

              <!-- 3. Sound Effects Toggle -->
              <div class="p-5 rounded-3xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xl">🔔</span>
                    <h4 class="text-sm font-black text-[#0F3261]">Efek Suara Gamifikasi</h4>
                  </div>
                  <p class="text-xs text-slate-500">
                    Umpan balik audio saat menjawab kuis, meraih badge bintang, dan menyelesaikan materi petualangan.
                  </p>
                </div>
                <button
                  type="button"
                  @click="toggleSoundEffects"
                  :class="[
                    'w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0',
                    soundEffects ? 'bg-emerald-500' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center',
                      soundEffects ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-slate-400'
                    ]"
                  >
                    <Volume2 v-if="soundEffects" class="w-3.5 h-3.5" />
                    <VolumeX v-else class="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              <!-- 4. Reduced Motion Toggle -->
              <div class="p-5 rounded-3xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xl">🧘</span>
                    <h4 class="text-sm font-black text-[#0F3261]">Kurangi Gerakan Animasi (Reduce Motion)</h4>
                  </div>
                  <p class="text-xs text-slate-500">
                    Menenangkan transisi dan menonaktifkan getaran floating untuk kenyamanan sensori & vestibular.
                  </p>
                </div>
                <button
                  type="button"
                  @click="toggleReduceMotion"
                  :class="[
                    'w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0',
                    reduceMotion ? 'bg-[#FF7315]' : 'bg-slate-200'
                  ]"
                >
                  <div
                    :class="[
                      'w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center text-[10px]',
                      reduceMotion ? 'translate-x-6 text-[#FF7315]' : 'translate-x-0 text-slate-400'
                    ]"
                  >
                    <Check v-if="reduceMotion" class="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 4: ULASAN WEBSITE SAYA (Dinamis & Tampil di Landing Page) -->
          <div
            v-else-if="activeTab === 'review'"
            class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-slide-up"
          >
            <!-- Tab Header -->
            <div class="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                  <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  Testimoni Publik Landing Page
                </span>
                <h3 class="text-xl font-black text-[#0F3261] flex items-center gap-2">
                  <span>Ulasan Website Anda untuk Inkluvia</span>
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 mt-1">
                  Ulasan yang Anda tulis di sini tersimpan secara aman di database cloud dan akan langsung tampil pada bagian <strong>"Cerita Mereka"</strong> di halaman depan.
                </p>
              </div>

              <button
                type="button"
                @click="emit('navigate', 'beranda')"
                class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start cursor-pointer shrink-0"
              >
                <ExternalLink class="w-3.5 h-3.5 text-[#3587CE]" />
                Lihat di Landing Page
              </button>
            </div>

            <!-- Success Alert -->
            <div
              v-if="reviewSaveSuccess"
              class="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold animate-slide-up"
            >
              <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Ulasan berhasil disimpan dan tersinkronisasi ke database cloud! Ulasan Anda kini tampil di halaman depan.</span>
            </div>

            <!-- Error Alert -->
            <div
              v-if="reviewSaveError"
              class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold"
            >
              {{ reviewSaveError }}
            </div>

            <!-- Live Card Preview (Menampilkan Tampilan Persis Seperti di Landing Page) -->
            <div class="space-y-2">
              <label class="block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Pratinjau Tampilan di Halaman Depan
              </label>
              
              <div class="bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-slate-50 rounded-3xl p-6 sm:p-7 border-2 border-dashed border-amber-300 relative max-w-lg shadow-xs">
                <div class="space-y-3">
                  <!-- Rating Stars -->
                  <div class="flex items-center justify-between">
                    <div class="text-amber-400 text-base tracking-widest flex items-center gap-0.5">
                      <span v-for="star in reviewRating" :key="star">⭐</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-[#FF7315] border border-orange-200">
                      Ulasan Kamu
                    </span>
                  </div>

                  <!-- Comment Text Preview -->
                  <p class="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic">
                    "{{ reviewComment.trim() || 'Tuliskan pengalaman belajar atau kesan Anda terhadap Inkluvia di formulir bawah ini...' }}"
                  </p>
                </div>

                <div class="pt-4 mt-4 border-t border-amber-200/60 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-white border border-amber-200 text-lg flex items-center justify-center shadow-inner shrink-0">
                    {{ selectedAvatar || currentUser?.avatar || '👧' }}
                  </div>
                  <div class="text-left min-w-0">
                    <h4 class="text-xs font-extrabold text-[#0F3261] truncate">
                      {{ editedName || currentUser?.name || 'Nama Anda' }}
                    </h4>
                    <p class="text-[11px] font-medium text-slate-500 truncate">
                      {{ reviewRole || 'Orang Tua / Siswa' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Edit Ulasan -->
            <form @submit.prevent="handleSaveReview" class="space-y-5 pt-2">
              
              <!-- 1. Star Rating Picker -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Pilih Penilaian Bintang
                </label>
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    v-for="r in 5"
                    :key="r"
                    type="button"
                    @click="reviewRating = r"
                    :class="[
                      'px-3.5 py-2 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer text-xs font-extrabold select-none active:scale-95',
                      reviewRating === r
                        ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm scale-105'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                    ]"
                  >
                    <span>⭐ {{ r }}</span>
                    <span class="text-[11px] opacity-80 font-normal">
                      {{ r === 5 ? 'Luar Biasa' : r === 4 ? 'Sangat Baik' : r === 3 ? 'Baik' : r === 2 ? 'Cukup' : 'Kurang' }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- 2. Peran / Status Anda -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Peran / Status Anda (Ditampilkan di Kartu)
                </label>
                <input
                  v-model="reviewRole"
                  type="text"
                  placeholder="Contoh: Orang Tua Murid Kelas 4 SD / Guru Inklusi"
                  class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 text-sm font-semibold text-slate-800 outline-none transition bg-white"
                />

                <!-- Quick Role Suggestions -->
                <div class="flex items-center gap-2 flex-wrap mt-2">
                  <span class="text-[11px] text-slate-400 font-semibold">Saran:</span>
                  <button
                    v-for="sug in ROLE_SUGGESTIONS"
                    :key="sug"
                    type="button"
                    @click="reviewRole = sug"
                    class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  >
                    {{ sug }}
                  </button>
                </div>
              </div>

              <!-- 3. Kolom Ulasan / Testimoni -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Tuliskan Pengalaman / Ulasan Anda
                  </label>
                  <span class="text-[11px] font-mono text-slate-400">
                    {{ reviewComment.length }} / 400 karakter
                  </span>
                </div>
                <textarea
                  v-model="reviewComment"
                  maxlength="400"
                  rows="4"
                  placeholder="Bagikan bagaimana Inkluvia membantu anak atau murid Anda dalam belajar (misal: materi visualnya mudah dipahami, narasinya tenang, atau fiturnya sangat inklusif)..."
                  class="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 text-sm font-medium text-slate-800 outline-none transition bg-white resize-none leading-relaxed"
                ></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <button
                    v-if="hasExistingReview"
                    type="button"
                    @click="showDeleteReviewConfirm = true"
                    class="py-2.5 px-4 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    <span>Hapus Ulasan Saya</span>
                  </button>
                </div>

                <div class="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="submit"
                    :disabled="isReviewSaving || !reviewComment.trim()"
                    class="w-full sm:w-auto py-3.5 px-8 rounded-2xl text-white font-extrabold text-sm transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    style="background: linear-gradient(135deg, #FF7315 0%, #e86105 100%); box-shadow: 0 4px 15px rgba(255,115,21,0.30);"
                  >
                    <Sparkles class="w-4 h-4" />
                    <span>{{ isReviewSaving ? 'Menyimpan ke Database...' : (hasExistingReview ? 'Perbarui Ulasan di Landing Page' : 'Kirim Ulasan ke Landing Page') }}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>

        </main>
      </div>

    </div>

    <!-- ================= LOGOUT CONFIRMATION MODAL ================= -->
    <Teleport to="body">
      <div
        v-if="showLogoutConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="showLogoutConfirm = false"
      >
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-slide-up space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto">
            <LogOut class="w-7 h-7" />
          </div>

          <div>
            <h3 class="text-lg font-black text-slate-800">Keluar dari Akun?</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Anda akan keluar dari sesi akun Inkluvia. Semua kemajuan belajar tersimpan dengan aman di server.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              @click="showLogoutConfirm = false"
              class="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="triggerLogout"
              class="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition cursor-pointer shadow-md shadow-rose-200"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ================= DELETE REVIEW CONFIRMATION MODAL ================= -->
    <Teleport to="body">
      <div
        v-if="showDeleteReviewConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="showDeleteReviewConfirm = false"
      >
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-slide-up space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto">
            <Trash2 class="w-7 h-7" />
          </div>

          <div>
            <h3 class="text-lg font-black text-slate-800">Hapus Ulasan Anda?</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Ulasan Anda akan dihapus dari database cloud dan tidak akan tampil lagi di halaman depan Inkluvia. Anda dapat menulis ulasan baru kapan saja.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              @click="showDeleteReviewConfirm = false"
              class="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="handleDeleteReview"
              class="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition cursor-pointer shadow-md shadow-rose-200"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
