<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import {
  Search,
  ArrowRight,
  Target,
  Accessibility,
  Gamepad2,
  LogOut,
  User,
  GraduationCap,
  Settings,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
  Lock,
  Volume2,
  VolumeX,
  Play,
  Headphones,
  Type,
  Clock,
  ShieldCheck,
  BookOpen,
  Award,
  Heart,
  Smile,
  Users,
  CheckCircle2,
  FileText,
  Check,
  Brain
} from '@lucide/vue'
import MateriView from './components/MateriView.vue'
import MateriDetailView from './components/MateriDetailView.vue'
import ModeSelectView from './components/ModeSelectView.vue'
import LearningPlayerView from './components/LearningPlayerView.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import AuthView from './components/AuthView.vue'
import GuruView from './components/GuruView.vue'
import { materiList, selectedMateri } from './lib/materiService'
import {
  currentUser,
  isAuthenticated,
  isAdmin,
  logoutUser
} from './lib/authService'
import {
  canAccessRoute,
  PROTECTED_ROUTES,
  ADMIN_ROUTES
} from './lib/navigationMiddleware'
import {
  playMascotChime,
  playButtonPop,
  toggleSound,
  isSoundEnabled
} from './lib/soundEffects'

// Interactive State for Section 1: Pilar Nilai & Aksesibilitas
const isDyslexiaDemoActive = ref(false)
const isAudioNarrationPlaying = ref(false)
const playAudioNarrationSample = () => {
  isAudioNarrationPlaying.value = true
  playMascotChime()
  setTimeout(() => {
    isAudioNarrationPlaying.value = false
  }, 3200)
}

// Interactive State for Section 2: Pratinjau Materi Filter Tabs & Pro Teaser Modal
const activeCategoryTab = ref('semua')
const showProTeaserModal = ref(false)
const selectedTeaserModule = ref(null)

const sampleModules = [
  {
    id: 1,
    title: 'Petualangan Huruf Pertama Bersama Si Es Batu',
    category: 'membaca',
    categoryLabel: 'Membaca & Fonik',
    ageLabel: '4–6 Tahun',
    badges: ['Audio Narasi', 'Visual Animasi'],
    summary: 'Mengenal bunyi dan bentuk huruf alfabet melalui tebak gambar interaktif.',
    image: '/es_batu_card.jpg',
    color: 'orange',
    isPro: false,
    isFree: true
  },
  {
    id: 2,
    title: 'Berhitung Bersama Sahabat Hutan',
    category: 'logika',
    categoryLabel: 'Angka & Logika',
    ageLabel: '6–8 Tahun',
    badges: ['Visual Interaktif', 'Sentuhan Ringan'],
    summary: 'Memahami konsep penjumlahan dasar melalui animasi buah-buahan dan benda sekitar.',
    image: '/Banner_Materi.jpg',
    color: 'blue',
    isPro: true,
    isFree: false
  },
  {
    id: 3,
    title: 'Cerita Suara: Belajar Mengenal Rasa Senang & Sedih',
    category: 'emosi',
    categoryLabel: 'Regulasi Emosi & Inklusi',
    ageLabel: 'Semua Usia',
    badges: ['Audio Drama', 'Diskusi Ramah'],
    summary: 'Cerita narasi pendek untuk membantu anak memahami emosi diri dan berempati pada teman sebaya.',
    image: '/Banner_Dashboard.jpg',
    color: 'pink',
    isPro: true,
    isFree: false
  },
  {
    id: 4,
    title: 'Eksplorasi Lingkungan & Wujud Benda Sekitar',
    category: 'lingkungan',
    categoryLabel: 'Eksplorasi Lingkungan',
    ageLabel: '7–10 Tahun',
    badges: ['Eksperimen', 'Worksheet'],
    summary: 'Mengenal benda padat, cair, dan gas melalui simulasi interaktif di sekitar kita.',
    image: '/es_batu_card.jpg',
    color: 'green',
    isPro: true,
    isFree: false
  }
]

const handleModuleClick = (mod) => {
  playButtonPop()
  if (mod.isFree) {
    handleOpenDetail(materiList[0])
  } else {
    selectedTeaserModule.value = mod
    showProTeaserModal.value = true
  }
}

// Navigation state
const currentNav = ref('beranda')
const searchQuery = ref('')

// Sound state
const soundActive = ref(true)
const handleToggleSound = () => {
  soundActive.value = toggleSound()
}

// Interactive Mascot Si Es Batu state
const mascotQuips = [
  'Hai! Aku Si Es Batu 🧊 Siap bertualang bersamaku hari ini?',
  'Tahukah kamu, air es bisa berubah jadi uap kalau dipanaskan! 💧✨',
  'Kamu suka belajar dengan Standard Mode atau Focus Mode? Keduanya asyik! 🎒',
  'Brrr! Dingin tapi seru! Klik aku lagi untuk fakta sains lainnya! 🌟'
]
const currentQuipIndex = ref(0)
const isMascotSpeaking = ref(false)
const isMascotWiggling = ref(false)
let mascotTimer = null

const triggerMascot = () => {
  playMascotChime()
  isMascotWiggling.value = true
  setTimeout(() => {
    isMascotWiggling.value = false
  }, 600)
  currentQuipIndex.value = (currentQuipIndex.value + 1) % mascotQuips.length
  isMascotSpeaking.value = true
  clearTimeout(mascotTimer)
  mascotTimer = setTimeout(() => {
    isMascotSpeaking.value = false
  }, 6500)
}

// Active item and mode tracking
const activeMateriItem = ref(null)
const chosenMode = ref('standard')

// Auth Page state
const authTab = ref('login')
const authNoticeMessage = ref('')
const showUserDropdown = ref(false)

// Pending navigation state (intended destination saved when intercepted by middleware)
const intendedNav = ref(null)

// Close dropdown on outside click
const dropdownRef = ref(null)
const handleOutsideClick = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showUserDropdown.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

/**
 * Navigate to dedicated Auth Page
 */
const navigateToAuth = (tab = 'login', notice = '') => {
  authTab.value = tab
  authNoticeMessage.value = notice
  showUserDropdown.value = false
  currentNav.value = 'auth'
}

const handleBackFromAuth = () => {
  authNoticeMessage.value = ''
  currentNav.value = 'beranda'
}

const handleAuthenticated = (user) => {
  authNoticeMessage.value = ''
  
  // If user was intercepted by middleware, redirect to their intended destination
  if (intendedNav.value) {
    const { tab, item, mode } = intendedNav.value
    intendedNav.value = null
    
    if (item) activeMateriItem.value = item
    if (mode) chosenMode.value = mode
    
    if (tab === 'admin') {
      if (user?.role === 'admin') {
        currentNav.value = 'admin'
      } else {
        currentNav.value = 'beranda'
      }
    } else {
      currentNav.value = tab
    }
    return
  }

  // Default redirect after login/register
  if (user?.role === 'admin') {
    currentNav.value = 'admin'
  } else {
    currentNav.value = 'materi'
  }
}

const handleLogout = async () => {
  await logoutUser()
  showUserDropdown.value = false
  intendedNav.value = null
  if (['admin', ...PROTECTED_ROUTES].includes(currentNav.value)) {
    currentNav.value = 'beranda'
  }
}

