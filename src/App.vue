<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
  Brain,
  Menu,
  Star,
  Edit3,
  MessageSquareHeart,
  ChevronLeft,
  ChevronRight
} from '@lucide/vue'
import MateriView from './components/MateriView.vue'
import MateriDetailView from './components/MateriDetailView.vue'
import ModeSelectView from './components/ModeSelectView.vue'
import LearningPlayerView from './components/LearningPlayerView.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import AuthView from './components/AuthView.vue'
import PricingView from './components/PricingView.vue'
import SettingsView from './components/SettingsView.vue'
import DoodleOrnament from './components/DoodleOrnament.vue'
import {
  getAllDisplayReviews,
  fetchSiteReviewsFromSupabase
} from './lib/reviewService.js'
import { materiList, selectedMateri, isLoadingMateri } from './lib/materiService'
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
const selectedJenjangTab = ref('Semua') // 'Semua' | 'SD' | 'SMP' | 'SMA'
const showProTeaserModal = ref(false)
const selectedTeaserModule = ref(null)

// Data materi bersumber langsung dari database (materiService.js)
const displayedLandingModules = computed(() => {
  return (materiList.value || []).map((item) => {
    const badgeText = (item.badge || '').trim().toLowerCase()
    const isFree = badgeText === 'gratis' || item.isFree === true || (!item.badge && !item.isPro)
    const isPro = !isFree
    
    return {
      id: item.id,
      originalItem: item,
      title: item.title,
      jenjang: item.jenjang || 'SD',
      category: (item.mataPelajaran || item.jenjang || 'umum').toLowerCase(),
      mataPelajaran: item.mataPelajaran || 'Umum',
      ageLabel: item.level ? (item.level.split('•').map(p => p.trim()).find(p => p.toLowerCase().includes('kelas')) || item.level.split('•')[0]?.trim() || item.jenjang || 'Semua Jenjang') : (item.jenjang || 'Semua Jenjang'),
      badges: Array.isArray(item.types) && item.types.length ? item.types : ['Video', 'Interaktif'],
      summary: item.description || 'Materi pembelajaran adaptif dan interaktif Inkluvia.',
      image: item.image || '/es_batu_card.jpg',
      isPro,
      isFree
    }
  })
})

// Filter berdasarkan jenjang ('Semua', 'SD', 'SMP', 'SMA') dan ambil 4 materi teratas
const filteredLandingModules = computed(() => {
  let list = displayedLandingModules.value
  if (selectedJenjangTab.value !== 'Semua') {
    list = list.filter((m) => (m.jenjang || '').trim().toUpperCase() === selectedJenjangTab.value.toUpperCase())
  }
  // Ambil 4 materi teratas
  return list.slice(0, 4)
})

const handleModuleClick = (mod) => {
  playButtonPop()
  const userHasAccess = mod.isFree || currentUser.value?.isPro || isAdmin.value
  if (userHasAccess) {
    handleOpenDetail(mod.originalItem || mod)
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
// Settings Page state
const previousNav = ref('beranda')
const settingsInitialTab = ref('profile')
const openSettings = (tab = 'profile') => {
  settingsInitialTab.value = tab
  navigateTo('settings')
}

// Dynamic Website Reviews State & Carousel (Max 6 reviews per slide)
const displayReviews = ref(getAllDisplayReviews())
const refreshDisplayReviews = () => {
  displayReviews.value = getAllDisplayReviews()
}

const currentReviewPage = ref(0)
const REVIEWS_PER_PAGE = 6

const reviewPages = computed(() => {
  const pages = []
  const list = displayReviews.value || []
  for (let i = 0; i < list.length; i += REVIEWS_PER_PAGE) {
    pages.push(list.slice(i, i + REVIEWS_PER_PAGE))
  }
  return pages.length ? pages : [[]]
})

const totalReviewPages = computed(() => reviewPages.value.length)

const nextReviewPage = () => {
  if (currentReviewPage.value < totalReviewPages.value - 1) {
    currentReviewPage.value++
  } else {
    currentReviewPage.value = 0 // loop to first
  }
}

const prevReviewPage = () => {
  if (currentReviewPage.value > 0) {
    currentReviewPage.value--
  } else {
    currentReviewPage.value = totalReviewPages.value - 1 // loop to last
  }
}

const goToReviewPage = (idx) => {
  currentReviewPage.value = idx
}

// Touch swipe gestures for mobile & tablet
let reviewTouchStartX = 0
let reviewTouchEndX = 0
const handleReviewTouchStart = (e) => {
  if (e.touches && e.touches[0]) {
    reviewTouchStartX = e.touches[0].screenX
  }
}
const handleReviewTouchEnd = (e) => {
  if (e.changedTouches && e.changedTouches[0]) {
    reviewTouchEndX = e.changedTouches[0].screenX
    const diff = reviewTouchStartX - reviewTouchEndX
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextReviewPage()
      } else {
        prevReviewPage()
      }
    }
  }
}

// Pending navigation state (intended destination saved when intercepted by middleware)
const intendedNav = ref(null)

/**
 * Navigate to dedicated Auth Page
 */
const navigateToAuth = (tab = 'login', notice = '') => {
  authTab.value = tab
  authNoticeMessage.value = notice
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
  intendedNav.value = null
  if (['admin', 'settings', ...PROTECTED_ROUTES].includes(currentNav.value)) {
    currentNav.value = 'beranda'
  }
}

// Smart Auto-Hiding Navbar State
const isNavVisible = ref(true)
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
let lastScrollY = 0
let scrollTicking = false

const handleWindowScroll = () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      const currentScrollY = window.scrollY
      isScrolled.value = currentScrollY > 20

      // If mobile dropdown menu is open, keep navbar visible
      if (isMobileMenuOpen.value) {
        isNavVisible.value = true
        lastScrollY = Math.max(0, currentScrollY)
        scrollTicking = false
        return
      }

      // Always show when near the very top of the page
      if (currentScrollY <= 30) {
        isNavVisible.value = true
      } else {
        const diff = currentScrollY - lastScrollY
        // Delta threshold to ignore tiny micro-movements
        if (Math.abs(diff) > 6) {
          if (diff > 0 && currentScrollY > 80) {
            // Scrolling DOWN -> hide navbar smoothly
            isNavVisible.value = false
          } else if (diff < 0) {
            // Scrolling UP -> reveal navbar immediately (never gets lost/tenggelam!)
            isNavVisible.value = true
          }
        }
      }

      lastScrollY = Math.max(0, currentScrollY)
      scrollTicking = false
    })
    scrollTicking = true
  }
}

onMounted(async () => {
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  await fetchSiteReviewsFromSupabase()
  refreshDisplayReviews()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleWindowScroll)
})

/**
 * Middleware-protected Navigation
 */
const navigateTo = (tab) => {
  isMobileMenuOpen.value = false
  isNavVisible.value = true
  if (currentNav.value !== 'settings') {
    previousNav.value = currentNav.value
  }

  const guard = canAccessRoute(tab)
  if (!guard.allowed) {
    intendedNav.value = { tab }
    navigateToAuth(guard.tab || 'login', guard.reason)
    return false
  }

  currentNav.value = tab
  window.scrollTo({ top: 0, behavior: 'smooth' })
  return true
}

