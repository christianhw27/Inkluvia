<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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
  Sparkles
} from '@lucide/vue'
import MateriView from './components/MateriView.vue'
import MateriDetailView from './components/MateriDetailView.vue'
import ModeSelectView from './components/ModeSelectView.vue'
import LearningPlayerView from './components/LearningPlayerView.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import AuthModal from './components/AuthModal.vue'
import GuruView from './components/GuruView.vue'
import { materiList, selectedMateri } from './lib/materiService'
import {
  currentUser,
  isAuthenticated,
  isAdmin,
  logoutUser
} from './lib/authService'

// Navigation state
const currentNav = ref('beranda')
const searchQuery = ref('')

// Active item and mode tracking
const activeMateriItem = ref(null)
const chosenMode = ref('standard')

// Auth Modal state
const showAuthModal = ref(false)
const authInitialTab = ref('login')
const showUserDropdown = ref(false)

// Close dropdown on outside click
const dropdownRef = ref(null)
const handleOutsideClick = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showUserDropdown.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

const openAuth = (tab = 'login') => {
  authInitialTab.value = tab
  showAuthModal.value = true
  showUserDropdown.value = false
}

const handleLogout = async () => {
  await logoutUser()
  showUserDropdown.value = false
  if (['admin'].includes(currentNav.value)) {
    currentNav.value = 'beranda'
  }
}

const navigateTo = (tab) => {
  if (tab === 'admin' && !isAdmin.value) {
    openAuth('login')
    return
  }
  currentNav.value = tab
  showUserDropdown.value = false
}

// Flow Handlers
const handleOpenDetail = (item) => {
  activeMateriItem.value = item || materiList.value[0]
  currentNav.value = 'materi-detail'
}

const handleStartAdventure = () => {
  currentNav.value = 'mode-select'
}

const handleModeSelected = (mode) => {
  chosenMode.value = mode
  currentNav.value = 'learning-player'
}

const handlePreviewFromAdmin = (item) => {
  activeMateriItem.value = item
  currentNav.value = 'materi-detail'
}
</script>