/**
 * Middleware-protected Navigation
 */
const navigateTo = (tab) => {
  showUserDropdown.value = false
  
  const guard = canAccessRoute(tab)
  if (!guard.allowed) {
    intendedNav.value = { tab }
    navigateToAuth(guard.tab || 'login', guard.reason)
    return false
  }

  currentNav.value = tab
  return true
}

// Flow Handlers protected by Middleware
const handleOpenDetail = (item) => {
  const targetItem = item || materiList.value[0]
  const guard = canAccessRoute('materi-detail')
  if (!guard.allowed) {
    intendedNav.value = { tab: 'materi-detail', item: targetItem }
    navigateToAuth(guard.tab || 'login', guard.reason)
    return
  }
  activeMateriItem.value = targetItem
  currentNav.value = 'materi-detail'
}

const handleStartAdventure = () => {
  const guard = canAccessRoute('mode-select')
  if (!guard.allowed) {
    intendedNav.value = { tab: 'mode-select' }
    navigateToAuth(guard.tab || 'login', guard.reason)
    return
  }
  currentNav.value = 'mode-select'
}

const handleModeSelected = (mode) => {
  const guard = canAccessRoute('learning-player')
  if (!guard.allowed) {
    intendedNav.value = { tab: 'learning-player', mode }
    navigateToAuth(guard.tab || 'login', guard.reason)
    return
  }
  chosenMode.value = mode
  currentNav.value = 'learning-player'
}

const handlePreviewFromAdmin = (item) => {
  activeMateriItem.value = item
  currentNav.value = 'materi-detail'
}

// Active Middleware Guard Watcher: jika session habis atau route berubah tanpa izin
watch([currentNav, isAuthenticated], ([newNav, isAuth]) => {
  if (newNav === 'auth') return
  const guard = canAccessRoute(newNav)
  if (!guard.allowed) {
    navigateToAuth(guard.tab || 'login', guard.reason)
  }
})
</script>