// Flow Handlers protected by Middleware
const handleOpenDetail = (item) => {
  const targetItem = item || materiList.value[0]
  const guard = canAccessRoute('mode-select')
  if (!guard.allowed) {
    intendedNav.value = { tab: 'mode-select', item: targetItem }
    navigateToAuth(guard.tab || 'login', guard.reason)
    return
  }
  activeMateriItem.value = targetItem
  currentNav.value = 'mode-select'
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
  <div class="w-full min-h-screen bg-[#F8FAFD] text-slate-800 font-sans flex flex-col overflow-x-hidden relative" style="background-image: radial-gradient(circle, rgba(15, 50, 97, 0.07) 1.2px, transparent 1.2px); background-size: 28px 28px;">
    <!-- Global Softened Ambient Glow (On-Scrolling Absolute) -->
    <div class="absolute top-0 left-0 w-[450px] h-[450px] rounded-full bg-[#FFDC58]/06 blur-3xl pointer-events-none z-0"></div>
    <div class="absolute top-1/4 right-0 w-[450px] h-[450px] rounded-full bg-[#3DA5FF]/06 blur-3xl pointer-events-none z-0"></div>
    <div class="absolute top-2/4 left-0 w-[400px] h-[400px] rounded-full bg-[#FF74BC]/06 blur-3xl pointer-events-none z-0"></div>
    <div class="absolute top-3/4 right-0 w-[400px] h-[400px] rounded-full bg-[#74DC2E]/05 blur-3xl pointer-events-none z-0"></div>

    <!-- ==================== SMART AUTO-HIDING NAVBAR ==================== -->
    <header
      v-if="!['learning-player', 'auth'].includes(currentNav)"
      :class="[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        isNavVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none',
        isScrolled
          ? 'bg-white/92 backdrop-blur-xl border-b border-blue-200/70 shadow-md shadow-[#0F3261]/08 py-2.5'
          : 'bg-white/85 backdrop-blur-md border-b border-blue-100/60 shadow-xs py-3.5'
      ]"
    >
      <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">

        <!-- Left: Logo + Nav Links -->
        <div class="flex items-center gap-6 lg:gap-8">
          <!-- Logo -->
          <button
            @click="navigateTo('beranda')"
            class="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0 text-left focus:outline-none"
          >
            <div class="relative w-10 h-10 flex items-center justify-center p-1 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-2xs group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
              <img
                src="/Logo.png"
                alt="Logo Inkluvia"
                class="h-8 w-auto object-contain"
              />
            </div>
            <div class="flex flex-col">
              <span class="text-[22px] font-black tracking-tight leading-none" style="background: linear-gradient(135deg, #0F3261 0%, #3587CE 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Inkluvia
              </span>
              <span class="text-[10px] font-extrabold text-[#FF7315] tracking-wide uppercase mt-0.5 hidden sm:block">
                Belajar Inklusif
              </span>
            </div>
          </button>

          <!-- Nav Links (Desktop Segmented Navigation) -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70 backdrop-blur-xs">
            <button
              @click="navigateTo('beranda')"
              :class="[
                'px-4 py-2 rounded-xl text-xs lg:text-sm font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5',
                currentNav === 'beranda'
                  ? 'bg-[#0F3261] text-white shadow-sm shadow-[#0F3261]/25'
                  : 'text-slate-600 hover:text-[#0F3261] hover:bg-white/80'
              ]"
            >
              <span>Beranda</span>
            </button>

            <button
              @click="navigateTo('materi')"
              :class="[
                'px-4 py-2 rounded-xl text-xs lg:text-sm font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5',
                ['materi', 'materi-detail', 'mode-select'].includes(currentNav)
                  ? 'bg-[#FF7315] text-white shadow-sm shadow-[#FF7315]/25'
                  : 'text-slate-600 hover:text-[#FF7315] hover:bg-white/80'
              ]"
            >
              <span>Materi</span>
              <span class="w-1.5 h-1.5 rounded-full bg-[#FF7315]" v-if="!['materi', 'materi-detail', 'mode-select'].includes(currentNav)"></span>
            </button>

            <button
              @click="navigateTo('harga')"
              :class="[
                'px-4 py-2 rounded-xl text-xs lg:text-sm font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5',
                currentNav === 'harga'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                  : 'text-slate-600 hover:text-amber-600 hover:bg-white/80'
              ]"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-400" v-if="currentNav !== 'harga'" />
              <span>Harga</span>
            </button>

            <button
              v-if="isAdmin"
              @click="navigateTo('admin')"
              :class="[
                'px-3.5 py-2 rounded-xl text-xs lg:text-sm font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5',
                currentNav === 'admin'
                  ? 'bg-[#54AA1B] text-white shadow-sm'
                  : 'text-[#54AA1B] hover:bg-emerald-50'
              ]"
            >
              <LayoutDashboard class="w-3.5 h-3.5" />
              <span>CMS Admin</span>
            </button>
          </nav>
        </div>

        <!-- Right: Audio FX Toggle + Search + Auth Desktop + Mobile Hamburger -->
        <div class="flex items-center gap-2.5 sm:gap-3 flex-1 justify-end max-w-md">
          
          <!-- Sound Effects Toggle Button -->
          <button
            @click="toggleSound(); playButtonPop()"
            :title="isSoundEnabled ? 'Efek Suara Aktif (klik untuk matikan)' : 'Efek Suara Nonaktif (klik untuk aktifkan)'"
            class="w-9 h-9 rounded-full bg-slate-100/90 hover:bg-blue-50 text-slate-500 hover:text-[#3587CE] border border-slate-200/80 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <Volume2 v-if="isSoundEnabled" class="w-4 h-4 text-[#3587CE]" />
            <VolumeX v-else class="w-4 h-4 text-slate-400" />
          </button>

          <!-- Search Input -->
          <div class="relative flex-1 max-w-[210px] hidden sm:block">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari materi..."
              class="w-full bg-slate-100/80 hover:bg-white focus:bg-white text-xs lg:text-sm pl-10 pr-4 py-2 rounded-full border border-slate-200 focus:border-[#3DA5FF] focus:outline-none focus:ring-2 focus:ring-[#3DA5FF]/20 transition placeholder:text-slate-400 text-slate-700"
            />
          </div>

          <!-- NOT LOGGED IN DESKTOP -->
          <div v-if="!isAuthenticated" class="hidden sm:flex items-center gap-2 shrink-0">
            <button
              @click="navigateToAuth('login')"
              class="px-4 py-2 rounded-full border-2 border-blue-200 hover:border-[#3DA5FF] text-[#0F3261] hover:text-[#3587CE] hover:bg-blue-50/60 font-bold text-xs lg:text-sm transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Masuk
            </button>
            <button
              @click="navigateToAuth('register')"
              class="px-5 py-2 rounded-full text-white font-black text-xs lg:text-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#FF7315]/25"
              style="background: linear-gradient(135deg, #FF7315 0%, #E86105 100%);"
            >
              Daftar Gratis
            </button>
          </div>

          <!-- LOGGED IN DESKTOP (Profile Pill) -->
          <div v-else class="hidden sm:flex items-center gap-2 shrink-0">
            <button
              @click="openSettings('profile')"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all duration-200 cursor-pointer group shadow-2xs"
            >
              <div class="relative w-8 h-8 rounded-full flex items-center justify-center text-base bg-white border border-blue-200 shadow-2xs group-hover:scale-105 transition-transform">
                <span class="select-none leading-none">{{ currentUser?.avatar || '👧' }}</span>
                <span
                  class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                  :class="isAdmin ? 'bg-[#FF7315]' : 'bg-emerald-500'"
                ></span>
              </div>
              <div class="flex flex-col text-left pr-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-black text-[#0F3261] leading-tight max-w-[90px] truncate">
                    {{ currentUser?.name || 'Siswa' }}
                  </span>
                  <span
                    v-if="currentUser?.isPro || isAdmin"
                    class="px-1.5 py-0.2 rounded text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 border border-amber-300 shadow-2xs"
                  >
                    👑 PRO
                  </span>
                </div>
                <span class="text-[10px] font-bold text-slate-400 leading-none">
                  {{ isAdmin ? 'Admin' : (currentUser?.isPro ? 'Member PRO' : 'Akun Saya') }}
                </span>
              </div>
            </button>
          </div>

          <!-- Mobile Hamburger Toggle Button -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            aria-label="Toggle Menu"
          >
            <X v-if="isMobileMenuOpen" class="w-5 h-5 text-[#0F3261]" />
            <Menu v-else class="w-5 h-5 text-[#0F3261]" />
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <transition name="dropdown">
        <div
          v-if="isMobileMenuOpen"
          class="md:hidden bg-white/95 backdrop-blur-xl border-b border-blue-100 px-5 py-4 space-y-3 shadow-xl"
        >
          <!-- Mobile Search -->
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari materi belajar..."
              class="w-full bg-slate-100 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#3DA5FF] focus:outline-none transition"
            />
          </div>

          <!-- Mobile Nav Buttons -->
          <div class="flex flex-col gap-1.5 pt-1">
            <button
              @click="navigateTo('beranda')"
              :class="[
                'w-full text-left px-4 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-between',
                currentNav === 'beranda' ? 'bg-[#0F3261] text-white' : 'text-slate-700 hover:bg-slate-100'
              ]"
            >
              <span>Beranda</span>
              <ArrowRight class="w-4 h-4 opacity-70" />
            </button>

            <button
              @click="navigateTo('materi')"
              :class="[
                'w-full text-left px-4 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-between',
                ['materi', 'materi-detail', 'mode-select'].includes(currentNav) ? 'bg-[#FF7315] text-white' : 'text-slate-700 hover:bg-slate-100'
              ]"
            >
              <span>Katalog Materi</span>
              <ArrowRight class="w-4 h-4 opacity-70" />
            </button>

            <button
              @click="navigateTo('harga')"
              :class="[
                'w-full text-left px-4 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-between',
                currentNav === 'harga' ? 'bg-amber-500 text-white' : 'text-slate-700 hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-2">
                <span>Paket Langganan (Harga)</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">Promo</span>
              </div>
              <ArrowRight class="w-4 h-4 opacity-70" />
            </button>

            <button
              v-if="isAdmin"
              @click="navigateTo('admin')"
              :class="[
                'w-full text-left px-4 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-between',
                currentNav === 'admin' ? 'bg-[#54AA1B] text-white' : 'text-[#54AA1B] hover:bg-emerald-50'
              ]"
            >
              <span>CMS Admin Inkluvia</span>
              <ArrowRight class="w-4 h-4 opacity-70" />
            </button>
          </div>

          <!-- Mobile Auth Actions -->
          <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <template v-if="!isAuthenticated">
              <button
                @click="navigateToAuth('login')"
                class="w-full py-2.5 rounded-xl border border-blue-200 text-[#0F3261] font-bold text-sm text-center"
              >
                Masuk ke Akun
              </button>
              <button
                @click="navigateToAuth('register')"
                class="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF7315] to-[#E86105] text-white font-black text-sm text-center shadow-md"
              >
                Daftar Gratis Sekarang
              </button>
            </template>
            <template v-else>
              <button
                @click="openSettings('profile')"
                class="w-full py-2.5 px-4 rounded-xl bg-blue-50 text-[#0F3261] font-bold text-sm flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <span>{{ currentUser?.avatar || '👧' }}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="font-extrabold">{{ currentUser?.name || 'Profil Akun' }}</span>
                    <span
                      v-if="currentUser?.isPro || isAdmin"
                      class="px-1.5 py-0.2 rounded text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 border border-amber-300 shadow-2xs"
                    >
                      👑 PRO
                    </span>
                  </div>
                </div>
                <Settings class="w-4 h-4 text-slate-400" />
              </button>
              <button
                @click="handleLogout"
                class="w-full py-2 text-rose-500 font-bold text-xs text-center hover:bg-rose-50 rounded-lg transition"
              >
                Keluar (Logout)
              </button>
            </template>
          </div>
        </div>
      </transition>
    </header>

    <!-- Spacer to reserve space for fixed navbar -->
    <div
      v-if="!['learning-player', 'auth'].includes(currentNav)"
      class="h-[68px] sm:h-[72px] shrink-0 pointer-events-none"
    ></div>

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
        <div class="absolute bottom-24 left-6 sm:left-12 z-10 pointer-events-none hidden sm:block">
          <DoodleOrnament name="star-outline" color="#FFDC58" :size="36" class="animate-spin-slow" />
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
                <!-- Decorative Burst Badge next to Headline -->
                <div class="absolute -top-6 -right-2 pointer-events-none hidden sm:block">
                  <DoodleOrnament name="burst" color="#3DA5FF" :size="32" class="animate-pulse-subtle" />
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

              <!-- Main Artwork Image (`Banner_Dashboard2.jpg`) with Authentic Hand-drawn Doodles -->
              <div class="w-full flex justify-center items-center relative">
                
                <!-- Doodle 1: Looping Arrow (Top Right) -->
                <div class="absolute -top-7 right-6 z-20 pointer-events-none select-none hidden md:block rotate-12 animate-float-slow">
                  <DoodleOrnament name="arrow-loop" color="#3DA5FF" :size="52" />
                </div>

                <!-- Doodle 2: Hand-drawn Outline Heart (Top Right Corner) -->
                <div class="absolute top-1 -right-3 z-20 pointer-events-none select-none hidden lg:block rotate-12">
                  <DoodleOrnament name="heart-outline" color="#FF74BC" :size="36" />
                </div>

                <!-- Doodle 3: Floating Pastel Dots Cluster (Middle Right) -->
                <div class="absolute top-1/3 -right-6 z-20 pointer-events-none select-none hidden lg:block animate-float-medium">
                  <DoodleOrnament name="dots-cluster" :size="54" />
                </div>

                <!-- Doodle 4: Hand-drawn Outline Star (Bottom Right) -->
                <div class="absolute -bottom-5 right-12 z-20 pointer-events-none select-none hidden sm:block -rotate-6 animate-bounce-subtle">
                  <DoodleOrnament name="star-outline" color="#FFDC58" :size="42" />
                </div>

                <!-- Doodle 5: Squiggly Wavy Line (Bottom Left) -->
                <div class="absolute -bottom-4 left-6 z-20 pointer-events-none select-none hidden md:block rotate-3">
                  <DoodleOrnament name="squiggle" color="#FF7315" :size="68" />
                </div>

                <!-- Doodle 6: Three-Ray Burst (Middle Left) -->
                <div class="absolute top-1/4 -left-6 z-20 pointer-events-none select-none hidden lg:block -rotate-12 animate-pulse-subtle">
                  <DoodleOrnament name="burst" color="#3DA5FF" :size="34" />
                </div>

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
      <section class="w-full bg-[#F4F9FF] px-4 sm:px-6 lg:px-10 py-16 sm:py-20 relative overflow-hidden border-b border-blue-100/60" style="background-image: radial-gradient(#d3e5fa 1.2px, transparent 1.2px); background-size: 30px 30px;">
        <!-- Background Blobs & Section Doodles (On Scrolling) -->
        <div class="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#FFDC58]/15 blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-[#3DA5FF]/12 blur-3xl pointer-events-none"></div>
        
        <!-- Authentic Hand-drawn Doodles for Section 1 -->
        <div class="absolute top-10 left-8 pointer-events-none select-none hidden sm:block -rotate-6 animate-bounce-subtle">
          <DoodleOrnament name="star-outline" color="#FFDC58" :size="38" />
        </div>
        <div class="absolute top-14 right-12 pointer-events-none select-none hidden sm:block animate-pulse-subtle">
          <DoodleOrnament name="burst" color="#3DA5FF" :size="32" />
        </div>
        <div class="absolute top-1/2 left-4 pointer-events-none select-none hidden xl:block animate-float-medium">
          <DoodleOrnament name="dots-duo" :size="44" />
        </div>
        <div class="absolute bottom-8 right-16 pointer-events-none select-none hidden lg:block rotate-6">
          <DoodleOrnament name="squiggle" color="#74DC2E" :size="65" />
        </div>

        <div class="w-full max-w-[1440px] mx-auto space-y-12 relative z-10">
          
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
      <section
        class="w-full bg-[#FFFDF9] px-4 sm:px-6 lg:px-10 py-16 sm:py-20 border-b border-orange-100/60 relative overflow-hidden"
        style="background-image: radial-gradient(#fce0c7 1.2px, transparent 1.2px); background-size: 30px 30px;"
      >
        <!-- Section Background Blobs & Doodles (On Scrolling) -->
        <div class="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#FF7315]/08 blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[#FFDC58]/10 blur-3xl pointer-events-none"></div>
        
        <!-- Authentic Hand-drawn Doodles for Section 2 -->
        <div class="absolute top-16 right-8 pointer-events-none select-none hidden sm:block animate-pulse-subtle">
          <DoodleOrnament name="spiral" color="#FF7315" :size="36" />
        </div>
        <div class="absolute top-1/3 left-6 pointer-events-none select-none hidden md:block -rotate-12">
          <DoodleOrnament name="heart-outline" color="#FF74BC" :size="36" />
        </div>
        <div class="absolute bottom-16 right-10 pointer-events-none select-none hidden xl:block animate-float-slow">
          <DoodleOrnament name="dots-cluster" :size="48" />
        </div>
        <div class="absolute bottom-12 left-8 pointer-events-none select-none hidden sm:block rotate-3">
          <DoodleOrnament name="squiggle" color="#FFDC58" :size="65" />
        </div>

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

          <!-- Jenjang Filter Tabs (Semua, SD, SMP, SMA) -->
          <div class="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3.5">
            <button
              v-for="jenjang in ['Semua', 'SD', 'SMP', 'SMA']"
              :key="jenjang"
              @click="selectedJenjangTab = jenjang; playButtonPop()"
              :class="[
                'px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer shadow-xs',
                selectedJenjangTab === jenjang
                  ? 'bg-[#0F3261] text-white shadow-md scale-105 ring-2 ring-[#0F3261]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              ]"
            >
              {{ jenjang === 'Semua' ? 'Semua Jenjang' : 'Jenjang ' + jenjang }}
            </button>
          </div>

          <!-- Module Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            
            <!-- 1. LOADING STATE: Saat materi sedang dimuat dari Supabase -->
            <div v-if="isLoadingMateri" class="col-span-full py-16 text-center space-y-3">
              <div class="w-12 h-12 rounded-full border-4 border-blue-200 border-t-[#3DA5FF] animate-spin mx-auto"></div>
              <p class="text-xs font-bold text-slate-400">Memuat materi dari database...</p>
            </div>

            <!-- 2. EMPTY STATE: Jika jenjang kosong atau belum ada materi di database (klo kosong ya kosong) -->
            <div
              v-else-if="filteredLandingModules.length === 0"
              class="col-span-full py-14 px-6 bg-white/85 rounded-3xl border-2 border-dashed border-blue-200 text-center space-y-4 max-w-md mx-auto shadow-xs"
            >
              <div class="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-3xl shadow-inner">
                🧊
              </div>
              <div class="space-y-1.5">
                <h3 class="text-lg font-black text-[#0F3261]">
                  Belum Ada Materi di Jenjang {{ selectedJenjangTab }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Materi pembelajaran untuk jenjang {{ selectedJenjangTab }} belum tersedia atau sedang disiapkan oleh tim pengajar Inkluvia.
                </p>
              </div>
              <button
                @click="selectedJenjangTab = 'Semua'; playButtonPop()"
                class="px-5 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#3587CE] text-xs font-black transition cursor-pointer border border-blue-200 inline-flex items-center gap-1.5"
              >
                <span>Lihat Semua Jenjang</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- 3. REAL DATABASE CARDS: Yang gratis ya gratis, yang berbayar ya PRO -->
            <div
              v-else
              v-for="mod in filteredLandingModules"
              :key="mod.id"
              class="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group relative"
            >
              <!-- Card Top Image Banner -->
              <div class="relative h-44 w-full overflow-hidden bg-slate-100">
                <img :src="mod.image" :alt="mod.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                <!-- Free vs Pro Lock Badge Overlay & Jenjang Badge -->
                <div class="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                  <span v-if="mod.isFree" class="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-md flex items-center gap-1">
                    ⭐ GRATIS
                  </span>
                  <span v-else-if="currentUser?.isPro || isAdmin" class="px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md flex items-center gap-1">
                    👑 PRO AKTIF
                  </span>
                  <span v-else class="px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md flex items-center gap-1">
                    <Lock class="w-3 h-3" /> PRO
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0F3261]/80 text-white backdrop-blur-xs">
                    {{ mod.jenjang }}
                  </span>
                </div>

                <div class="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-extrabold text-[#0F3261] shadow-2xs">
                  {{ mod.ageLabel }}
                </div>

                <!-- Pro Lock Glassmorphism Blur Overlay (Hanya jika belum PRO) -->
                <div v-if="mod.isPro && !currentUser?.isPro && !isAdmin" class="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
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
                      (mod.isFree || currentUser?.isPro || isAdmin)
                        ? 'btn-tactile-orange'
                        : 'bg-gradient-to-r from-amber-500 to-[#FF7315] text-white hover:brightness-110'
                    ]"
                  >
                    <span v-if="mod.isFree">Coba Demo Gratis</span>
                    <span v-else-if="currentUser?.isPro || isAdmin">Mulai Belajar PRO ⭐</span>
                    <span v-else>Buka Akses PRO</span>
                    <ArrowRight v-if="mod.isFree || currentUser?.isPro || isAdmin" class="w-3.5 h-3.5" />
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
                @click="showProTeaserModal = false; navigateTo('harga')"
                class="btn-tactile-orange w-full py-3.5 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>👑 Beli Paket Inkluvia Premium via Xendit ➔</span>
              </button>
              <button
                v-if="!isAuthenticated"
                @click="showProTeaserModal = false; navigateToAuth('login')"
                class="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-[#0F3261] transition cursor-pointer"
              >
                Sudah punya akun? Masuk di sini
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ==================== SECTION 3: 4 MODE BELAJAR ADAPTIF ==================== -->
      <section
        class="w-full bg-[#F4F9FF] px-4 sm:px-6 lg:px-8 py-20 sm:py-24 border-b border-blue-100/60 relative overflow-hidden"
        style="background-image: radial-gradient(#d3e5fa 1.2px, transparent 1.2px); background-size: 30px 30px;"
      >
        <!-- Soft Background Ambient Blobs (Konsisten dengan bagian lainnya) -->
        <div class="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#FFDC58]/15 blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-[#3DA5FF]/12 blur-3xl pointer-events-none"></div>

        <!-- Authentic Hand-drawn Doodles for Section 3 (Pas & Gak Maksain) -->
        <!-- 1. Bintang Garis Kuning di Kiri Atas -->
        <div class="absolute top-10 left-8 sm:left-14 pointer-events-none select-none hidden sm:block -rotate-12 animate-bounce-subtle">
          <DoodleOrnament name="star-outline" color="#FFDC58" :size="42" />
        </div>

        <!-- 2. Looping Arrow di Kanan Atas -->
        <div class="absolute top-12 right-10 sm:right-16 pointer-events-none select-none hidden sm:block rotate-12 animate-float-slow">
          <DoodleOrnament name="arrow-loop" color="#3DA5FF" :size="48" />
        </div>

        <!-- 3. Pastel Dots Cluster di Kiri Tengah -->
        <div class="absolute top-1/2 left-6 pointer-events-none select-none hidden xl:block animate-float-medium">
          <DoodleOrnament name="dots-cluster" :size="48" />
        </div>

        <!-- 4. Hati Doodle di Kanan Tengah -->
        <div class="absolute top-1/2 right-6 pointer-events-none select-none hidden xl:block rotate-12">
          <DoodleOrnament name="heart-outline" color="#FF74BC" :size="36" />
        </div>

        <!-- 5. Squiggle Wavy di Kiri Bawah -->
        <div class="absolute bottom-12 left-8 sm:left-12 pointer-events-none select-none hidden lg:block -rotate-3">
          <DoodleOrnament name="squiggle" color="#FF7315" :size="70" />
        </div>

        <!-- 6. Radiant Burst di Kanan Bawah -->
        <div class="absolute bottom-16 right-8 sm:right-14 pointer-events-none select-none hidden lg:block rotate-12 animate-pulse-subtle">
          <DoodleOrnament name="burst" color="#54AA1B" :size="32" />
        </div>

        <div class="w-full max-w-5xl mx-auto space-y-12 relative z-10">
          
          <!-- Section Header (Clean, Calm, Spacious) -->
          <div class="text-center max-w-2xl mx-auto space-y-3">
            <span class="inline-flex items-center px-3.5 py-1 rounded-full bg-blue-50 text-[#3587CE] text-xs font-bold uppercase tracking-wider border border-blue-200/60">
              Pilihan Cara Belajar
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-[#0F3261] tracking-tight">
              4 Mode Belajar Adaptif di Inkluvia
            </h2>
            <p class="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
              Setiap anak memiliki cara belajar yang unik. Pilih format yang paling nyaman dan mendukung pemahaman optimal.
            </p>
          </div>

          <!-- 2x2 Spacious Mode Cards Grid with Rich Hover Effects & Differentiated Personalities -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            <!-- 1. Mode Standar (Inkluvia Blue Theme) -->
            <div
              @click="chosenMode = 'standard'; handleStartAdventure(); playButtonPop()"
              class="group bg-white rounded-3xl p-7 sm:p-8 border-2 border-slate-100 hover:border-[#3DA5FF] shadow-xs hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <!-- Subtle Top Accent Hover Glow -->
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3DA5FF] to-[#3587CE] opacity-80 group-hover:opacity-100 transition-opacity"></div>

              <div>
                <!-- Header: Icon + Title + Theme Badge -->
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3.5">
                    <div class="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center p-2 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-2xs">
                      <img src="/Icon_Standar Mode.png" alt="Mode Standar" class="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <h3 class="text-xl font-black text-[#0F3261] group-hover:text-[#3587CE] transition-colors">
                        1. Standar
                      </h3>
                      <p class="text-xs text-slate-400 font-medium">Format Video Utama</p>
                    </div>
                  </div>
                  <span class="text-[11px] font-black px-3 py-1 rounded-full bg-blue-50 text-[#3587CE] border border-blue-200/80 shrink-0">
                    Reguler
                  </span>
                </div>

                <!-- Punchy & Concise Description (Teks Ringkas) -->
                <p class="text-sm text-slate-600 font-medium leading-relaxed">
                  Video interaktif menyeluruh dengan perpaduan visual dinamis, animasi menarik, dan narasi audio lengkap untuk mendukung belajar mandiri.
                </p>

                <!-- Key Feature Tags -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#3587CE] transition-colors">
                    🎬 Animasi Interaktif
                  </span>
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#3587CE] transition-colors">
                    🔊 Narasi Audio Penuh
                  </span>
                </div>
              </div>

              <!-- Footer: Target Pengguna + Hover Action CTA -->
              <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-[#0F3261]">🎯 Sasaran:</span>
                  <span class="ml-1.5 text-slate-600 font-medium">Siswa kebutuhan umum / reguler</span>
                </div>
                <span class="font-black text-[#3587CE] flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                  <span>Coba</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <!-- 2. Mode Slow (Warm Amber Theme) -->
            <div
              @click="chosenMode = 'slow'; handleStartAdventure(); playButtonPop()"
              class="group bg-white rounded-3xl p-7 sm:p-8 border-2 border-slate-100 hover:border-amber-400 shadow-xs hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <!-- Subtle Top Accent Hover Glow -->
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FFDC58] to-[#FF7315] opacity-80 group-hover:opacity-100 transition-opacity"></div>

              <div>
                <!-- Header: Icon + Title + Theme Badge -->
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3.5">
                    <div class="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-2xs">
                      🐢
                    </div>
                    <div>
                      <h3 class="text-xl font-black text-[#0F3261] group-hover:text-[#FF7315] transition-colors">
                        2. Slow
                      </h3>
                      <p class="text-xs text-slate-400 font-medium">Tempo Terukur & Artikulasi Bertahap</p>
                    </div>
                  </div>
                  <span class="text-[11px] font-black px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                    Tempo Terukur
                  </span>
                </div>

                <!-- Punchy & Concise Description (Teks Ringkas) -->
                <p class="text-sm text-slate-600 font-medium leading-relaxed">
                  Penyampaian materi lebih santai dengan jeda proporsional antarpenjelasan, memberikan waktu retensi ekstra untuk mencerna poin pembahasan.
                </p>

                <!-- Key Feature Tags -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-800 transition-colors">
                    ⏱️ Artikulasi Bertahap
                  </span>
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-800 transition-colors">
                    ⏸️ Jeda Retensi Nyaman
                  </span>
                </div>
              </div>

              <!-- Footer: Target Pengguna + Hover Action CTA -->
              <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-[#0F3261]">🎯 Sasaran:</span>
                  <span class="ml-1.5 text-slate-600 font-medium">Disabilitas intelektual & atensi</span>
                </div>
                <span class="font-black text-[#FF7315] flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                  <span>Coba</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <!-- 3. Mode Kontras Tinggi (High Contrast Slate/Yellow Theme) -->
            <div
              @click="chosenMode = 'high_contrast'; handleStartAdventure(); playButtonPop()"
              class="group bg-white rounded-3xl p-7 sm:p-8 border-2 border-slate-100 hover:border-slate-800 shadow-xs hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <!-- Subtle Top Accent Hover Glow -->
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-900 via-yellow-400 to-[#FFDC58] opacity-80 group-hover:opacity-100 transition-opacity"></div>

              <div>
                <!-- Header: Icon + Title + Theme Badge -->
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3.5">
                    <div class="w-13 h-13 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl text-yellow-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-2xs">
                      👁️
                    </div>
                    <div>
                      <h3 class="text-xl font-black text-[#0F3261] group-hover:text-slate-900 transition-colors">
                        3. Kontras Tinggi
                      </h3>
                      <p class="text-xs text-slate-400 font-medium">Keterbacaan Visual Maksimal</p>
                    </div>
                  </div>
                  <span class="text-[11px] font-black px-3 py-1 rounded-full bg-slate-900 text-yellow-400 border border-slate-700 shrink-0">
                    High Contrast
                  </span>
                </div>

                <!-- Punchy & Concise Description (Teks Ringkas) -->
                <p class="text-sm text-slate-600 font-medium leading-relaxed">
                  Rasio kontras warna tajam, batas objek tegas, dan tipografi diperbesar dengan durasi efisien 4–5 menit untuk kenyamanan visual bebas lelah.
                </p>

                <!-- Key Feature Tags -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-yellow-400 transition-colors">
                    🔲 Kontras Warna Tegas
                  </span>
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-yellow-400 transition-colors">
                    🔍 Durasi Ringkas 4–5 Mnt
                  </span>
                </div>
              </div>

              <!-- Footer: Target Pengguna + Hover Action CTA -->
              <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-[#0F3261]">🎯 Sasaran:</span>
                  <span class="ml-1.5 text-slate-600 font-medium">Hambatan penglihatan (Low Vision)</span>
                </div>
                <span class="font-black text-slate-900 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                  <span>Coba</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <!-- 4. Mode Focus (Zen Emerald Green Theme) -->
            <div
              @click="chosenMode = 'focus'; handleStartAdventure(); playButtonPop()"
              class="group bg-white rounded-3xl p-7 sm:p-8 border-2 border-slate-100 hover:border-emerald-500 shadow-xs hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <!-- Subtle Top Accent Hover Glow -->
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#74DC2E] to-[#54AA1B] opacity-80 group-hover:opacity-100 transition-opacity"></div>

              <div>
                <!-- Header: Icon + Title + Theme Badge -->
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3.5">
                    <div class="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-2xs">
                      <img src="/Icon_Focus Mode.png" alt="Mode Focus" class="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <h3 class="text-xl font-black text-[#0F3261] group-hover:text-[#54AA1B] transition-colors">
                        4. Focus
                      </h3>
                      <p class="text-xs text-slate-400 font-medium">Bebas Distraksi & Stimulasi Tenang</p>
                    </div>
                  </div>
                  <span class="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                    Bebas Distraksi
                  </span>
                </div>

                <!-- Punchy & Concise Description (Teks Ringkas) -->
                <p class="text-sm text-slate-600 font-medium leading-relaxed">
                  Tampilan bersih bebas ornamen dan transisi mencolok. Materi difokuskan pada konten inti guna menciptakan suasana belajar hening dan fokus.
                </p>

                <!-- Key Feature Tags -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                    🧘 Stimulasi Minimalis
                  </span>
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                    🎯 Inti Materi Langsung
                  </span>
                </div>
              </div>

              <!-- Footer: Target Pengguna + Hover Action CTA -->
              <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-[#0F3261]">🎯 Sasaran:</span>
                  <span class="ml-1.5 text-slate-600 font-medium">Spektrum autisme & gangguan atensi</span>
                </div>
                <span class="font-black text-[#54AA1B] flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                  <span>Coba</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- ==================== SECTION 5: TESTIMONI & VALIDASI PRAKTISI ==================== -->
      <section
        class="w-full bg-[#F0F7FF] px-4 sm:px-6 lg:px-10 py-16 sm:py-20 border-b border-blue-100/60 relative overflow-hidden"
        style="background-image: radial-gradient(#d3e5fa 1.2px, transparent 1.2px); background-size: 30px 30px;"
      >
        <!-- Soft Background Ambient Blobs -->
        <div class="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#FF74BC]/10 blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 -right-20 w-80 h-80 rounded-full bg-[#3DA5FF]/10 blur-3xl pointer-events-none"></div>

        <!-- Authentic Hand-drawn Doodles for Section 5 (Testimoni) -->
        <div class="absolute top-12 left-8 pointer-events-none select-none hidden sm:block animate-pulse-subtle">
          <DoodleOrnament name="heart-outline" color="#FF74BC" :size="38" />
        </div>
        <div class="absolute bottom-12 right-10 pointer-events-none select-none hidden sm:block -rotate-6 animate-bounce-subtle">
          <DoodleOrnament name="star-outline" color="#FFDC58" :size="36" />
        </div>
        <div class="absolute top-1/2 right-6 pointer-events-none select-none hidden xl:block animate-float-medium">
          <DoodleOrnament name="dots-duo" :size="42" />
        </div>

        <div class="w-full max-w-[1440px] mx-auto space-y-12 relative z-10">
          
          <!-- Section Header with Carousel Navigation -->
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="text-center md:text-left space-y-2">
              <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-[#E1529C] text-xs font-extrabold tracking-wide uppercase">
                CERITA MEREKA
              </span>
              <h2 class="text-2xl sm:text-4xl font-extrabold text-[#0F3261] tracking-tight">
                Dipercaya oleh Pengajar dan Keluarga di Seluruh Indonesia
              </h2>
            </div>

            <!-- Carousel Header Controls (Visible when more than 6 reviews) -->
            <div v-if="totalReviewPages > 1" class="flex items-center gap-3 shrink-0">
              <span class="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                Slide {{ currentReviewPage + 1 }} dari {{ totalReviewPages }}
              </span>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="prevReviewPage"
                  title="Lihat ulasan sebelumnya"
                  class="w-9 h-9 rounded-full bg-white hover:bg-[#3DA5FF] text-slate-700 hover:text-white border border-slate-200 hover:border-[#3DA5FF] flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  @click="nextReviewPage"
                  title="Lihat ulasan berikutnya"
                  class="w-9 h-9 rounded-full bg-white hover:bg-[#3DA5FF] text-slate-700 hover:text-white border border-slate-200 hover:border-[#3DA5FF] flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Dynamic Sliding Carousel Container -->
          <div
            class="relative overflow-hidden w-full select-none"
            @touchstart="handleReviewTouchStart"
            @touchend="handleReviewTouchEnd"
          >
            <!-- Sliding Track -->
            <div
              class="flex transition-transform duration-500 ease-out"
              :style="{ transform: `translateX(-${currentReviewPage * 100}%)` }"
            >
              <!-- Slide Page (Up to 6 reviews per slide) -->
              <div
                v-for="(page, pIdx) in reviewPages"
                :key="pIdx"
                class="w-full shrink-0 px-0.5"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div
                    v-for="item in page"
                    :key="item.id"
                    class="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 relative hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                  >
                    <!-- Badge if it's the current user's review -->
                    <div
                      v-if="currentUser && (item.userId === currentUser.id || item.userEmail === currentUser.email)"
                      class="absolute top-5 right-5 flex items-center gap-1.5"
                    >
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-[#FF7315] border border-orange-200">
                        Ulasan Kamu
                      </span>
                      <button
                        type="button"
                        @click="openSettings('review')"
                        title="Ubah ulasan Anda di profil"
                        class="p-1 rounded-lg text-slate-400 hover:text-[#FF7315] hover:bg-orange-50 transition cursor-pointer"
                      >
                        <Edit3 class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div class="space-y-4">
                      <div class="text-amber-400 text-base tracking-wider flex items-center gap-0.5">
                        <span v-for="star in (item.rating || 5)" :key="star">⭐</span>
                      </div>
                      <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                        "{{ item.comment }}"
                      </p>
                    </div>

                    <div class="pt-4 border-t border-slate-100 flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-lg flex items-center justify-center shadow-inner shrink-0">
                        {{ item.userAvatar || '👧' }}
                      </div>
                      <div class="text-left min-w-0">
                        <h4 class="text-xs font-extrabold text-[#0F3261] truncate">{{ item.userName }}</h4>
                        <p class="text-[11px] font-medium text-slate-400 truncate">{{ item.userRole }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Floating Navigation Arrows for Desktop -->
            <button
              v-if="totalReviewPages > 1"
              type="button"
              @click="prevReviewPage"
              title="Lihat ulasan sebelumnya"
              class="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-[#0F3261] items-center justify-center hover:bg-[#3DA5FF] hover:text-white transition-all cursor-pointer z-20 group hover:scale-110 active:scale-95"
            >
              <ChevronLeft class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              v-if="totalReviewPages > 1"
              type="button"
              @click="nextReviewPage"
              title="Lihat ulasan berikutnya"
              class="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-[#0F3261] items-center justify-center hover:bg-[#3DA5FF] hover:text-white transition-all cursor-pointer z-20 group hover:scale-110 active:scale-95"
            >
              <ChevronRight class="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <!-- Bottom Slide Dots & Summary Counter -->
          <div v-if="totalReviewPages > 1" class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <div class="flex items-center gap-2">
              <button
                v-for="pIdx in totalReviewPages"
                :key="pIdx"
                type="button"
                @click="goToReviewPage(pIdx - 1)"
                :class="[
                  'h-2.5 rounded-full transition-all duration-300 cursor-pointer',
                  currentReviewPage === (pIdx - 1)
                    ? 'w-8 bg-[#FF7315] shadow-xs'
                    : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                ]"
                :title="`Buka slide ${pIdx}`"
              ></button>
            </div>
            <span class="text-xs font-bold text-slate-400">
              Menampilkan {{ currentReviewPage * REVIEWS_PER_PAGE + 1 }}–{{ Math.min((currentReviewPage + 1) * REVIEWS_PER_PAGE, displayReviews.length) }} dari {{ displayReviews.length }} ulasan
            </span>
          </div>

          <!-- Bottom Action Box: Encourage User Review -->
          <div class="mt-4 p-6 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3.5 text-center sm:text-left">
              <div class="w-12 h-12 rounded-2xl bg-white border border-blue-100 text-amber-500 flex items-center justify-center text-xl shadow-xs shrink-0 mx-auto sm:mx-0">
                <MessageSquareHeart class="w-6 h-6 text-[#FF7315]" />
              </div>
              <div>
                <h4 class="text-sm font-extrabold text-[#0F3261]">Punya Pengalaman Belajar Seru di Inkluvia?</h4>
                <p class="text-xs text-slate-500 mt-0.5">
                  Bagikan ulasan Anda sekarang. Ulasan dapat diedit kapan saja dan langsung tampil di halaman ini!
                </p>
              </div>
            </div>

            <div class="shrink-0 w-full sm:w-auto">
              <button
                v-if="isAuthenticated"
                type="button"
                @click="openSettings('review')"
                class="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#FF7315] hover:bg-[#e86105] text-white text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Star class="w-3.5 h-3.5 fill-white text-white" />
                <span>Tulis / Ubah Ulasan Saya</span>
              </button>
              <button
                v-else
                type="button"
                @click="navigateToAuth('login', 'Masuk ke akun Anda untuk membagikan ulasan di Inkluvia!')"
                class="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#3DA5FF] hover:bg-[#3587CE] text-white text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Masuk untuk Memberi Ulasan</span>
              </button>
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

            <!-- Authentic Hand-drawn Doodles for CTA Banner -->
            <div class="absolute top-6 left-8 pointer-events-none select-none hidden sm:block opacity-80 animate-pulse-subtle">
              <DoodleOrnament name="sparkle" color="#FFDC58" :size="32" />
            </div>
            <div class="absolute bottom-6 right-10 pointer-events-none select-none hidden sm:block opacity-75 rotate-12 animate-bounce-subtle">
              <DoodleOrnament name="star-outline" color="#FFDC58" :size="42" />
            </div>
            <div class="absolute top-8 right-12 pointer-events-none select-none hidden md:block opacity-60">
              <DoodleOrnament name="burst" color="#FFFFFF" :size="30" />
            </div>
            <div class="absolute -bottom-2 left-10 pointer-events-none select-none hidden lg:block opacity-70">
              <DoodleOrnament name="squiggle" color="#FFDC58" :size="65" />
            </div>

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
        @open-settings="openSettings"
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



    <!-- ==================== VIEW: PRICING (PAKET HARGA) ==================== -->
    <main v-else-if="currentNav === 'harga'" class="w-full flex-1 flex flex-col">
      <PricingView
        @navigate-auth="navigateToAuth"
      />
    </main>

    <!-- ==================== VIEW: SETTINGS & AKUN ==================== -->
    <main v-else-if="currentNav === 'settings' && isAuthenticated" class="w-full flex-1 flex flex-col">
      <SettingsView
        :initial-tab="settingsInitialTab"
        @back="navigateTo(previousNav || 'beranda')"
        @navigate="navigateTo"
        @logout="handleLogout"
        @updated="refreshDisplayReviews"
      />
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

    <!-- ==================== MODERN INCLUSIVE FOOTER ==================== -->
    <footer
      v-if="!['learning-player', 'auth'].includes(currentNav)"
      class="w-full text-white mt-auto relative overflow-hidden shrink-0"
      style="background: linear-gradient(165deg, #07172E 0%, #0F3261 45%, #13396D 100%);"
    >
      <!-- Playful Top Ribbon Accent with Inkluvia 4 Colors -->
      <div class="h-2 w-full flex">
        <div class="flex-1 bg-[#3DA5FF]"></div>
        <div class="flex-1 bg-[#FF74BC]"></div>
        <div class="flex-1 bg-[#FFDC58]"></div>
        <div class="flex-1 bg-[#74DC2E]"></div>
      </div>

      <!-- Decorative Ambient Lights & Doodles in Footer -->
      <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-20" style="background: radial-gradient(circle, #3DA5FF 0%, transparent 70%);"></div>
      <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none opacity-15" style="background: radial-gradient(circle, #FF74BC 0%, transparent 70%);"></div>
      
      <!-- Subtle Footer Doodle SVG Ornaments -->
      <DoodleOrnament type="star" class="absolute top-12 left-1/3 w-8 h-8 text-[#FFDC58]/25 pointer-events-none hidden md:block" />
      <DoodleOrnament type="burst" class="absolute bottom-16 right-16 w-10 h-10 text-[#74DC2E]/25 pointer-events-none hidden lg:block" />
      <DoodleOrnament type="squiggly" class="absolute top-8 right-1/4 w-12 h-6 text-[#FF74BC]/25 pointer-events-none hidden sm:block" />

      <div class="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
        
        <!-- Top Row: Kid-Friendly Interactive Mascot Banner -->
        <div class="mb-12 p-6 sm:p-8 rounded-3xl bg-white/06 border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4 text-center md:text-left">
            <div class="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
              🧊
            </div>
            <div>
              <h4 class="text-base sm:text-lg font-black text-white">
                Siap Menjelajah Bersama Si Es Batu?
              </h4>
              <p class="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                Pilih gaya belajarmu hari ini. Ada Standar, Slow, Kontras Tinggi, dan Fokus Mandiri!
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button
              @click="navigateTo('materi'); playButtonPop()"
              class="px-5 py-2.5 rounded-full bg-[#FF7315] hover:bg-[#ff822a] text-white text-xs sm:text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Mulai Belajar Gratis</span>
              <ArrowRight class="w-4 h-4" />
            </button>
            <button
              @click="navigateTo('harga'); playButtonPop()"
              class="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-extrabold border border-white/20 transition cursor-pointer"
            >
              Lihat Paket
            </button>
          </div>
        </div>

        <!-- Main Footer Links Grid (4 Columns) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 text-left">
          
          <!-- Column 1: Brand Info & Values -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-white rounded-2xl shadow-sm">
                <img src="/Logo.png" alt="Logo Inkluvia" class="h-8 w-auto" />
              </div>
              <div>
                <span class="text-2xl font-black tracking-tight text-white block leading-none">Inkluvia</span>
                <span class="text-[11px] font-bold text-[#FFDC58] tracking-wider uppercase mt-1 block">Media Belajar Adaptif</span>
              </div>
            </div>
            
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md font-normal">
              Platform media edukasi adaptif dan interaktif yang dibangun khusus untuk memberikan kesetaraan belajar bagi anak-anak Indonesia, termasuk anak berkebutuhan khusus (ABK).
            </p>
            
            <!-- Value Badges -->
            <div class="flex items-center gap-2 flex-wrap pt-1">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#3DA5FF]/20 text-[#3DA5FF] border border-[#3DA5FF]/30">
                ⭐ Adaptif
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#FF74BC]/20 text-[#FF74BC] border border-[#FF74BC]/30">
                💖 Inklusif
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#74DC2E]/20 text-[#74DC2E] border border-[#74DC2E]/30">
                🌿 Ramah Sensorik
              </span>
            </div>
          </div>

          <!-- Column 2: Navigasi Cepat -->
          <div class="space-y-3">
            <h3 class="text-xs font-black text-amber-400 uppercase tracking-widest">Navigasi</h3>
            <ul class="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li>
                <button @click="navigateTo('beranda')" class="hover:text-[#3DA5FF] hover:translate-x-1 transition-all cursor-pointer inline-flex items-center gap-1.5">
                  <ArrowRight class="w-3 h-3 text-[#3DA5FF]" /> Beranda
                </button>
              </li>
              <li>
                <button @click="navigateTo('materi')" class="hover:text-[#3DA5FF] hover:translate-x-1 transition-all cursor-pointer inline-flex items-center gap-1.5">
                  <ArrowRight class="w-3 h-3 text-[#3DA5FF]" /> Jelajahi Materi (SD, SMP, SMA)
                </button>
              </li>
              <li>
                <button @click="navigateTo('harga')" class="hover:text-[#FF7315] hover:translate-x-1 transition-all cursor-pointer inline-flex items-center gap-1.5">
                  <ArrowRight class="w-3 h-3 text-[#FF7315]" /> Paket Langganan & Harga
                </button>
              </li>
              <li v-if="isAuthenticated">
                <button @click="openSettings('profile')" class="hover:text-[#74DC2E] hover:translate-x-1 transition-all cursor-pointer inline-flex items-center gap-1.5">
                  <ArrowRight class="w-3 h-3 text-[#74DC2E]" /> Pengaturan Akun
                </button>
              </li>
              <li v-if="isAuthenticated">
                <button @click="openSettings('review')" class="hover:text-amber-400 hover:translate-x-1 transition-all cursor-pointer inline-flex items-center gap-1.5">
                  <ArrowRight class="w-3 h-3 text-amber-400" /> Tulis / Ubah Ulasan Website
                </button>
              </li>
              <li v-if="isAdmin">
                <button @click="navigateTo('admin')" class="hover:text-orange-400 hover:translate-x-1 transition-all cursor-pointer inline-flex items-center gap-1.5 font-bold text-orange-400">
                  <ArrowRight class="w-3 h-3 text-orange-400" /> CMS Admin Inkluvia
                </button>
              </li>
            </ul>
          </div>

          <!-- Column 3: 4 Mode Belajar Inkluvia -->
          <div class="space-y-3">
            <h3 class="text-xs font-black text-emerald-400 uppercase tracking-widest">4 Mode Belajar</h3>
            <ul class="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0F3261] ring-2 ring-[#3587CE]"></span>
                <span class="font-bold text-white">Standar:</span>
                <span class="text-slate-400 text-xs">Audio Visual Dinamis</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#3DA5FF] ring-2 ring-blue-300"></span>
                <span class="font-bold text-white">Slow:</span>
                <span class="text-slate-400 text-xs">Artikulasi Bertahap</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-200"></span>
                <span class="font-bold text-white">Kontras Tinggi:</span>
                <span class="text-slate-400 text-xs">Rasio Kontras Optimal</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#74DC2E] ring-2 ring-emerald-300"></span>
                <span class="font-bold text-white">Fokus Mandiri:</span>
                <span class="text-slate-400 text-xs">Minimalis Bebas Distraksi</span>
              </li>
            </ul>
          </div>

          <!-- Column 4: Dukungan & Komunitas -->
          <div class="space-y-3">
            <h3 class="text-xs font-black text-pink-400 uppercase tracking-widest">Dukungan & Komunitas</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              Punya pertanyaan seputar kurikulum inklusif atau membutuhkan demo untuk sekolah?
            </p>
            <div class="space-y-2 pt-1 text-xs text-slate-300">
              <div class="flex items-center gap-2">
                <span class="text-[#3DA5FF] font-bold">📧 Email:</span>
                <a href="mailto:halo@inkluvia.id" class="hover:text-white underline">halo@inkluvia.id</a>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[#74DC2E] font-bold">⏰ Layanan:</span>
                <span>Senin - Jumat (08.00 - 17.00 WIB)</span>
              </div>
            </div>

            <!-- Social Links / Community Pills -->
            <div class="flex items-center gap-2.5 pt-2">
              <a
                href="#"
                @click.prevent
                title="Komunitas Edukasi WhatsApp"
                class="px-3 py-1 rounded-full bg-white/10 hover:bg-[#74DC2E] hover:text-slate-900 text-white flex items-center gap-1.5 transition cursor-pointer text-xs font-bold"
              >
                <span>WhatsApp</span>
              </a>
              <a
                href="#"
                @click.prevent
                title="Instagram Resmi Inkluvia"
                class="px-3 py-1 rounded-full bg-white/10 hover:bg-[#FF74BC] hover:text-white text-white flex items-center gap-1.5 transition cursor-pointer text-xs font-bold"
              >
                <span>Instagram</span>
              </a>
              <a
                href="#"
                @click.prevent
                title="YouTube Edukasi Inkluvia"
                class="px-3 py-1 rounded-full bg-white/10 hover:bg-[#FF7315] hover:text-white text-white flex items-center gap-1.5 transition cursor-pointer text-xs font-bold"
              >
                <span>YouTube</span>
              </a>
            </div>
          </div>

        </div>

        <!-- Bottom Copyright & Legal -->
        <div class="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 border-t border-white/10">
          <p>© 2026 <span class="font-bold text-white">Inkluvia</span>. Hak Cipta Dilindungi. Media Belajar Inklusif Indonesia.</p>
          <div class="flex items-center gap-5 font-medium flex-wrap justify-center">
            <span class="text-slate-400">🛡️ WCAG 2.1 AA Compliant</span>
            <span class="text-slate-400">•</span>
            <a href="#" @click.prevent class="hover:text-white transition">Kebijakan Privasi</a>
            <span class="text-slate-400">•</span>
            <a href="#" @click.prevent class="hover:text-white transition">Syarat & Ketentuan</a>
            <span class="text-slate-400">•</span>
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