<template>
  <div class="w-full min-h-screen bg-[#F4F8FD] text-slate-800 font-sans flex flex-col overflow-x-hidden">
    <!-- ==================== HEADER / NAVBAR ==================== -->
    <header class="bg-white border-b border-slate-100 shrink-0 z-30 shadow-sm sticky top-0">
      <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">

        <!-- Left: Logo + Nav Links -->
        <div class="flex items-center gap-8">
          <!-- Logo -->
          <button
            @click="navigateTo('beranda')"
            class="flex items-center gap-2.5 group cursor-pointer shrink-0"
          >
            <img
              src="/Logo.png"
              alt="Logo Inkluvia"
              class="h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <span class="text-[22px] font-extrabold text-[#0F3261] tracking-tight hidden sm:block">
              Inkluvia
            </span>
          </button>

          <!-- Nav Links -->
          <nav class="hidden md:flex items-center gap-1">
            <button
              @click="navigateTo('beranda')"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer',
                currentNav === 'beranda'
                  ? 'bg-[#0F3261]/8 text-[#0F3261]'
                  : 'text-slate-600 hover:text-[#0F3261] hover:bg-slate-50'
              ]"
            >
              Beranda
            </button>
            <button
              @click="navigateTo('materi')"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer',
                ['materi', 'materi-detail', 'mode-select', 'learning-player'].includes(currentNav)
                  ? 'bg-[#FF7315]/10 text-[#FF7315]'
                  : 'text-slate-600 hover:text-[#FF7315] hover:bg-orange-50/50'
              ]"
            >
              Materi
            </button>
            <button
              @click="navigateTo('guru')"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer',
                currentNav === 'guru'
                  ? 'bg-[#0F3261]/8 text-[#0F3261]'
                  : 'text-slate-600 hover:text-[#0F3261] hover:bg-slate-50'
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
              class="w-full bg-[#F4F8FD] hover:bg-[#EDF4FC] focus:bg-white text-sm pl-10 pr-4 py-2 rounded-full border border-slate-200 focus:border-[#3DA5FF] focus:outline-none focus:ring-2 focus:ring-[#3DA5FF]/20 transition placeholder:text-slate-400 text-slate-700"
            />
          </div>

          <!-- NOT LOGGED IN -->
          <div v-if="!isAuthenticated" class="flex items-center gap-2 shrink-0">
            <button
              @click="openAuth('login')"
              class="px-4 py-2 rounded-full border-2 border-[#3DA5FF] text-[#3587CE] hover:bg-blue-50 font-semibold text-sm transition active:scale-95 cursor-pointer"
            >
              Masuk
            </button>
            <button
              @click="openAuth('register')"
              class="px-4 py-2 rounded-full text-white font-semibold text-sm transition active:scale-95 cursor-pointer shadow-lg"
              style="background: linear-gradient(135deg,#FF7315,#e86105); box-shadow: 0 4px 12px rgba(255,115,21,0.3);"
            >
              Daftar
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
      <!-- Hero Banner Section -->
      <section class="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] w-full overflow-hidden flex items-center bg-[#E4F3FD]">
        <img
          src="/Banner_Dashboard.jpg"
          alt="Banner Inkluvia"
          class="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none select-none"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-[#DDF1FF]/95 via-[#E6F4FE]/85 to-transparent lg:w-[62%] w-full pointer-events-none"></div>

        <div class="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
          <div class="max-w-xl lg:max-w-2xl space-y-6 ml-0 sm:ml-6 md:ml-12 lg:ml-16">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-[#0F3261] border border-[#3DA5FF]/30 shadow-sm">
              <Sparkles class="w-4 h-4 text-[#FF7315]" />
              Platform Belajar Adaptif & Inklusif
            </div>

            <h1 class="text-3xl sm:text-4xl lg:text-[48px] xl:text-[54px] font-extrabold text-[#0F3261] leading-[1.14] tracking-tight">
              Belajar dengan<br />
              <span class="text-[#3587CE]">Cara yang Sesuai</span><br />
              <span class="text-[#FF7315]">untukmu!</span>
            </h1>

            <p class="text-sm lg:text-base text-slate-600 leading-relaxed max-w-md font-medium">
              Jelajahi media pembelajaran interaktif yang dirancang khusus untuk berbagai kebutuhan dan gaya belajar anak Indonesia — menyenangkan, ramah, dan bebas dari hambatan.
            </p>

            <div class="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                @click="handleOpenDetail(materiList[0])"
                class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-sm shadow-xl transition active:scale-95 cursor-pointer hover:shadow-2xl"
                style="background: linear-gradient(135deg,#FF7315,#e86105); box-shadow: 0 6px 20px rgba(255,115,21,0.35);"
              >
                Mulai Belajar
                <ArrowRight class="w-4 h-4" />
              </button>
              <button
                @click="navigateTo('materi')"
                class="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#3587CE] border-2 border-[#3DA5FF] font-bold text-sm shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer"
              >
                Jelajahi Materi
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Bottom Feature Section -->
      <section class="shrink-0 w-full bg-white rounded-t-[32px] sm:rounded-t-[40px] shadow-sm border-t border-slate-100 px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
        <div class="w-full max-w-[1600px] mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            <!-- Kenapa Inkluvia -->
            <div class="md:col-span-7 flex flex-col justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-[#FF7315] uppercase tracking-wider">Keunggulan Platform</span>
                <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F3261] mt-0.5">Kenapa Memilih Inkluvia?</h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                <!-- Adaptif -->
                <div class="rounded-2xl border border-slate-100 bg-[#F8FAFC] hover:bg-white p-5 text-center flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 group min-h-[155px]">
                  <div class="w-13 h-13 rounded-2xl bg-[#FFEFE6] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <Target class="w-6 h-6 text-[#FF7315]" />
                  </div>
                  <h3 class="text-sm font-bold text-[#0F3261] mt-3 mb-1">Adaptif</h3>
                  <p class="text-[11px] text-slate-500 leading-snug">Pengalaman belajar yang dapat disesuaikan dengan ritme anak.</p>
                </div>

                <!-- Inklusif -->
                <div class="rounded-2xl border border-slate-100 bg-[#F8FAFC] hover:bg-white p-5 text-center flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group min-h-[155px]">
                  <div class="w-13 h-13 rounded-2xl bg-[#EAF3FD] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <Accessibility class="w-6 h-6 text-[#3587CE]" />
                  </div>
                  <h3 class="text-sm font-bold text-[#0F3261] mt-3 mb-1">Inklusif</h3>
                  <p class="text-[11px] text-slate-500 leading-snug">Mempertimbangkan keberagaman gaya dan kebutuhan belajar.</p>
                </div>

                <!-- Interaktif -->
                <div class="rounded-2xl border border-slate-100 bg-[#F8FAFC] hover:bg-white p-5 text-center flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 group min-h-[155px]">
                  <div class="w-13 h-13 rounded-2xl bg-[#F3EBF7] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <Gamepad2 class="w-6 h-6 text-[#E1529C]" />
                  </div>
                  <h3 class="text-sm font-bold text-[#0F3261] mt-3 mb-1">Interaktif</h3>
                  <p class="text-[11px] text-slate-500 leading-snug">Belajar melalui eksperimen visual dan simulasi yang menyenangkan.</p>
                </div>
              </div>
            </div>

            <!-- Materi Unggulan Card -->
            <div class="md:col-span-5 flex flex-col">
              <div class="rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                <div class="w-full sm:w-40 md:w-44 h-40 sm:h-full max-h-[185px] rounded-2xl overflow-hidden shrink-0 border border-slate-100 relative group">
                  <img src="/es_batu_card.jpg" alt="Petualangan Si Es Batu" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#74DC2E] text-slate-900 shadow">
                    Populer
                  </span>
                </div>

                <div class="flex-1 space-y-2 text-left w-full">
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF7315] text-white">Materi Unggulan</span>
                  <h3 class="text-lg sm:text-xl font-extrabold text-[#0F3261] leading-tight">Petualangan Si Es Batu</h3>
                  <p class="text-[11px] font-semibold text-slate-400">IPAS &bull; Kelas IV &bull; Fase B</p>
                  <p class="text-xs text-slate-600 leading-relaxed">Mengenal perubahan wujud benda padat ke cair secara interaktif.</p>
                  <button
                    @click="handleOpenDetail(materiList[0])"
                    class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer mt-1"
                    style="background:#FF7315;"
                  >
                    Mulai Belajar <ArrowRight class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>

    <!-- ==================== VIEW: KATALOG MATERI ==================== -->
    <main v-else-if="currentNav === 'materi'" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <MateriView
        :search-query="searchQuery"
        @open-detail="handleOpenDetail"
      />
    </main>

    <!-- ==================== VIEW: DETAIL MATERI ==================== -->
    <main v-else-if="currentNav === 'materi-detail'" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <MateriDetailView
        :materi="activeMateriItem || materiList[0]"
        @back="navigateTo('materi')"
        @start="handleStartAdventure"
      />
    </main>

    <!-- ==================== VIEW: PILIH MODE BELAJAR ==================== -->
    <main v-else-if="currentNav === 'mode-select'" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <ModeSelectView
        :materi="activeMateriItem || materiList[0]"
        @back="navigateTo('materi-detail')"
        @select-mode="handleModeSelected"
      />
    </main>

    <!-- ==================== VIEW: LEARNING PLAYER ==================== -->
    <main v-else-if="currentNav === 'learning-player'" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <LearningPlayerView
        :materi="activeMateriItem || materiList[0]"
        :initial-mode="chosenMode"
        @back="navigateTo('mode-select')"
        @finish="navigateTo('materi')"
      />
    </main>

    <!-- ==================== VIEW: DASHBOARD ADMIN ==================== -->
    <main v-else-if="currentNav === 'admin'" class="w-full flex-1">
      <AdminDashboard
        @preview-materi="handlePreviewFromAdmin"
        @back-to-app="navigateTo('materi')"
        @open-auth="openAuth('login')"
      />
    </main>

    <!-- ==================== VIEW: UNTUK GURU ==================== -->
    <main v-else-if="currentNav === 'guru'" class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <GuruView />
    </main>

    <!-- ==================== VIEW: DEFAULT FALLBACK ==================== -->
    <main v-else class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1">
      <GuruView />
    </main>

    <!-- ==================== FOOTER ==================== -->
    <footer v-if="currentNav !== 'learning-player'" class="w-full bg-[#0F3261] text-white mt-auto border-t border-slate-800/40 relative overflow-hidden shrink-0">
      <!-- Decorative Color Bar matching design.md palette -->
      <div class="h-1.5 w-full grid grid-cols-4">
        <div class="bg-[#3DA5FF]"></div>
        <div class="bg-[#FF74BC]"></div>
        <div class="bg-[#FFDC58]"></div>
        <div class="bg-[#74DC2E]"></div>
      </div>

      <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-14">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          <!-- Column 1: Brand Info (2 cols width on lg) -->
          <div class="lg:col-span-2 space-y-4 text-left">
            <div class="flex items-center gap-3">
              <img src="/Logo.png" alt="Logo Inkluvia" class="h-10 w-auto bg-white rounded-xl p-1 shadow-sm" />
              <span class="text-2xl font-extrabold tracking-tight text-white">Inkluvia</span>
            </div>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md font-normal">
              Platform media pembelajaran interaktif & adaptif yang dirancang ramah untuk semua kebutuhan belajar anak Indonesia. Mengusung konsep inklusif, ceria, dan mudah dipahami.
            </p>
            
            <div class="flex items-center gap-2 pt-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#3DA5FF]/20 text-[#3DA5FF] border border-[#3DA5FF]/30">
                <span class="w-2 h-2 rounded-full bg-[#3DA5FF]"></span> Adaptif
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF74BC]/20 text-[#FF74BC] border border-[#FF74BC]/30">
                <span class="w-2 h-2 rounded-full bg-[#FF74BC]"></span> Inklusif
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#74DC2E]/20 text-[#74DC2E] border border-[#74DC2E]/30">
                <span class="w-2 h-2 rounded-full bg-[#74DC2E]"></span> Interaktif
              </span>
            </div>
          </div>

          <!-- Column 2: Navigasi Utama -->
          <div class="space-y-3 text-left">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigasi Utama</h3>
            <ul class="space-y-2 text-xs sm:text-sm text-slate-300 font-medium">
              <li>
                <button @click="navigateTo('beranda')" class="hover:text-[#3DA5FF] transition cursor-pointer">Beranda</button>
              </li>
              <li>
                <button @click="navigateTo('materi')" class="hover:text-[#3DA5FF] transition cursor-pointer">Katalog Materi</button>
              </li>
              <li>
                <button @click="navigateTo('guru')" class="hover:text-[#3DA5FF] transition cursor-pointer">Untuk Guru & Pengajar</button>
              </li>
              <li v-if="isAdmin">
                <button @click="navigateTo('admin')" class="hover:text-[#FF7315] text-[#FF7315] transition cursor-pointer font-bold">Dashboard Admin (CMS)</button>
              </li>
            </ul>
          </div>

          <!-- Column 3: Kategori Materi -->
          <div class="space-y-3 text-left">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</h3>
            <ul class="space-y-2 text-xs sm:text-sm text-slate-300 font-medium">
              <li>
                <button @click="navigateTo('materi')" class="hover:text-[#FFDC58] transition cursor-pointer">IPAS (Sains & Sosial)</button>
              </li>
              <li>
                <button @click="navigateTo('materi')" class="hover:text-[#FFDC58] transition cursor-pointer">Matematika Interaktif</button>
              </li>
              <li>
                <button @click="navigateTo('materi')" class="hover:text-[#FFDC58] transition cursor-pointer">Bahasa Indonesia</button>
              </li>
              <li>
                <button @click="navigateTo('materi')" class="hover:text-[#FFDC58] transition cursor-pointer">Lembar Kerja & Asesmen</button>
              </li>
            </ul>
          </div>

          <!-- Column 4: Dukungan & Informasi -->
          <div class="space-y-3 text-left">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Belajar</h3>
            <ul class="space-y-2 text-xs sm:text-sm text-slate-300 font-medium">
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#FF7315]"></span> Standard Mode (Ceria)
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#3DA5FF]"></span> Focus Mode (Tenang)
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#74DC2E]"></span> Kuis & Evaluasi Mandiri
              </li>
            </ul>
          </div>

        </div>

        <!-- Bottom Copyright -->
        <div class="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Inkluvia. Hak Cipta Dilindungi. Media Pembelajaran Adaptif & Inklusif.</p>
          <div class="flex items-center gap-6 font-medium">
            <a href="#" @click.prevent class="hover:text-white transition">Kebijakan Privasi</a>
            <a href="#" @click.prevent class="hover:text-white transition">Syarat & Ketentuan</a>
            <a href="#" @click.prevent class="hover:text-white transition">Bantuan</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- AUTH MODAL -->
    <AuthModal
      :is-open="showAuthModal"
      :initial-tab="authInitialTab"
      @close="showAuthModal = false"
      @authenticated="(user) => {
        showAuthModal = false
        if (user?.role === 'admin') {
          currentNav = 'admin'
        }
      }"
    />
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