<template>
  <div class="w-full min-h-screen bg-[#F0F7FF] text-slate-800 font-sans flex flex-col overflow-x-hidden">
    <!-- ==================== HEADER / NAVBAR ==================== -->
    <header class="shrink-0 z-30 sticky top-0" style="background: rgba(255,255,255,0.82); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-bottom: 1px solid rgba(61,165,255,0.15); box-shadow: 0 2px 20px rgba(15,50,97,0.08);">
      <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-[68px] flex items-center justify-between gap-4">

        <!-- Left: Logo + Nav Links -->
        <div class="flex items-center gap-6 lg:gap-8">
          <!-- Logo -->
          <button
            @click="navigateTo('beranda')"
            class="flex items-center gap-2.5 group cursor-pointer shrink-0"
          >
            <div class="relative">
              <img
                src="/Logo.png"
                alt="Logo Inkluvia"
                class="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span class="text-[22px] font-extrabold tracking-tight hidden sm:block" style="background: linear-gradient(135deg, #0F3261 0%, #3587CE 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              Inkluvia
            </span>
          </button>

          <!-- Nav Links -->
          <nav class="hidden md:flex items-center gap-1">
            <button
              @click="navigateTo('beranda')"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer',
                currentNav === 'beranda'
                  ? 'bg-[#0F3261] text-white shadow-sm shadow-[#0F3261]/20'
                  : 'text-slate-600 hover:text-[#0F3261] hover:bg-[#0F3261]/8'
              ]"
            >
              Beranda
            </button>
            <button
              @click="navigateTo('materi')"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer',
                ['materi', 'materi-detail', 'mode-select', 'learning-player'].includes(currentNav)
                  ? 'bg-[#FF7315] text-white shadow-sm shadow-[#FF7315]/20'
                  : 'text-slate-600 hover:text-[#FF7315] hover:bg-[#FF7315]/8'
              ]"
            >
              Materi
            </button>
            <button
              @click="navigateTo('guru')"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer',
                currentNav === 'guru'
                  ? 'bg-[#3DA5FF] text-white shadow-sm shadow-[#3DA5FF]/20'
                  : 'text-slate-600 hover:text-[#3587CE] hover:bg-[#3DA5FF]/8'
              ]"
            >
              Untuk Guru
            </button>
          </nav>
        </div>

        <!-- Right: Search + Auth -->
        <div class="flex items-center gap-3 flex-1 justify-end max-w-sm">
          <!-- Search -->
          <div class="relative flex-1 max-w-[220px] hidden sm:block">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari materi..."
              class="w-full bg-slate-100/80 hover:bg-white focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-full border border-slate-200 focus:border-[#3DA5FF] focus:outline-none focus:ring-2 focus:ring-[#3DA5FF]/20 transition placeholder:text-slate-400 text-slate-700"
            />
          </div>

          <!-- NOT LOGGED IN -->
          <div v-if="!isAuthenticated" class="flex items-center gap-2 shrink-0">
            <button
              @click="navigateToAuth('login')"
              :class="[
                'px-4 py-2 rounded-full border-2 border-[#3DA5FF] font-bold text-sm transition-all duration-200 active:scale-95 cursor-pointer',
                currentNav === 'auth' && authTab === 'login'
                  ? 'bg-[#3DA5FF]/10 text-[#3587CE]'
                  : 'text-[#3587CE] hover:bg-[#3DA5FF]/10'
              ]"
            >
              Masuk
            </button>
            <button
              @click="navigateToAuth('register')"
              class="px-5 py-2 rounded-full text-white font-bold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
              style="background: linear-gradient(135deg,#FF7315,#e86105); box-shadow: 0 4px 14px rgba(255,115,21,0.35);"
            >
              Daftar Gratis
            </button>
          </div>

          <!-- LOGGED IN — User Profile Dropdown -->
          <div v-else class="relative shrink-0" ref="dropdownRef">
            <button
              @click="showUserDropdown = !showUserDropdown"
              class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition cursor-pointer"
              :class="isAdmin ? 'bg-orange-50 border-[#FF7315]/30 hover:bg-orange-100' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'"
            >
              <!-- Avatar -->
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-inner"
                :class="isAdmin ? 'bg-gradient-to-br from-[#FF7315] to-[#e86105]' : 'bg-gradient-to-br from-[#3DA5FF] to-[#0F3261]'"
              >
                {{ currentUser?.avatar || '👤' }}
              </div>
              <!-- Name & Role -->
              <div class="hidden sm:block text-left leading-tight">
                <span class="block text-xs font-bold text-[#0F3261] truncate max-w-[100px]">
                  {{ currentUser?.name }}
                </span>
                <span
                  :class="[
                    'block text-[10px] font-bold',
                    isAdmin ? 'text-[#FF7315]' : 'text-[#3587CE]'
                  ]"
                >
                  {{ isAdmin ? '🛡️ Administrator' : 'Pengguna' }}
                </span>
              </div>
              <ChevronDown
                :class="['w-3.5 h-3.5 text-slate-400 transition-transform duration-200', showUserDropdown ? 'rotate-180' : '']"
              />
            </button>

            <!-- Dropdown Panel -->
            <Transition name="dropdown">
              <div
                v-if="showUserDropdown"
                class="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden"
              >
                <!-- User Info Header -->
                <div class="px-4 py-3.5 bg-gradient-to-r from-[#F4F8FD] to-white border-b border-slate-100">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#3DA5FF] to-[#0F3261] flex items-center justify-center text-lg shadow">
                      {{ currentUser?.avatar || '👤' }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-[#0F3261] truncate max-w-[150px]">{{ currentUser?.name }}</p>
                      <p class="text-[11px] text-slate-400 truncate max-w-[150px]">{{ currentUser?.email }}</p>
                      <span
                        :class="[
                          'inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold',
                          currentUser?.role === 'admin'
                            ? 'bg-orange-100 text-[#FF7315]'
                            : 'bg-blue-100 text-[#3587CE]'
                        ]"
                      >
                        {{ currentUser?.role === 'admin' ? 'Administrator' : 'Pengguna' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Menu Items -->
                <div class="p-2 space-y-0.5">
                  <!-- Admin Panel — hanya tampil jika admin -->
                  <button
                    v-if="isAdmin"
                    @click="navigateTo('admin')"
                    class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-white cursor-pointer transition"
                    style="background: linear-gradient(135deg,#FF7315,#e86105); box-shadow: 0 3px 10px rgba(255,115,21,0.30);"
                  >
                    <LayoutDashboard class="w-4 h-4" />
                    Dashboard Admin
                    <span class="ml-auto text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">CMS</span>
                  </button>

                  <button
                    @click="navigateTo('materi'); showUserDropdown = false"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#3587CE] transition cursor-pointer"
                  >
                    <GraduationCap class="w-4 h-4 text-[#3587CE]" />
                    Jelajahi Materi
                  </button>
                </div>

                <!-- Logout -->
                <div class="p-2 border-t border-slate-100">
                  <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut class="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <!-- ==================== VIEW: BERANDA ==================== -->
    <main v-if="currentNav === 'beranda'" class="flex-1 flex flex-col">

      <!-- ===== HERO SECTION (CLEAN, PLAYFUL & BALANCED EDTECH STYLE) ===== -->
      <section class="relative w-full overflow-hidden flex flex-col justify-center min-h-[calc(100vh-68px)] lg:h-[calc(100vh-68px)]" style="background-color: #F8FAFD; background-image: radial-gradient(#d3e4f7 1.2px, transparent 1.2px); background-size: 30px 30px; border-bottom: 1px solid rgba(61, 165, 255, 0.15);">
        
        <!-- Grid Vignette Overlay -->
        <div class="absolute inset-0 pointer-events-none z-0" style="background: radial-gradient(ellipse at 50% 50%, transparent 25%, #F8FAFD 100%);"></div>

        <!-- Left Background Ornaments (Top Left Sunburst + Playful Blobs) -->
        <div class="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#FFDC58]/35 blur-3xl pointer-events-none z-0"></div>
        <svg class="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 text-[#FFDC58]/90 pointer-events-none z-0 select-none" viewBox="0 0 200 200" fill="none">
          <path d="M-40,0 A140,140 0 0,1 140,-40 L0,-40 Z" fill="currentColor"/>
        </svg>

        <!-- Left Side Floating Doodle Ornaments -->
        <!-- 1. Floating Flying Paper Airplane (Left Top Sky) -->
        <div class="absolute top-12 left-8 sm:left-16 z-10 pointer-events-none transform -rotate-12 animate-bounce-subtle hidden md:block">
          <svg class="w-14 h-14 text-[#FF7315]" viewBox="0 0 100 100" fill="none">
            <path d="M10,80 Q40,25 85,30" stroke="#0F3261" stroke-width="2.5" stroke-dasharray="4,4"/>
            <path d="M85,30 L45,15 L55,45 Z" fill="#FFDC58" stroke="#0F3261" stroke-width="2.5" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- 2. Floating Star Sparkle (Left Middle) -->
        <div class="absolute bottom-24 left-6 sm:left-12 z-10 pointer-events-none text-2xl text-[#FFDC58] animate-spin-slow hidden sm:block">
          ⭐
        </div>

        <!-- Giant Stroke Background Text -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <span class="text-[22vw] font-black tracking-tighter text-transparent opacity-[0.05]" style="-webkit-text-stroke: 3px #0F3261; transform: translateY(-5%);">INKLUVIA</span>
        </div>

        <!-- Sound Toggle Button (Clean corner placement) -->
        <button
          @click="handleToggleSound"
          class="absolute top-4 right-4 sm:right-6 z-40 p-2 rounded-full bg-white/90 backdrop-blur border border-slate-200 text-slate-600 hover:text-[#0F3261] hover:border-[#3DA5FF] shadow-2xs transition cursor-pointer"
          :title="soundActive ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'"
        >
          <Volume2 v-if="soundActive" class="w-4 h-4 text-[#3587CE]" />
          <VolumeX v-else class="w-4 h-4 text-slate-400" />
        </button>

        <!-- Main Content Wrapper: Vertically Centered Grid -->
        <div class="relative z-10 w-full flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col justify-center py-6 lg:py-8">
          
          <!-- Desktop 2-Column Grid (items-center makes text & photo perfectly aligned) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">

            <!-- LEFT: Text Content (6 cols) -->
            <div class="lg:col-span-6 xl:col-span-5 space-y-6 text-left relative z-20">
              
              <!-- Eyebrow Badge -->
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-blue-200/80 shadow-2xs text-xs font-extrabold text-[#0F3261]">
                <span class="w-2 h-2 rounded-full bg-[#FF7315]"></span>
                <span>Platform Pembelajaran Ramah Anak & Inklusif</span>
              </div>

              <!-- Headline with Accent Sparks & Playful Doodles -->
              <div class="space-y-1 relative">
                <!-- Decorative Sparkle Badge next to Headline -->
                <div class="absolute -top-6 -right-2 text-xl pointer-events-none animate-pulse-subtle hidden sm:block">
                  ✨
                </div>

                <h1 class="font-black text-[#0F3261] tracking-tight leading-[1.10]">
                  <span class="block text-3xl sm:text-5xl lg:text-[3.2rem] xl:text-[3.7rem]">
                    Belajar dengan
                    <span class="text-[#FFDC58] inline-block ml-1 font-sans text-2xl lg:text-3xl animate-bounce-subtle">//</span>
                  </span>
                  <span class="block text-3xl sm:text-5xl lg:text-[3.2rem] xl:text-[3.7rem] mt-0.5">
                    <span class="text-[#FF7315] relative inline-block">
                      Cara yang Sesuai
                      <!-- Cheerful playful underline swoosh -->
                      <svg class="absolute -bottom-2 left-0 w-full h-3.5 text-[#FFDC58]" viewBox="0 0 250 12" fill="none" preserveAspectRatio="none">
                        <path d="M3 9C50 3 150 2 247 8" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
                      </svg>
                    </span>
                  </span>
                  <span class="block text-3xl sm:text-5xl lg:text-[3.2rem] xl:text-[3.7rem] mt-0.5">untukmu!</span>
                </h1>
              </div>

              <!-- Subtitle -->
              <p class="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
                Jelajahi media pembelajaran interaktif yang dirancang untuk berbagai cara belajar anak Indonesia — ramah, menyenangkan, dan bebas hambatan.
              </p>

              <!-- CTA Buttons -->
              <div class="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  @click="handleOpenDetail(materiList[0]); playButtonPop()"
                  class="btn-tactile-orange px-8 py-3.5 font-extrabold text-sm flex items-center gap-2.5 cursor-pointer shadow-md"
                >
                  <span>Mulai Belajar</span>
                  <ArrowRight class="w-4 h-4" />
                </button>
                <button
                  @click="navigateTo('materi'); playButtonPop()"
                  class="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#0F3261] font-extrabold text-sm border-2 border-[#0F3261] flex items-center gap-2.5 transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Play class="w-4 h-4 fill-[#0F3261] text-[#0F3261]" />
                  <span>Jelajahi Materi</span>
                </button>
              </div>

            </div>

            <!-- RIGHT: Artwork & Mascot Speech Pill directly over Si Es Batu -->
            <div class="lg:col-span-6 xl:col-span-7 relative flex flex-col items-center justify-center">
              
              <!-- Floating Video Player Widget (Above artwork center) -->
              <div class="absolute -top-6 left-12 lg:left-24 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border-2 border-blue-100 flex items-center gap-2.5 pointer-events-none transform -rotate-2 hidden sm:flex">
                <div class="w-6 h-6 rounded-xl bg-[#3DA5FF] text-white flex items-center justify-center shadow-xs">
                  <Play class="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <div class="w-14 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div class="w-2/3 h-full bg-[#3DA5FF] rounded-full"></div>
                </div>
              </div>

              <!-- Main Artwork Image (`Banner_Dashboard2.jpg`) -->
              <div class="w-full flex justify-center items-center relative">
                
                <!-- Cute & Friendly Mascot Speech Pill Badge (Positioned directly over Si Es Batu's head) -->
                <div class="pointer-events-auto absolute top-[14%] sm:top-[16%] left-[58%] sm:left-[59%] -translate-x-1/2 z-30">
                  <div class="relative flex flex-col items-center">
                    <!-- Active Mascot Speech Dialog Box (when clicked) -->
                    <Transition name="bubble">
                      <div
                        v-if="isMascotSpeaking"
                        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 sm:w-68 bg-gradient-to-b from-white to-sky-50 text-[#0F3261] p-3.5 rounded-2xl shadow-2xl border-2 border-[#3DA5FF] text-xs font-black animate-bubble-pop text-center z-40"
                      >
                        <span class="block text-slate-800 leading-snug">{{ mascotQuips[currentQuipIndex] }}</span>
                        <!-- Speech Bubble Arrow pointing down -->
                        <div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#3DA5FF]"></div>
                      </div>
                    </Transition>

                    <!-- Trigger Button Pill -->
                    <button
                      @click="triggerMascot"
                      class="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white hover:bg-sky-50 text-[#0F3261] hover:text-[#FF7315] font-black text-xs sm:text-sm shadow-xl shadow-[#3DA5FF]/20 border-2 border-[#3DA5FF] hover:border-[#FF7315] flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer select-none whitespace-nowrap relative group"
                      :class="{ 'animate-wiggle': isMascotWiggling }"
                    >
                      <span class="text-base group-hover:rotate-12 transition-transform">🧊</span>
                      <span>Halo Si Es Batu! ✨</span>
                      <!-- Little Speech Stem pointing down to mascot -->
                      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-[#3DA5FF] group-hover:border-t-[#FF7315] transition-colors"></div>
                    </button>
                  </div>
                </div>

                <img
                  src="/Banner_Dashboard2.jpg"
                  alt="Anak-anak belajar bersama Si Es Batu"
                  class="w-full max-w-[720px] xl:max-w-[800px] h-auto object-contain select-none pointer-events-none block rounded-3xl"
                  style="mix-blend-mode: multiply;"
                />
              </div>

            </div>

          </div>
        </div>

      </section>

      <!-- ==================== SECTION 1: PILAR NILAI & AKSESIBILITAS ==================== -->
      <section class="w-full bg-[#F0F7FF] px-4 sm:px-6 lg:px-10 py-16 sm:py-20 relative overflow-hidden border-b border-blue-100/60">
        <div class="w-full max-w-[1440px] mx-auto space-y-12">
          
          <!-- Section Header -->
          <div class="text-center max-w-3xl mx-auto space-y-3">
            <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-[#3587CE] text-xs font-extrabold tracking-wide uppercase">
              MENGAPA INKLUVIA
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-[#0F3261] tracking-tight">
              Didesain untuk Memahami Keunikan Cara Belajar Setiap Anak
            </h2>
            <p class="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Tidak ada anak yang tertinggal. Kami merancang setiap media pembelajaran agar mudah dipahami, bebas tekanan, dan menyenangkan.
            </p>
          </div>

          <!-- 4 Feature Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <!-- Card 1: Multi-Sensori -->
            <div class="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div class="space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-[#FF7315] text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform">
                  <Headphones class="w-7 h-7" />
                </div>
                <h3 class="text-lg font-extrabold text-[#0F3261]">Mode Multi-Sensori</h3>
                <p class="text-xs text-slate-500 font-medium leading-relaxed">
                  Setiap teks narasi dilengkapi panduan suara berbahasa Indonesia yang ramah, membantu anak yang lebih mudah memahami lewat pendengaran.
                </p>
              </div>

              <!-- Interactive Audio Sample Demo Button -->
              <div class="pt-5 mt-4 border-t border-slate-100">
                <button
                  @click="playAudioNarrationSample"
                  class="w-full py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF7315] text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Volume2 :class="['w-4 h-4', isAudioNarrationPlaying ? 'animate-bounce' : '']" />
                  <span>{{ isAudioNarrationPlaying ? 'Memutar Suara Narator... 🎵' : 'Coba Contoh Suara 🔊' }}</span>
                </button>
              </div>
            </div>

            <!-- Card 2: Tipografi Ramah Baca & Disleksia -->
            <div class="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div class="space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-[#3DA5FF] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Type class="w-7 h-7" />
                </div>
                <h3 class="text-lg font-extrabold text-[#0F3261]">Tipografi Ramah Disleksia</h3>
                <p class="text-xs text-slate-500 font-medium leading-relaxed" :class="{ 'tracking-wider font-mono': isDyslexiaDemoActive }">
                  {{ isDyslexiaDemoActive ? 'P a n d u a n   t e k s   d e n g a n   s p a s i   l a p a n g   d a n   j e l a s.' : 'Pilihan jenis huruf yang dirancang khusus untuk mengurangi kebingungan huruf serupa serta ukuran teks yang mudah dibaca.' }}
                </p>
              </div>

              <!-- Interactive Toggle Demo -->
              <div class="pt-5 mt-4 border-t border-slate-100">
                <button
                  @click="isDyslexiaDemoActive = !isDyslexiaDemoActive"
                  class="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#3587CE] text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>{{ isDyslexiaDemoActive ? 'Tampilan: Ramah Disleksia ✓' : 'Coba Demo Mode Font ⇄' }}</span>
                </button>
              </div>
            </div>

            <!-- Card 3: Zero-Pressure Pace -->
            <div class="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div class="space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-[#E1529C] text-white flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform">
                  <Clock class="w-7 h-7" />
                </div>
                <h3 class="text-lg font-extrabold text-[#0F3261]">Belajar Tanpa Rasa Cemas</h3>
                <p class="text-xs text-slate-500 font-medium leading-relaxed">
                  Tidak ada penalti waktu atau suara peringatan yang memicu rasa panik. Anak bebas mengulang materi sesuka hati hingga paham.
                </p>
              </div>
              <div class="pt-5 mt-4 border-t border-slate-100">
                <span class="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#E1529C] bg-pink-50 px-3 py-1.5 rounded-xl w-full justify-center">
                  ⏱️ Bebas Batas Waktu
                </span>
              </div>
            </div>

            <!-- Card 4: Aman & Bebas Iklan -->
            <div class="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div class="space-y-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-[#54AA1B] text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck class="w-7 h-7" />
                </div>
                <h3 class="text-lg font-extrabold text-[#0F3261]">Aman & Bebas Iklan</h3>
                <p class="text-xs text-slate-500 font-medium leading-relaxed">
                  Ekosistem tertutup tanpa tautan luar berbahaya, tanpa pelacak data komersial, dan 100% bebas dari tayangan iklan.
                </p>
              </div>
              <div class="pt-5 mt-4 border-t border-slate-100">
                <span class="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#54AA1B] bg-emerald-50 px-3 py-1.5 rounded-xl w-full justify-center">
                  🛡️ 100% Terproteksi
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- ==================== SECTION 2: PRATINJAU MATERI & AKTIVITAS ==================== -->
      <section class="w-full bg-white px-4 sm:px-6 lg:px-10 py-16 sm:py-20 border-b border-slate-100">
        <div class="w-full max-w-[1440px] mx-auto space-y-10">
          
          <!-- Section Header -->
          <div class="text-center max-w-3xl mx-auto space-y-3">
            <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 text-[#FF7315] text-xs font-extrabold tracking-wide uppercase">
              JELAJAHI MATERI
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-[#0F3261] tracking-tight">
              Petualangan Seru Menanti Setiap Hari
            </h2>
            <p class="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Pilih topik yang ingin dipelajari hari ini dan nikmati cara belajar yang interaktif.
            </p>
          </div>

          <!-- Category Filter Tabs -->
          <div class="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
            <button
              @click="activeCategoryTab = 'semua'"
              :class="[
                'px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition cursor-pointer',
                activeCategoryTab === 'semua'
                  ? 'bg-[#0F3261] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              Semua Materi
            </button>
            <button
              @click="activeCategoryTab = 'membaca'"
              :class="[
                'px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition cursor-pointer',
                activeCategoryTab === 'membaca'
                  ? 'bg-[#FF7315] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              Membaca & Fonik (4–6 Thn)
            </button>
            <button
              @click="activeCategoryTab = 'logika'"
              :class="[
                'px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition cursor-pointer',
                activeCategoryTab === 'logika'
                  ? 'bg-[#3DA5FF] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              Logika & Angka (6–8 Thn)
            </button>
            <button
              @click="activeCategoryTab = 'emosi'"
              :class="[
                'px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition cursor-pointer',
                activeCategoryTab === 'emosi'
                  ? 'bg-[#E1529C] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              Cerita Sosial & Emosi
            </button>
            <button
              @click="activeCategoryTab = 'lingkungan'"
              :class="[
                'px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition cursor-pointer',
                activeCategoryTab === 'lingkungan'
                  ? 'bg-[#54AA1B] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              Eksplorasi Lingkungan (7–10 Thn)
            </button>
          </div>

          <!-- Module Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div
              v-for="mod in sampleModules.filter(m => activeCategoryTab === 'semua' || m.category === activeCategoryTab)"
              :key="mod.id"
              class="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group relative"
            >
              <!-- Card Top Image Banner -->
              <div class="relative h-44 w-full overflow-hidden bg-slate-100">
                <img :src="mod.image" :alt="mod.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                <!-- Free vs Pro Lock Badge Overlay -->
                <div class="absolute top-3 left-3 z-10">
                  <span v-if="mod.isFree" class="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-md flex items-center gap-1">
                    ⭐ GRATIS
                  </span>
                  <span v-else class="px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md flex items-center gap-1">
                    <Lock class="w-3 h-3" /> PRO
                  </span>
                </div>

                <div class="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-extrabold text-[#0F3261] shadow-2xs">
                  {{ mod.ageLabel }}
                </div>

                <!-- Pro Lock Glassmorphism Blur Overlay -->
                <div v-if="mod.isPro" class="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                  <div class="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-extrabold text-amber-600 border border-amber-200 shadow-md flex items-center gap-1.5">
                    <Lock class="w-3.5 h-3.5 text-amber-600" />
                    <span>Konten Premium</span>
                  </div>
                </div>
              </div>

              <!-- Card Body Content -->
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div class="space-y-2">
                  <!-- Sensoric Badges -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-for="(badge, idx) in mod.badges"
                      :key="idx"
                      class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-50 text-[#3587CE]"
                    >
                      {{ badge }}
                    </span>
                  </div>

                  <h3 class="text-base font-extrabold text-[#0F3261] group-hover:text-[#FF7315] transition-colors leading-snug">
                    {{ mod.title }}
                  </h3>
                  <p class="text-xs text-slate-500 font-medium leading-relaxed">
                    {{ mod.summary }}
                  </p>
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span class="text-[11px] font-bold text-slate-400">{{ mod.categoryLabel }}</span>
                  <button
                    @click="handleModuleClick(mod)"
                    :class="[
                      'px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer rounded-full transition active:scale-95 shadow-sm',
                      mod.isFree ? 'btn-tactile-orange' : 'bg-gradient-to-r from-amber-500 to-[#FF7315] text-white hover:brightness-110'
                    ]"
                  >
                    <span>{{ mod.isFree ? 'Coba Demo Gratis' : 'Buka Akses PRO' }}</span>
                    <ArrowRight v-if="mod.isFree" class="w-3.5 h-3.5" />
                    <Lock v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- PRO TEASER MODAL (Anti-Spoiler & High Conversion) -->
      <Transition name="dropdown">
        <div v-if="showProTeaserModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-amber-200 relative animate-bubble-pop">
            <!-- Close Button -->
            <button
              @click="showProTeaserModal = false"
              class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <!-- Modal Header -->
            <div class="text-center space-y-3">
              <div class="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-[#FF7315] text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 text-2xl">
                🔒
              </div>
              <span class="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase">
                KONTEN PREMIUM PRO
              </span>
              <h3 class="text-xl sm:text-2xl font-black text-[#0F3261]">
                {{ selectedTeaserModule?.title }}
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {{ selectedTeaserModule?.summary }}
              </p>
            </div>

            <!-- Lock Feature Value List -->
            <div class="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 space-y-2.5 text-xs text-amber-900 font-medium">
              <div class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-amber-600 shrink-0" />
                <span>Akses 20+ Video Pembelajaran HD Cloudinary CDN</span>
              </div>
              <div class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-amber-600 shrink-0" />
                <span>Standard Mode & Focus Mode Bebas Distraksi</span>
              </div>
              <div class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-amber-600 shrink-0" />
                <span>Kuis Interaktif & Lencana Stiker Si Es Batu</span>
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="space-y-3 pt-2">
              <button
                @click="showProTeaserModal = false; navigateToAuth('register', 'Daftar akun gratis sekarang untuk membuka modul premium Inkluvia!')"
                class="btn-tactile-orange w-full py-3.5 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Daftar Akun Gratis Sekarang ➔</span>
              </button>
              <button
                @click="showProTeaserModal = false; navigateToAuth('login')"
                class="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-[#0F3261] transition cursor-pointer"
              >
                Sudah punya akun? Masuk di sini
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ==================== SECTION 3: MENGENAL MASKOT "SI ES BATU" ==================== -->
      <section class="w-full bg-[#F0F7FF] px-4 sm:px-6 lg:px-10 py-16 sm:py-20 relative overflow-hidden border-b border-blue-100/60">
        <div class="w-full max-w-[1440px] mx-auto">
          
          <div class="bg-gradient-to-br from-white via-blue-50/50 to-white rounded-3xl border-2 border-blue-200/80 p-8 sm:p-12 lg:p-14 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative">
            
            <!-- LEFT: 3D Mascot Banner Card with Sound Trigger -->
            <div class="lg:col-span-5 flex flex-col items-center justify-center relative space-y-4">
              <div class="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-[#3DA5FF]/20 to-[#FF7315]/20 flex items-center justify-center group">
                <img src="/es_batu_card.jpg" alt="Si Es Batu Mascot" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md text-center border border-blue-100 flex items-center justify-between">
                  <span class="text-xs font-black text-[#0F3261]">🧊 Si Es Batu</span>
                  <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-100 text-[#FF7315]">Pendamping Virtual</span>
                </div>
              </div>

              <!-- Interactive Voice Button -->
              <button
                @click="triggerMascot"
                class="w-full max-w-[320px] py-2.5 px-4 rounded-full bg-white hover:bg-blue-50 text-[#0F3261] border-2 border-[#3DA5FF] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Volume2 class="w-4 h-4 text-[#3587CE]" />
                <span>🔊 Sapa Sahabat Belajar!</span>
              </button>
            </div>

            <!-- RIGHT: Mascot Features & Positive Gamification -->
            <div class="lg:col-span-7 space-y-6 text-left">
              <div class="space-y-2">
                <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-[#3587CE] text-xs font-extrabold tracking-wide uppercase">
                  SAHABAT BELAJAR
                </span>
                <h2 class="text-2xl sm:text-4xl font-extrabold text-[#0F3261] tracking-tight">
                  Si Es Batu: Sahabat yang Selalu Mendukungmu
                </h2>
                <p class="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                  Fitur <b>Gamifikasi Edukatif</b> berbasis pendamping virtual ramah anak. Tanpa persaingan skor atau tekanan waktu, Si Es Batu hadir memvalidasi setiap langkah kecil anak.
                </p>
              </div>

              <div class="space-y-4 pt-2">
                <!-- 1. Umpan Balik Positif -->
                <div class="flex items-start gap-4 p-4 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition">
                  <div class="w-11 h-11 rounded-2xl bg-orange-100 text-[#FF7315] flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <Smile class="w-6 h-6" />
                  </div>
                  <div>
                    <h4 class="text-sm font-extrabold text-[#0F3261]">Umpan Balik Positif (*Positive Reinforcement*)</h4>
                    <p class="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                      Maskot memberikan animasi ekspresi ceria dan pesan penyemangat setiap kali latihan diselesaikan.
                    </p>
                  </div>
                </div>

                <!-- 2. Koleksi Lencana -->
                <div class="flex items-start gap-4 p-4 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition">
                  <div class="w-11 h-11 rounded-2xl bg-blue-100 text-[#3587CE] flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <Award class="w-6 h-6" />
                  </div>
                  <div>
                    <h4 class="text-sm font-extrabold text-[#0F3261]">Koleksi Lencana Digital (*Badges*)</h4>
                    <p class="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                      Anak mendapatkan stiker digital tanpa sistem peringkat yang membandingkan performa dengan anak lain.
                    </p>
                  </div>
                </div>

                <!-- 3. Pengingat Istirahat -->
                <div class="flex items-start gap-4 p-4 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition">
                  <div class="w-11 h-11 rounded-2xl bg-pink-100 text-[#E1529C] flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <Brain class="w-6 h-6" />
                  </div>
                  <div>
                    <h4 class="text-sm font-extrabold text-[#0F3261]">Pengingat Istirahat (*Mindful Breaks*)</h4>
                    <p class="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                      Jika anak belajar lebih dari batas waktu yang dianjurkan, maskot mengajak anak meregangkan badan dan beristirahat.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      <!-- ==================== SECTION 4: RUANG KHUSUS GURU & ORANG TUA ==================== -->
      <section class="w-full bg-white px-4 sm:px-6 lg:px-10 py-16 sm:py-20 border-b border-slate-100">
        <div class="w-full max-w-[1440px] mx-auto space-y-12">
          
          <!-- Section Header -->
          <div class="text-center max-w-3xl mx-auto space-y-3">
            <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#54AA1B] text-xs font-extrabold tracking-wide uppercase">
              DUKUNGAN PENDAMPING
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-[#0F3261] tracking-tight">
              Kolaborasi Nyaman antara Sekolah dan Rumah
            </h2>
            <p class="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Dukungan alat bantu lengkap agar pendampingan belajar menjadi lebih terarah dan menyenangkan.
            </p>
          </div>

          <!-- Dual-Cards Split Layout -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Card A: Untuk Guru & Pendidik -->
            <div class="bg-gradient-to-br from-[#F4F9FF] to-white rounded-3xl p-8 sm:p-10 border-2 border-blue-100 shadow-md flex flex-col justify-between space-y-8 relative group">
              <div class="space-y-5">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-[#3587CE]">
                  UNTUK GURU & PENDIDIK INKLUSI
                </span>
                <h3 class="text-xl sm:text-2xl font-extrabold text-[#0F3261]">
                  Fasilitasi Kebutuhan Belajar Siswa di Kelas
                </h3>

                <ul class="space-y-3.5 text-xs sm:text-sm text-slate-600 font-medium">
                  <li class="flex items-start gap-3">
                    <CheckCircle2 class="w-5 h-5 text-[#3DA5FF] shrink-0 mt-0.5" />
                    <span>Lembar kerja yang siap dicetak (*Printable Activity Sheets*).</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <CheckCircle2 class="w-5 h-5 text-[#3DA5FF] shrink-0 mt-0.5" />
                    <span>Panduan penerapan materi yang selaras dengan Kurikulum Merdeka.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <CheckCircle2 class="w-5 h-5 text-[#3DA5FF] shrink-0 mt-0.5" />
                    <span>Opsi penyesuaian materi untuk murid dengan kebutuhan individual.</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  @click="navigateTo('guru')"
                  class="btn-tactile-orange w-full py-3.5 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Kunjungi Portal Guru</span>
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Card B: Untuk Orang Tua -->
            <div class="bg-gradient-to-br from-[#FFF8F3] to-white rounded-3xl p-8 sm:p-10 border-2 border-orange-100 shadow-md flex flex-col justify-between space-y-8 relative group">
              <div class="space-y-5">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-[#FF7315]">
                  UNTUK ORANG TUA DI RUMAH
                </span>
                <h3 class="text-xl sm:text-2xl font-extrabold text-[#0F3261]">
                  Dampingi Tumbuh Kembang Tanpa Bingung
                </h3>

                <ul class="space-y-3.5 text-xs sm:text-sm text-slate-600 font-medium">
                  <li class="flex items-start gap-3">
                    <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                    <span>Ringkasan aktivitas belajar mingguan yang mudah dipahami.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                    <span>Ide aktivitas motorik dan percakapan pendukung di luar gawai.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                    <span>Panduan mendampingi anak saat mengalami kelelahan belajar (*sensory overload*).</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  @click="navigateTo('guru')"
                  class="btn-tactile-white w-full py-3.5 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs border-2 border-[#0F3261] text-[#0F3261]"
                >
                  <span>Baca Panduan Orang Tua</span>
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- ==================== SECTION 5: TESTIMONI & VALIDASI PRAKTISI ==================== -->
      <section class="w-full bg-[#F0F7FF] px-4 sm:px-6 lg:px-10 py-16 sm:py-20 border-b border-blue-100/60">
        <div class="w-full max-w-[1440px] mx-auto space-y-12">
          
          <!-- Section Header -->
          <div class="text-center max-w-3xl mx-auto space-y-3">
            <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-[#E1529C] text-xs font-extrabold tracking-wide uppercase">
              CERITA MEREKA
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-[#0F3261] tracking-tight">
              Dipercaya oleh Pengajar dan Keluarga di Seluruh Indonesia
            </h2>
          </div>

          <!-- 3 Testimonial Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <!-- Testimonial 1 -->
            <div class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 relative">
              <div class="space-y-4">
                <div class="text-amber-400 text-lg">⭐⭐⭐⭐⭐</div>
                <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                  "Materi visual Inkluvia sangat membantu murid-murid saya yang butuh waktu adaptasi lebih lama. Mereka jadi lebih fokus karena ritme belajarnya tenang dan tidak menuntut."
                </p>
              </div>

              <div class="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 text-lg flex items-center justify-center shadow-inner">
                  👩‍🏫
                </div>
                <div class="text-left">
                  <h4 class="text-xs font-extrabold text-[#0F3261]">Bu Ratna</h4>
                  <p class="text-[11px] font-medium text-slate-400">Guru Kelas Inklusi SD</p>
                </div>
              </div>
            </div>

            <!-- Testimonial 2 -->
            <div class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 relative">
              <div class="space-y-4">
                <div class="text-amber-400 text-lg">⭐⭐⭐⭐⭐</div>
                <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                  "Anak saya sering frustrasi saat belajar membaca di buku biasa. Lewat narasi suara dan karakter es batu di Inkluvia, dia justru berinisiatif belajar sendiri tiap sore."
                </p>
              </div>

              <div class="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-orange-100 text-lg flex items-center justify-center shadow-inner">
                  👨‍👦
                </div>
                <div class="text-left">
                  <h4 class="text-xs font-extrabold text-[#0F3261]">Dimas P.</h4>
                  <p class="text-[11px] font-medium text-slate-400">Orang Tua Murid Usia 6 Tahun</p>
                </div>
              </div>
            </div>

            <!-- Testimonial 3 -->
            <div class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 relative">
              <div class="space-y-4">
                <div class="text-amber-400 text-lg">⭐⭐⭐⭐⭐</div>
                <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                  "Pilihan warna kontras yang lembut serta navigasi minim distraksi membuat platform ini aman direkomendasikan untuk anak-anak dengan spektrum perhatian terbatas."
                </p>
              </div>

              <div class="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-emerald-100 text-lg flex items-center justify-center shadow-inner">
                  👩‍⚕️
                </div>
                <div class="text-left">
                  <h4 class="text-xs font-extrabold text-[#0F3261]">Nadia S., M.Psi.</h4>
                  <p class="text-[11px] font-medium text-slate-400">Praktisi Perkembangan Anak</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- ==================== SECTION 6: FINAL CALL-TO-ACTION BANNER ==================== -->
      <section class="w-full bg-white px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div class="w-full max-w-[1440px] mx-auto">
          
          <div
            class="rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl flex flex-col items-center justify-center space-y-8"
            style="background: linear-gradient(135deg, #0F3261 0%, #144080 40%, #FF7315 100%);"
          >
            <!-- Background Decorative Blobs -->
            <div class="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl pointer-events-none"></div>

            <div class="max-w-2xl space-y-4 relative z-10">
              <span class="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur text-white text-xs font-black uppercase tracking-wider">
                MULAI SEKARANG
              </span>
              <h2 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Mulai Perjalanan Belajar yang Lebih Ramah dan Menyenangkan!
              </h2>
              <p class="text-sm sm:text-base text-blue-100 font-medium leading-relaxed">
                Daftar akun gratis sekarang dan nikmati seluruh modul interaktif Inkluvia bersama si kecil.
              </p>
            </div>

            <!-- CTA Action Button -->
            <div class="relative z-10 flex flex-col sm:flex-row items-center gap-4">
              <button
                @click="navigateToAuth('register')"
                class="btn-tactile-orange px-10 py-4 font-black text-base flex items-center gap-3 cursor-pointer shadow-xl"
              >
                <span>Daftar Akun Gratis Sekarang</span>
                <ArrowRight class="w-5 h-5" />
              </button>
            </div>

            <!-- Trust Elements -->
            <div class="relative z-10 flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-bold text-blue-100">
              <div class="flex items-center gap-2">
                <Check class="w-4 h-4 text-[#FFDC58]" />
                <span>Tanpa biaya tersembunyi</span>
              </div>
              <div class="flex items-center gap-2">
                <Check class="w-4 h-4 text-[#FFDC58]" />
                <span>Materi ramah anak & inklusif</span>
              </div>
              <div class="flex items-center gap-2">
                <Check class="w-4 h-4 text-[#FFDC58]" />
                <span>Akses langsung dari peramban</span>
              </div>
            </div>

          </div>

        </div>
      </section>
    </main>




    <!-- ==================== VIEW: KATALOG MATERI ==================== -->
    <main v-else-if="currentNav === 'materi' && isAuthenticated" class="w-full flex-1 flex flex-col">
      <MateriView
        :search-query="searchQuery"
        @open-detail="handleOpenDetail"
      />
    </main>

    <!-- ==================== VIEW: DETAIL MATERI ==================== -->
    <main v-else-if="currentNav === 'materi-detail' && isAuthenticated" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <MateriDetailView
        :materi="activeMateriItem || materiList[0]"
        @back="navigateTo('materi')"
        @start="handleStartAdventure"
      />
    </main>

    <!-- ==================== VIEW: PILIH MODE BELAJAR ==================== -->
    <main v-else-if="currentNav === 'mode-select' && isAuthenticated" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <ModeSelectView
        :materi="activeMateriItem || materiList[0]"
        @back="navigateTo('materi-detail')"
        @select-mode="handleModeSelected"
      />
    </main>

    <!-- ==================== VIEW: LEARNING PLAYER ==================== -->
    <main v-else-if="currentNav === 'learning-player' && isAuthenticated" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <LearningPlayerView
        :materi="activeMateriItem || materiList[0]"
        :initial-mode="chosenMode"
        @back="navigateTo('mode-select')"
        @finish="navigateTo('materi')"
      />
    </main>

    <!-- ==================== VIEW: DASHBOARD ADMIN ==================== -->
    <main v-else-if="currentNav === 'admin' && isAdmin" class="w-full flex-1">
      <AdminDashboard
        @preview-materi="handlePreviewFromAdmin"
        @back-to-app="navigateTo('materi')"
        @open-auth="navigateToAuth('login')"
      />
    </main>

    <!-- ==================== VIEW: UNTUK GURU ==================== -->
    <main v-else-if="currentNav === 'guru' && isAuthenticated" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <GuruView />
    </main>

    <!-- ==================== VIEW: AUTH (LOGIN & REGISTER PAGE) ==================== -->
    <main v-else-if="currentNav === 'auth'" class="w-full flex-1 flex flex-col">
      <AuthView
        :initial-tab="authTab"
        :notice-message="authNoticeMessage"
        @authenticated="handleAuthenticated"
        @back-to-home="handleBackFromAuth"
      />
    </main>

    <!-- ==================== VIEW: DEFAULT FALLBACK (AUTH GUARD) ==================== -->
    <main v-else class="flex-1 flex items-center justify-center p-8 text-center">
      <div class="max-w-md space-y-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div class="w-14 h-14 rounded-2xl bg-[#FFEFE6] text-[#FF7315] flex items-center justify-center mx-auto">
          <Lock class="w-7 h-7" />
        </div>
        <h2 class="text-xl font-extrabold text-[#0F3261]">Akses Dibatasi</h2>
        <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Silakan masuk atau buat akun Inkluvia untuk mengakses konten pembelajaran interaktif ini.
        </p>
        <div class="flex items-center justify-center gap-3 pt-2">
          <button
            @click="navigateToAuth('login', 'Silakan masuk untuk melanjutkan belajar.')"
            class="px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-md transition cursor-pointer"
            style="background: linear-gradient(135deg,#FF7315,#e86105);"
          >
            Masuk Akun
          </button>
          <button
            @click="navigateTo('beranda')"
            class="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </main>

    <!-- ==================== FOOTER ==================== -->
    <footer v-if="!['learning-player', 'auth'].includes(currentNav)" class="w-full text-white mt-auto relative overflow-hidden shrink-0" style="background: linear-gradient(160deg, #092040 0%, #0F3261 50%, #144080 100%);">
      <!-- Decorative blobs in footer -->
      <div class="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10" style="background: radial-gradient(circle, #3DA5FF 0%, transparent 70%); transform: translate(30%, -30%);"></div>
      <div class="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none opacity-10" style="background: radial-gradient(circle, #FF74BC 0%, transparent 70%); transform: translate(-30%, 30%);"></div>

      <!-- Colorful accent bar (all 4 Inkluvia brand colors) -->
      <div class="h-2 w-full flex">
        <div class="flex-1" style="background: #3DA5FF;"></div>
        <div class="flex-1" style="background: #FF74BC;"></div>
        <div class="flex-1" style="background: #FFDC58;"></div>
        <div class="flex-1" style="background: #74DC2E;"></div>
      </div>

      <div class="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          <!-- Column 1: Brand Info -->
          <div class="lg:col-span-2 space-y-4 text-left">
            <div class="flex items-center gap-3">
              <div class="p-1.5 bg-white rounded-xl shadow-sm">
                <img src="/Logo.png" alt="Logo Inkluvia" class="h-8 w-auto" />
              </div>
              <span class="text-xl font-black tracking-tight">Inkluvia</span>
            </div>
            <p class="text-sm text-slate-300 leading-relaxed max-w-md font-normal">
              Platform media pembelajaran interaktif & adaptif yang dirancang ramah untuk semua kebutuhan belajar anak Indonesia. Mengusung konsep inklusif, ceria, dan mudah dipahami.
            </p>
            
            <!-- Brand Color Chips -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style="background: rgba(61,165,255,0.18); color: #3DA5FF; border: 1px solid rgba(61,165,255,0.3);">● Adaptif</span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style="background: rgba(255,116,188,0.18); color: #FF74BC; border: 1px solid rgba(255,116,188,0.3);">● Inklusif</span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style="background: rgba(116,220,46,0.18); color: #74DC2E; border: 1px solid rgba(116,220,46,0.3);">● Interaktif</span>
            </div>
          </div>

          <!-- Column 2: Navigasi Utama -->
          <div class="space-y-3 text-left">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Navigasi</h3>
            <ul class="space-y-2 text-sm text-slate-300 font-medium">
              <li><button @click="navigateTo('beranda')" class="hover:text-[#3DA5FF] transition cursor-pointer">Beranda</button></li>
              <li><button @click="navigateTo('materi')" class="hover:text-[#3DA5FF] transition cursor-pointer">Katalog Materi</button></li>
              <li><button @click="navigateTo('guru')" class="hover:text-[#3DA5FF] transition cursor-pointer">Untuk Guru & Pengajar</button></li>
              <li v-if="isAdmin"><button @click="navigateTo('admin')" class="font-bold transition cursor-pointer" style="color: #FF7315;">Dashboard Admin (CMS)</button></li>
            </ul>
          </div>

          <!-- Column 3: Mata Pelajaran -->
          <div class="space-y-3 text-left">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</h3>
            <ul class="space-y-2 text-sm text-slate-300 font-medium">
              <li><button @click="navigateTo('materi')" class="hover:text-[#FFDC58] transition cursor-pointer">IPAS (Sains & Sosial)</button></li>
              <li><button @click="navigateTo('materi')" class="hover:text-[#FFDC58] transition cursor-pointer">Matematika Interaktif</button></li>
              <li><button @click="navigateTo('materi')" class="hover:text-[#FFDC58] transition cursor-pointer">Bahasa Indonesia</button></li>
              <li><button @click="navigateTo('materi')" class="hover:text-[#FFDC58] transition cursor-pointer">Lembar Kerja & Asesmen</button></li>
            </ul>
          </div>

          <!-- Column 4: Metode Belajar -->
          <div class="space-y-3 text-left">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Mode Belajar</h3>
            <ul class="space-y-2 text-sm text-slate-300 font-medium">
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" style="background: #FF7315;"></span> Standard Mode (Ceria)
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" style="background: #3DA5FF;"></span> Focus Mode (Tenang)
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" style="background: #74DC2E;"></span> Kuis & Evaluasi Mandiri
              </li>
            </ul>
          </div>

        </div>

        <!-- Bottom Copyright -->
        <div class="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400" style="border-top: 1px solid rgba(255,255,255,0.10);">
          <p>© 2026 <span class="font-bold text-white">Inkluvia</span>. Hak Cipta Dilindungi. Media Pembelajaran Adaptif & Inklusif.</p>
          <div class="flex items-center gap-6 font-medium">
            <a href="#" @click.prevent class="hover:text-white transition">Kebijakan Privasi</a>
            <a href="#" @click.prevent class="hover:text-white transition">Syarat & Ketentuan</a>
            <a href="#" @click.prevent class="hover:text-white transition">Bantuan</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
