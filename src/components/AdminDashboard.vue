<script setup>
import { ref, computed } from 'vue'
import {
  materiList, addMateri, updateMateri, deleteMateri, resetMateri, isLoadingMateri, RELIABLE_MODE_VIDEOS, sanitizeVideoUrl
} from '../lib/materiService'
import { currentUser, isAdmin, logoutUser } from '../lib/authService'
import { uploadVideo, uploadImage, isCloudinaryConfigured } from '../lib/cloudinary'
import {
  pricingConfig,
  savePricingConfig,
  resetPricingConfig,
  formatRupiah
} from '../lib/pricingService'
import { playMascotChime } from '../lib/soundEffects'
import {
  LayoutDashboard, BookOpen, Video, Settings, LogOut, Plus, Trash2, Edit3, Eye,
  X, Sun, CheckCircle2, UploadCloud, ShieldAlert, Search, Bell, ChevronRight,
  FileVideo, CloudUpload, RefreshCw, Sparkles, TrendingUp, Users, Clock,
  ArrowUpRight, MoreVertical, Filter, Download, AlertCircle, Menu, ChevronDown,
  ArrowLeft, Save, ImagePlus, ListVideo, Tag, AlignLeft, Layers, HelpCircle,
  Percent, DollarSign, RotateCcw, CreditCard
} from '@lucide/vue'

const emit = defineEmits(['previewMateri', 'backToApp', 'openAuth'])

// Sidebar nav state
const activePage = ref('dashboard') // 'dashboard' | 'materi' | 'video' | 'pricing' | 'settings'
const sidebarCollapsed = ref(false)

// Modal state
const showForm = ref(false)
const isEditing = ref(false)
const activeFormTab = ref('general')

// Search/filter in table
const tableSearch = ref('')
const selectedJenjangFilter = ref('Semua')

// Upload state
const isUploadingVideo = ref(false)
const uploadProgress = ref(0)
const uploadTargetKey = ref(null)
const dragOverKey = ref(null)

const isUploadingImage = ref(false)
const imageUploadProgress = ref(0)

// Form data
const currentForm = ref(getEmptyForm())

function getEmptyForm() {
  return {
    id: '',
    title: '',
    jenjang: 'SD',
    mataPelajaran: 'IPAS',
    level: 'IPAS • Kelas IV • Fase B',
    description: 'Yuk ikuti perjalanan Es Batu dan temukan bagaimana benda dapat berubah wujud!',
    badge: 'Gratis',
    duration: '± 5 menit',
    activityType: 'Video + Aktivitas',
    learningOptions: '4 Mode Belajar (Standar, Slow, High Contrast, Focus)',
    image: '/es_batu_card.jpg',
    types: ['Video', 'Interaktif'],
    learningPoints: [
      { id: 'lp-1', title: 'Mencair' },
      { id: 'lp-2', title: 'Menguap' },
      { id: 'lp-3', title: 'Mengembun' }
    ],
    standardContent: {
      title: 'Petualangan Si Es Batu (Standar)',
      text: 'Yuk ikuti perjalanan Es Batu dan temukan bagaimana benda dapat berubah wujud dari padat, cair, hingga gas!',
      videoUrl: RELIABLE_MODE_VIDEOS.standard
    },
    slowContent: {
      title: 'Petualangan Si Es Batu (Slow)',
      text: 'Es batu dipanaskan secara perlahan... berubah menjadi air cair, lalu menguap menjadi gas di udara.',
      videoUrl: RELIABLE_MODE_VIDEOS.slow
    },
    highContrastContent: {
      title: 'PERUBAHAN WUJUD BENDA',
      text: 'ES BATU (PADAT) -> AIR (CAIR) -> UAP (GAS). PROSES MENCAIR, MENGUAP, DAN MENGEMBUN.',
      videoUrl: RELIABLE_MODE_VIDEOS.high_contrast
    },
    focusContent: {
      title: 'Es Batu = Perubahan Wujud',
      text: 'Es batu (Padat) → Air (Cair) → Uap (Gas). Kamu hebat sudah belajar hari ini!',
      videoUrl: RELIABLE_MODE_VIDEOS.focus
    },
    assessment: {
      title: 'Asesmen & Kuis Pemahaman',
      questions: [
        {
          id: 'q-1',
          questionText: 'Apa yang terjadi pada es batu padat ketika dipanaskan?',
          options: [
            'Mencair menjadi air cair',
            'Membeku menjadi es batu keras',
            'Menjadi batu besar',
            'Tidak terjadi perubahan'
          ],
          correctOptionIndex: 0
        },
        {
          id: 'q-2',
          questionText: 'Proses perubahan wujud air cair menjadi uap gas disebut...',
          options: [
            'Mencair',
            'Menguap',
            'Mengembun',
            'Membeku'
          ],
          correctOptionIndex: 1
        }
      ]
    }
  }
}

const openAddForm = () => {
  isEditing.value = false
  currentForm.value = getEmptyForm()
  activeFormTab.value = 'general'
  showForm.value = true
  activePage.value = 'materi'
}

const openEditForm = (item) => {
  isEditing.value = true
  const copy = JSON.parse(JSON.stringify(item))
  if (!copy.learningPoints) {
    copy.learningPoints = [
      { id: 'lp-1', title: 'Konsep Utama' },
      { id: 'lp-2', title: 'Aktivitas Belajar' }
    ]
  }
  if (!copy.standardContent) copy.standardContent = { title: copy.title || '', text: copy.description || '', videoUrl: '' }
  if (!copy.slowContent) copy.slowContent = { title: `${copy.title || ''} (Slow)`, text: copy.description || '', videoUrl: '' }
  if (!copy.highContrastContent) copy.highContrastContent = { title: copy.title?.toUpperCase() || '', text: copy.description?.toUpperCase() || '', videoUrl: '' }
  if (!copy.focusContent) copy.focusContent = { title: copy.title || '', text: copy.description || '', videoUrl: '' }
  if (!copy.assessment) {
    copy.assessment = {
      title: `${copy.title || 'Materi'} - Asesmen Pemahaman`,
      questions: [
        {
          id: 'q-1',
          questionText: 'Apa poin utama yang dipelajari pada materi ini?',
          options: ['Opsi Jawaban A', 'Opsi Jawaban B', 'Opsi Jawaban C', 'Opsi Jawaban D'],
          correctOptionIndex: 0
        }
      ]
    }
  }

  currentForm.value = copy
  activeFormTab.value = 'general'
  showForm.value = true
}

const addLearningPoint = () => {
  if (!currentForm.value.learningPoints) currentForm.value.learningPoints = []
  currentForm.value.learningPoints.push({
    id: `lp-${Date.now()}`,
    title: ''
  })
}

const removeLearningPoint = (idx) => {
  if (currentForm.value.learningPoints) {
    currentForm.value.learningPoints.splice(idx, 1)
  }
}

const addQuestion = () => {
  if (!currentForm.value.assessment) {
    currentForm.value.assessment = { title: 'Asesmen & Kuis Pemahaman', questions: [] }
  }
  if (!currentForm.value.assessment.questions) {
    currentForm.value.assessment.questions = []
  }
  currentForm.value.assessment.questions.push({
    id: `q-${Date.now()}`,
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0
  })
}

const removeQuestion = (idx) => {
  if (currentForm.value.assessment?.questions) {
    currentForm.value.assessment.questions.splice(idx, 1)
  }
}

const handleSave = async () => {
  if (!currentForm.value.title.trim()) {
    alert('Judul materi wajib diisi')
    return
  }
  if (isUploadingVideo.value || isUploadingImage.value) {
    alert('Tunggu sebentar, upload video/gambar masih berjalan. Simpan setelah upload selesai (100%).')
    return
  }
  if (isEditing.value && currentForm.value.id) {
    await updateMateri(currentForm.value.id, currentForm.value)
  } else {
    await addMateri(currentForm.value)
  }
  showForm.value = false
}

const handleDelete = async (id, title) => {
  if (confirm(`Hapus materi "${title}"?\nData tidak dapat dikembalikan.`)) {
    await deleteMateri(id)
  }
}

// Video upload for 4 modes
const doUpload = async (file, modeKey) => {
  const modeMap = {
    standard: 'standardContent',
    slow: 'slowContent',
    high_contrast: 'highContrastContent',
    focus: 'focusContent'
  }
  const field = modeMap[modeKey] || 'standardContent'
  uploadTargetKey.value = modeKey
  uploadProgress.value = 0

  if (!isCloudinaryConfigured) {
    currentForm.value[field].videoUrl = RELIABLE_MODE_VIDEOS[modeKey] || RELIABLE_MODE_VIDEOS.standard
    uploadTargetKey.value = null
    return
  }

  isUploadingVideo.value = true
  try {
    const rawId = currentForm.value.id || currentForm.value.title || 'new_materi'
    const cleanSlug = rawId.toString().toLowerCase().replace(/[^a-z0-9]/g, '_')
    const customPublicId = `inkluvia_${cleanSlug}_${modeKey}_${Date.now()}`
    const res = await uploadVideo(file, (pct) => { uploadProgress.value = pct }, customPublicId)
    currentForm.value[field].videoUrl = res.secure_url
  } catch (err) {
    alert(`Upload gagal: ${err.message}`)
  } finally {
    isUploadingVideo.value = false
    uploadTargetKey.value = null
    uploadProgress.value = 0
  }
}

const handleDrop = async (e, modeKey) => {
  e.preventDefault()
  dragOverKey.value = null
  const file = e.dataTransfer?.files?.[0]
  if (file?.type.startsWith('video/')) await doUpload(file, modeKey)
}

const handleFileInput = async (e, modeKey) => {
  const file = e.target.files?.[0]
  if (file) await doUpload(file, modeKey)
}

// Image upload for thumbnail
const handleImageUpload = async (file) => {
  if (!file) return
  isUploadingImage.value = true
  imageUploadProgress.value = 0
  try {
    const rawId = currentForm.value.id || currentForm.value.title || 'thumb'
    const cleanSlug = rawId.toString().toLowerCase().replace(/[^a-z0-9]/g, '_')
    const customPublicId = `thumb_${cleanSlug}_${Date.now()}`
    const res = await uploadImage(file, (pct) => { imageUploadProgress.value = pct }, customPublicId)
    currentForm.value.image = res.secure_url
  } catch (err) {
    alert(`Upload gambar gagal: ${err.message}`)
  } finally {
    isUploadingImage.value = false
    imageUploadProgress.value = 0
  }
}

const handleImageFileInput = async (e) => {
  const file = e.target.files?.[0]
  if (file) await handleImageUpload(file)
}

const handleImageDrop = async (e) => {
  e.preventDefault()
  dragOverKey.value = null
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) await handleImageUpload(file)
}

// Computed stats
const totalPoinBelajar = computed(() => materiList.value.reduce((a, m) => a + (m.learningPoints?.length || 0), 0))
const totalVideos = computed(() => materiList.value.reduce((a, m) => {
  let count = 0
  if (m.standardContent?.videoUrl) count++
  if (m.slowContent?.videoUrl) count++
  if (m.highContrastContent?.videoUrl) count++
  if (m.focusContent?.videoUrl) count++
  return a + count
}, 0))

// Filtered table
const filteredMateri = computed(() => {
  let list = materiList.value
  if (selectedJenjangFilter.value !== 'Semua') list = list.filter(m => m.jenjang === selectedJenjangFilter.value)
  if (tableSearch.value.trim()) {
    const q = tableSearch.value.toLowerCase()
    list = list.filter(m => m.title?.toLowerCase().includes(q) || m.level?.toLowerCase().includes(q))
  }
  return list
})

// Pricing Management State & Methods
const pricingForm = ref(JSON.parse(JSON.stringify(pricingConfig.value)))
const pricingSavedAlert = ref(false)
const newFeatureInput = ref('')

const handleSavePricing = () => {
  const res = savePricingConfig(pricingForm.value)
  if (res.success) {
    pricingSavedAlert.value = true
    playMascotChime()
    setTimeout(() => {
      pricingSavedAlert.value = false
    }, 4000)
  }
}

const handleResetPricing = () => {
  if (confirm('Kembalikan konfigurasi harga dan fitur ke default standar?')) {
    resetPricingConfig()
    pricingForm.value = JSON.parse(JSON.stringify(pricingConfig.value))
    pricingSavedAlert.value = true
    playMascotChime()
    setTimeout(() => {
      pricingSavedAlert.value = false
    }, 3000)
  }
}

const autoCalculateYearlyPrice = () => {
  const monthly = Number(pricingForm.value.premiumTier.monthlyPrice) || 59000
  const discount = Number(pricingForm.value.premiumTier.discountPercent) || 0
  const yearly = Math.round(monthly * 12 * (1 - discount / 100))
  pricingForm.value.premiumTier.yearlyPrice = yearly
}

const addPremiumFeature = () => {
  if (newFeatureInput.value.trim()) {
    pricingForm.value.premiumTier.features.push(newFeatureInput.value.trim())
    newFeatureInput.value = ''
  }
}

const removePremiumFeature = (idx) => {
  pricingForm.value.premiumTier.features.splice(idx, 1)
}

// Nav items
const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'materi', label: 'Konten Materi', icon: BookOpen },
  { key: 'video', label: 'Manajemen Video', icon: FileVideo },
  { key: 'pricing', label: 'Paket & Harga', icon: Tag },
  { key: 'settings', label: 'Pengaturan', icon: Settings },
]
</script>

<template>
  <!-- ====== ACCESS GUARD ====== -->
  <div v-if="!isAdmin" class="fixed inset-0 z-50 flex items-center justify-center bg-[#F4F8FD] p-4">
    <div class="bg-white rounded-3xl p-10 sm:p-14 border border-slate-100 shadow-xl text-center max-w-md w-full space-y-5">
      <div class="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
        <ShieldAlert class="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h2 class="text-2xl font-extrabold text-[#0F3261]">Akses Khusus Admin</h2>
        <p class="text-sm text-slate-500 mt-2 leading-relaxed">Halaman ini diperuntukkan bagi administrator untuk mengelola konten pembelajaran.</p>
      </div>
      <div class="flex flex-col gap-3">
        <button @click="emit('openAuth')" class="w-full py-3 rounded-xl font-bold text-sm text-white cursor-pointer" style="background:linear-gradient(135deg,#0F3261,#1e5fa8);">
          Masuk sebagai Admin
        </button>
        <button @click="emit('backToApp')" class="w-full py-3 rounded-xl font-semibold text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
          Kembali ke Materi
        </button>
      </div>
    </div>
  </div>

  <!-- ====== FULL-SCREEN CMS LAYOUT ====== -->
  <template v-else>
    <div class="fixed inset-0 z-40 flex bg-[#0F1929] overflow-hidden">

      <!-- ==================== SIDEBAR ==================== -->
      <aside
        :class="[
          'flex flex-col shrink-0 transition-all duration-300 overflow-hidden',
          sidebarCollapsed ? 'w-16' : 'w-60'
        ]"
        style="background: linear-gradient(180deg, #0F1929 0%, #0d2448 100%);"
      >
        <!-- Sidebar Header / Logo -->
        <div class="flex items-center gap-3 px-4 py-5 border-b border-white/8 shrink-0">
          <img src="/Logo.png" alt="Inkluvia" class="w-8 h-8 object-contain shrink-0" />
          <div v-if="!sidebarCollapsed" class="overflow-hidden">
            <p class="text-white font-extrabold text-base tracking-tight leading-none truncate">Inkluvia</p>
            <p class="text-blue-400 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Admin CMS</p>
          </div>
          <button
            @click="sidebarCollapsed = !sidebarCollapsed"
            class="ml-auto text-white/40 hover:text-white transition cursor-pointer shrink-0"
          >
            <Menu class="w-4 h-4" />
          </button>
        </div>

        <!-- Nav Items -->
        <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <button
            v-for="item in navItems"
            :key="item.key"
            @click="activePage = item.key; showForm = false"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-left group',
              activePage === item.key
                ? 'bg-white/12 text-white shadow-inner'
                : 'text-white/50 hover:text-white hover:bg-white/6'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span v-if="!sidebarCollapsed" class="text-sm font-semibold truncate">{{ item.label }}</span>
            <!-- Active indicator bar -->
            <div v-if="activePage === item.key" class="ml-auto w-1.5 h-1.5 rounded-full bg-[#3DA5FF] shrink-0"></div>
          </button>
        </nav>

        <!-- Sidebar Footer -->
        <div class="px-2 py-4 border-t border-white/8 space-y-1 shrink-0">
          <!-- Back to App -->
          <button
            @click="emit('backToApp')"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/6 transition cursor-pointer"
          >
            <ArrowLeft class="w-5 h-5 shrink-0" />
            <span v-if="!sidebarCollapsed" class="text-sm font-semibold">Tampilan Siswa</span>
          </button>
          <!-- Logout -->
          <button
            @click="logoutUser(); emit('backToApp')"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/8 transition cursor-pointer"
          >
            <LogOut class="w-5 h-5 shrink-0" />
            <span v-if="!sidebarCollapsed" class="text-sm font-semibold">Keluar</span>
          </button>
        </div>
      </aside>

      <!-- ==================== MAIN CONTENT AREA ==================== -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

        <!-- Top Bar -->
        <header class="shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shadow-sm">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-sm">
            <span class="text-slate-400 font-medium">Admin CMS</span>
            <ChevronRight class="w-4 h-4 text-slate-300" />
            <span class="font-bold text-[#0F3261]">
              {{ navItems.find(n => n.key === (showForm ? 'materi' : activePage))?.label }}
              <span v-if="showForm" class="text-[#FF7315]">
                &nbsp;/ {{ isEditing ? 'Edit Materi' : 'Tambah Materi' }}
              </span>
            </span>
          </div>

          <!-- Right: Search + Notif + User -->
          <div class="flex items-center gap-3">
            <!-- Cloudinary badge -->
            <div :class="[
              'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
              isCloudinaryConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            ]">
              <CloudUpload class="w-3.5 h-3.5" />
              {{ isCloudinaryConfigured ? 'Cloudinary Aktif' : 'Cloudinary Belum Dikonfigurasi' }}
            </div>

            <!-- User chip -->
            <div class="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div class="text-right hidden sm:block">
                <p class="text-xs font-bold text-[#0F3261] leading-none">{{ currentUser?.name }}</p>
                <p class="text-[10px] text-[#FF7315] font-semibold mt-0.5">Administrator</p>
              </div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#3DA5FF] to-[#0F3261] flex items-center justify-center text-sm shadow">
                {{ currentUser?.avatar || '👨‍💼' }}
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content (scrollable) -->
        <main class="flex-1 overflow-y-auto bg-[#F4F8FD]">

          <!-- ============ FORM EDITOR (fullscreen overlay on right panel) ============ -->
          <div v-if="showForm" class="h-full flex flex-col">
            <!-- Form Header -->
            <div class="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <button @click="showForm = false" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition">
                  <ArrowLeft class="w-5 h-5" />
                </button>
                <div>
                  <h2 class="text-lg font-bold text-[#0F3261]">{{ isEditing ? 'Edit Materi' : 'Tambah Materi Baru' }}</h2>
                  <p class="text-xs text-slate-400">Isi semua informasi konten pembelajaran</p>
                </div>
              </div>
              <button
                @click="handleSave"
                class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer active:scale-95 transition"
                style="background:linear-gradient(135deg,#FF7315,#e86105); box-shadow:0 4px 14px rgba(255,115,21,0.30);"
              >
                <Save class="w-4 h-4" />
                Simpan Materi
              </button>
            </div>

            <!-- Form Body — Two column layout -->
            <div class="flex-1 overflow-y-auto p-6">
              <div class="max-w-5xl mx-auto">

                <!-- Tab Pills (6 Tabs: Info Dasar + 4 Modes + Asesmen) -->
                <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                  <button
                    v-for="(label, key) in {
                      general: 'Info Dasar',
                      standard: 'Standar Mode',
                      slow: 'Slow Mode',
                      high_contrast: 'High Contrast Mode',
                      focus: 'Focus Mode',
                      assessment: 'Asesmen & Kuis'
                    }"
                    :key="key"
                    @click="activeFormTab = key"
                    :class="[
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer border',
                      activeFormTab === key
                        ? key === 'general' ? 'bg-[#0F3261] text-white border-[#0F3261]'
                          : key === 'standard' ? 'bg-[#3587CE] text-white border-[#3587CE]'
                          : key === 'slow' ? 'bg-purple-600 text-white border-purple-600'
                          : key === 'high_contrast' ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-black'
                          : key === 'focus' ? 'bg-[#FF7315] text-white border-[#FF7315]'
                          : 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    ]"
                  >
                    <Layers v-if="key === 'general'" class="w-4 h-4" />
                    <Sparkles v-else-if="key === 'standard'" class="w-4 h-4" />
                    <span v-else-if="key === 'slow'">🐢</span>
                    <span v-else-if="key === 'high_contrast'">👁️</span>
                    <Sun v-else-if="key === 'focus'" class="w-4 h-4" />
                    <HelpCircle v-else class="w-4 h-4" />
                    {{ label }}
                  </button>
                </div>

                <!-- ---- TAB 1: INFO DASAR ---- -->
                <div v-if="activeFormTab === 'general'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <!-- Left column: main fields -->
                  <div class="lg:col-span-2 space-y-5">
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                      <h3 class="text-sm font-bold text-[#0F3261] flex items-center gap-2">
                        <AlignLeft class="w-4 h-4 text-[#3DA5FF]" /> Informasi Utama
                      </h3>
                      <div>
                        <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Judul Materi *</label>
                        <input
                          v-model="currentForm.title"
                          placeholder="Contoh: Petualangan Si Es Batu"
                          class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:ring-2 focus:ring-[#3DA5FF]/20 focus:outline-none text-sm text-slate-800"
                        />
                      </div>
                      <div>
                        <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Deskripsi Ringkas</label>
                        <textarea
                          v-model="currentForm.description"
                          rows="4"
                          placeholder="Gambaran singkat tentang materi ini untuk ditampilkan ke siswa..."
                          class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:outline-none text-sm text-slate-800 resize-none"
                        ></textarea>
                      </div>
                      <div class="grid grid-cols-3 gap-3">
                        <div>
                          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Jenjang</label>
                          <select v-model="currentForm.jenjang" class="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:border-[#3DA5FF] focus:outline-none">
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                          </select>
                        </div>
                        <div>
                          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Mata Pelajaran</label>
                          <select v-model="currentForm.mataPelajaran" class="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:border-[#3DA5FF] focus:outline-none">
                            <option value="IPAS">IPAS</option>
                            <option value="Matematika">Matematika</option>
                            <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                            <option value="IPA">IPA</option>
                            <option value="IPS">IPS</option>
                          </select>
                        </div>
                        <div>
                          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Level / Fase</label>
                          <input v-model="currentForm.level" placeholder="Kelas IV • Fase B" class="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:outline-none text-sm" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Estimasi Durasi</label>
                          <input v-model="currentForm.duration" placeholder="± 5 menit" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-sm" />
                        </div>
                        <div>
                          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Badge Label</label>
                          <select v-model="currentForm.badge" class="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none">
                            <option value="Gratis">Gratis</option>
                            <option value="Baru">Baru</option>
                            <option value="Premium">Premium</option>
                            <option value="Populer">Populer</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <!-- Apa yang akan kamu pelajari? (Learning Points) -->
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                      <div class="flex items-center justify-between">
                        <h3 class="text-sm font-bold text-[#0F3261] flex items-center gap-2">
                          <Sparkles class="w-4 h-4 text-[#FF7315]" /> Apa yang akan kamu pelajari? (Poin Belajar)
                        </h3>
                        <button
                          type="button"
                          @click="addLearningPoint"
                          class="text-xs font-extrabold text-[#3587CE] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          + Tambah Poin
                        </button>
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="(lp, idx) in currentForm.learningPoints"
                          :key="lp.id || idx"
                          class="flex items-center gap-2"
                        >
                          <span class="w-6 h-6 rounded-full bg-blue-100 text-[#3587CE] text-xs font-bold flex items-center justify-center shrink-0">
                            {{ idx + 1 }}
                          </span>
                          <input
                            v-model="lp.title"
                            placeholder="Judul poin (misal: Mencair, Menguap, Mengembun)..."
                            class="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-[#3DA5FF] focus:outline-none"
                          />
                          <button
                            type="button"
                            @click="removeLearningPoint(idx)"
                            class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Poin"
                          >
                            <X class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Right column: thumbnail & summary -->
                  <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                      <h3 class="text-sm font-bold text-[#0F3261] flex items-center gap-2">
                        <ImagePlus class="w-4 h-4 text-[#3DA5FF]" /> Thumbnail Gambar
                      </h3>

                      <!-- Interactive Image Upload Drop Area -->
                      <div
                        @dragover.prevent="dragOverKey = 'image'"
                        @dragleave="dragOverKey = null"
                        @drop="handleImageDrop"
                        :class="[
                          'relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed transition group text-center flex items-center justify-center',
                          dragOverKey === 'image' ? 'border-[#3DA5FF] bg-blue-50' : 'border-slate-200 bg-slate-100 hover:border-[#3DA5FF]'
                        ]"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          class="absolute inset-0 opacity-0 cursor-pointer z-10"
                          @change="handleImageFileInput"
                        />
                        <img
                          :src="currentForm.image || '/es_batu_card.jpg'"
                          alt="Thumbnail Preview"
                          class="w-full h-full object-cover"
                          @error="$event.target.src = '/es_batu_card.jpg'"
                        />
                        
                        <!-- Hover overlay with browse icon -->
                        <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-1 p-3 pointer-events-none">
                          <UploadCloud class="w-7 h-7 text-[#3DA5FF]" />
                          <span class="text-xs font-bold">Klik / Drag Gambar Baru</span>
                          <span class="text-[10px] text-slate-300">Format PNG, JPG, WEBP, GIF</span>
                        </div>

                        <!-- Loading Overlay -->
                        <div v-if="isUploadingImage" class="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white z-20 space-y-2">
                          <RefreshCw class="w-6 h-6 animate-spin text-[#3DA5FF]" />
                          <span class="text-xs font-bold">Mengunggah Gambar... {{ imageUploadProgress }}%</span>
                        </div>
                      </div>

                      <!-- Browse File Button -->
                      <div>
                        <label
                          class="w-full py-2.5 px-4 rounded-xl bg-[#F0F7FE] border border-[#3DA5FF]/30 hover:bg-blue-100 text-xs font-bold text-[#3587CE] flex items-center justify-center gap-2 transition cursor-pointer text-center"
                        >
                          <ImagePlus class="w-4 h-4" />
                          <span>Browse Gambar dari Komputer</span>
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="handleImageFileInput"
                          />
                        </label>
                      </div>

                      <div>
                        <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Atau Tempelkan URL Gambar</label>
                        <input
                          v-model="currentForm.image"
                          placeholder="/es_batu_card.jpg"
                          class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <!-- Status summary -->
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                      <h3 class="text-sm font-bold text-[#0F3261]">Status Video 4 Mode</h3>
                      <div class="space-y-2 text-xs">
                        <div class="flex items-center justify-between py-1 border-b border-slate-50">
                          <span class="text-slate-500">Video Standar</span>
                          <span :class="currentForm.standardContent?.videoUrl ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                            {{ currentForm.standardContent?.videoUrl ? '✓ Tersimpan' : 'Kosong' }}
                          </span>
                        </div>
                        <div class="flex items-center justify-between py-1 border-b border-slate-50">
                          <span class="text-slate-500">Video Slow</span>
                          <span :class="currentForm.slowContent?.videoUrl ? 'text-purple-600 font-bold' : 'text-slate-400'">
                            {{ currentForm.slowContent?.videoUrl ? '✓ Tersimpan' : 'Kosong' }}
                          </span>
                        </div>
                        <div class="flex items-center justify-between py-1 border-b border-slate-50">
                          <span class="text-slate-500">Video High Contrast</span>
                          <span :class="currentForm.highContrastContent?.videoUrl ? 'text-amber-600 font-bold' : 'text-slate-400'">
                            {{ currentForm.highContrastContent?.videoUrl ? '✓ Tersimpan' : 'Kosong' }}
                          </span>
                        </div>
                        <div class="flex items-center justify-between py-1">
                          <span class="text-slate-500">Video Focus</span>
                          <span :class="currentForm.focusContent?.videoUrl ? 'text-[#FF7315] font-bold' : 'text-slate-400'">
                            {{ currentForm.focusContent?.videoUrl ? '✓ Tersimpan' : 'Kosong' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ---- TAB 2: STANDAR MODE ---- -->
                <div v-if="activeFormTab === 'standard'" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-5">
                  <div class="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <Sparkles class="w-6 h-6 text-[#3587CE]" />
                    <div>
                      <h3 class="font-bold text-[#0F3261]">1. Standar Mode</h3>
                      <p class="text-xs text-slate-500">Visual, animasi, dan narasi audio lengkap untuk pengalaman belajar menyeluruh.</p>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Judul Narasi (Standar)</label>
                      <input v-model="currentForm.standardContent.title" placeholder="Judul narasi Standar Mode..." class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Teks Narasi / Penjelasan</label>
                      <textarea v-model="currentForm.standardContent.text" rows="3" placeholder="Teks narasi yang dibacakan / ditampilkan pada Standar Mode..." class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm resize-none"></textarea>
                    </div>

                    <!-- Upload Zone Standard -->
                    <div>
                      <label class="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">Video Standar Mode</label>
                      <div
                        @dragover.prevent="dragOverKey = 'standard'"
                        @dragleave="dragOverKey = null"
                        @drop="handleDrop($event, 'standard')"
                        :class="[
                          'relative border-2 border-dashed rounded-2xl overflow-hidden transition p-6 text-center',
                          dragOverKey === 'standard' ? 'border-[#3DA5FF] bg-blue-50' :
                          currentForm.standardContent.videoUrl ? 'border-emerald-400 bg-emerald-50/40' :
                          'border-slate-200 hover:border-[#3DA5FF] hover:bg-blue-50/20'
                        ]"
                      >
                        <input type="file" accept="video/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="handleFileInput($event, 'standard')" />
                        <div v-if="uploadTargetKey === 'standard' && isUploadingVideo" class="space-y-2">
                          <UploadCloud class="w-7 h-7 text-[#3587CE] mx-auto animate-bounce" />
                          <p class="text-xs text-[#3587CE] font-bold">Mengunggah Video Standar... {{ uploadProgress }}%</p>
                        </div>
                        <div v-else-if="currentForm.standardContent.videoUrl" class="flex items-center justify-center gap-3">
                          <CheckCircle2 class="w-6 h-6 text-emerald-600 shrink-0" />
                          <div class="text-left min-w-0">
                            <p class="text-xs font-bold text-emerald-700">✓ Video Standar Mode Tersimpan</p>
                            <p class="text-[11px] text-slate-400 font-mono truncate max-w-md">{{ currentForm.standardContent.videoUrl }}</p>
                          </div>
                        </div>
                        <div v-else class="space-y-1">
                          <UploadCloud class="w-8 h-8 text-slate-300 mx-auto" />
                          <p class="text-xs font-bold text-slate-600">Drag & drop video Standar atau klik untuk pilih file</p>
                          <p class="text-[11px] text-slate-400">Format MP4, WebM, MOV</p>
                        </div>
                      </div>
                      <input v-model="currentForm.standardContent.videoUrl" placeholder="atau tempelkan URL video langsung..." class="mt-2.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-600 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <!-- ---- TAB 3: SLOW MODE ---- -->
                <div v-if="activeFormTab === 'slow'" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-5">
                  <div class="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <span class="text-2xl">🐢</span>
                    <div>
                      <h3 class="font-bold text-purple-900">2. Slow Mode</h3>
                      <p class="text-xs text-purple-700">Video & audio diputar 0.75x lebih lambat dengan penjelasan bertahap.</p>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Judul Narasi (Slow)</label>
                      <input v-model="currentForm.slowContent.title" placeholder="Judul narasi Slow Mode..." class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Teks Narasi / Penjelasan Bertahap</label>
                      <textarea v-model="currentForm.slowContent.text" rows="3" placeholder="Teks narasi bertahap untuk Slow Mode..." class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm resize-none"></textarea>
                    </div>

                    <!-- Upload Zone Slow -->
                    <div>
                      <label class="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">Video Slow Mode</label>
                      <div
                        @dragover.prevent="dragOverKey = 'slow'"
                        @dragleave="dragOverKey = null"
                        @drop="handleDrop($event, 'slow')"
                        :class="[
                          'relative border-2 border-dashed rounded-2xl overflow-hidden transition p-6 text-center',
                          dragOverKey === 'slow' ? 'border-purple-500 bg-purple-50' :
                          currentForm.slowContent?.videoUrl ? 'border-emerald-400 bg-emerald-50/40' :
                          'border-slate-200 hover:border-purple-400 hover:bg-purple-50/20'
                        ]"
                      >
                        <input type="file" accept="video/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="handleFileInput($event, 'slow')" />
                        <div v-if="uploadTargetKey === 'slow' && isUploadingVideo" class="space-y-2">
                          <UploadCloud class="w-7 h-7 text-purple-600 mx-auto animate-bounce" />
                          <p class="text-xs text-purple-700 font-bold">Mengunggah Video Slow... {{ uploadProgress }}%</p>
                        </div>
                        <div v-else-if="currentForm.slowContent?.videoUrl" class="flex items-center justify-center gap-3">
                          <CheckCircle2 class="w-6 h-6 text-emerald-600 shrink-0" />
                          <div class="text-left min-w-0">
                            <p class="text-xs font-bold text-emerald-700">✓ Video Slow Mode Tersimpan</p>
                            <p class="text-[11px] text-slate-400 font-mono truncate max-w-md">{{ currentForm.slowContent.videoUrl }}</p>
                          </div>
                        </div>
                        <div v-else class="space-y-1">
                          <UploadCloud class="w-8 h-8 text-slate-300 mx-auto" />
                          <p class="text-xs font-bold text-slate-600">Drag & drop video Slow atau klik untuk pilih file</p>
                          <p class="text-[11px] text-slate-400">Format MP4, WebM, MOV</p>
                        </div>
                      </div>
                      <input v-model="currentForm.slowContent.videoUrl" placeholder="atau tempelkan URL video langsung..." class="mt-2.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-600 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <!-- ---- TAB 4: HIGH CONTRAST MODE ---- -->
                <div v-if="activeFormTab === 'high_contrast'" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-5">
                  <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-900 text-white">
                    <span class="text-2xl">👁️‍🗨️</span>
                    <div>
                      <h3 class="font-bold text-yellow-400">3. High Contrast Mode</h3>
                      <p class="text-xs text-slate-300">Visual kontras tinggi, teks berukuran besar, dan ramah mata.</p>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Judul Teks Kontras (Huruf Besar)</label>
                      <input v-model="currentForm.highContrastContent.title" placeholder="JUDUL TEKS KONTRAST..." class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Teks Narasi Huruf Besar</label>
                      <textarea v-model="currentForm.highContrastContent.text" rows="3" placeholder="TEKS PENJELASAN DALAM HURUF BESAR DAN JELAS..." class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold resize-none"></textarea>
                    </div>

                    <!-- Upload Zone High Contrast -->
                    <div>
                      <label class="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">Video High Contrast Mode</label>
                      <div
                        @dragover.prevent="dragOverKey = 'high_contrast'"
                        @dragleave="dragOverKey = null"
                        @drop="handleDrop($event, 'high_contrast')"
                        :class="[
                          'relative border-2 border-dashed rounded-2xl overflow-hidden transition p-6 text-center',
                          dragOverKey === 'high_contrast' ? 'border-yellow-500 bg-yellow-50' :
                          currentForm.highContrastContent?.videoUrl ? 'border-emerald-400 bg-emerald-50/40' :
                          'border-slate-200 hover:border-yellow-500 hover:bg-amber-50/20'
                        ]"
                      >
                        <input type="file" accept="video/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="handleFileInput($event, 'high_contrast')" />
                        <div v-if="uploadTargetKey === 'high_contrast' && isUploadingVideo" class="space-y-2">
                          <UploadCloud class="w-7 h-7 text-yellow-600 mx-auto animate-bounce" />
                          <p class="text-xs text-amber-700 font-bold">Mengunggah Video High Contrast... {{ uploadProgress }}%</p>
                        </div>
                        <div v-else-if="currentForm.highContrastContent?.videoUrl" class="flex items-center justify-center gap-3">
                          <CheckCircle2 class="w-6 h-6 text-emerald-600 shrink-0" />
                          <div class="text-left min-w-0">
                            <p class="text-xs font-bold text-emerald-700">✓ Video High Contrast Mode Tersimpan</p>
                            <p class="text-[11px] text-slate-400 font-mono truncate max-w-md">{{ currentForm.highContrastContent.videoUrl }}</p>
                          </div>
                        </div>
                        <div v-else class="space-y-1">
                          <UploadCloud class="w-8 h-8 text-slate-300 mx-auto" />
                          <p class="text-xs font-bold text-slate-600">Drag & drop video High Contrast atau klik untuk pilih file</p>
                          <p class="text-[11px] text-slate-400">Format MP4, WebM, MOV</p>
                        </div>
                      </div>
                      <input v-model="currentForm.highContrastContent.videoUrl" placeholder="atau tempelkan URL video langsung..." class="mt-2.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-600 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <!-- ---- TAB 5: FOCUS MODE ---- -->
                <div v-if="activeFormTab === 'focus'" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-5">
                  <div class="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <Sun class="w-6 h-6 text-[#FF7315]" />
                    <div>
                      <h3 class="font-bold text-[#0F3261]">4. Focus Mode</h3>
                      <p class="text-xs text-slate-500">Tampilan sederhana, bebas distraksi, dan elemen tenang.</p>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Judul Narasi (Focus)</label>
                      <input v-model="currentForm.focusContent.title" placeholder="Judul ringkas Focus Mode..." class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Teks Narasi Ringkas</label>
                      <textarea v-model="currentForm.focusContent.text" rows="3" placeholder="Kalimat pendek & langsung ke poin utama..." class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm resize-none"></textarea>
                    </div>

                    <!-- Upload Zone Focus -->
                    <div>
                      <label class="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">Video Focus Mode</label>
                      <div
                        @dragover.prevent="dragOverKey = 'focus'"
                        @dragleave="dragOverKey = null"
                        @drop="handleDrop($event, 'focus')"
                        :class="[
                          'relative border-2 border-dashed rounded-2xl overflow-hidden transition p-6 text-center',
                          dragOverKey === 'focus' ? 'border-[#FF7315] bg-orange-50' :
                          currentForm.focusContent?.videoUrl ? 'border-emerald-400 bg-emerald-50/40' :
                          'border-slate-200 hover:border-[#FF7315] hover:bg-orange-50/20'
                        ]"
                      >
                        <input type="file" accept="video/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="handleFileInput($event, 'focus')" />
                        <div v-if="uploadTargetKey === 'focus' && isUploadingVideo" class="space-y-2">
                          <UploadCloud class="w-7 h-7 text-[#FF7315] mx-auto animate-bounce" />
                          <p class="text-xs text-[#FF7315] font-bold">Mengunggah Video Focus... {{ uploadProgress }}%</p>
                        </div>
                        <div v-else-if="currentForm.focusContent?.videoUrl" class="flex items-center justify-center gap-3">
                          <CheckCircle2 class="w-6 h-6 text-emerald-600 shrink-0" />
                          <div class="text-left min-w-0">
                            <p class="text-xs font-bold text-emerald-700">✓ Video Focus Mode Tersimpan</p>
                            <p class="text-[11px] text-slate-400 font-mono truncate max-w-md">{{ currentForm.focusContent.videoUrl }}</p>
                          </div>
                        </div>
                        <div v-else class="space-y-1">
                          <UploadCloud class="w-8 h-8 text-slate-300 mx-auto" />
                          <p class="text-xs font-bold text-slate-600">Drag & drop video Focus atau klik untuk pilih file</p>
                          <p class="text-[11px] text-slate-400">Format MP4, WebM, MOV</p>
                        </div>
                      </div>
                      <input v-model="currentForm.focusContent.videoUrl" placeholder="atau tempelkan URL video langsung..." class="mt-2.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-600 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <!-- ---- TAB 6: ASESMEN & KUIS ---- -->
                <div v-if="activeFormTab === 'assessment'" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
                  <div class="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                        ✍️
                      </div>
                      <div>
                        <h3 class="font-bold text-indigo-950">Asesmen & Kuis Pilihan Ganda</h3>
                        <p class="text-xs text-indigo-700">Atur soal kuis per materi. Kuis ini akan terbuka di player siswa setelah menonton video.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="addQuestion"
                      class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus class="w-4 h-4" /> Tambah Soal
                    </button>
                  </div>

                  <div>
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Judul Asesmen</label>
                    <input
                      v-model="currentForm.assessment.title"
                      placeholder="Contoh: Asesmen Pemahaman Perubahan Wujud Benda"
                      class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold text-slate-800"
                    />
                  </div>

                  <!-- Questions List -->
                  <div v-if="!currentForm.assessment?.questions?.length" class="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <HelpCircle class="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p class="text-sm font-bold text-slate-600">Belum ada soal untuk materi ini</p>
                    <p class="text-xs text-slate-400 mb-4">Klik tombol di bawah untuk membuat soal pilihan ganda baru</p>
                    <button
                      type="button"
                      @click="addQuestion"
                      class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus class="w-4 h-4" /> Tambah Soal Pertama
                    </button>
                  </div>

                  <div v-else class="space-y-6">
                    <div
                      v-for="(q, qIdx) in currentForm.assessment.questions"
                      :key="q.id || qIdx"
                      class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 relative group hover:border-indigo-300 transition"
                    >
                      <div class="flex items-center justify-between border-b border-slate-200/80 pb-3">
                        <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">
                          Soal {{ qIdx + 1 }}
                        </span>
                        <button
                          type="button"
                          @click="removeQuestion(qIdx)"
                          class="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 class="w-3.5 h-3.5" /> Hapus Soal
                        </button>
                      </div>

                      <div>
                        <label class="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Pertanyaan / Soal</label>
                        <textarea
                          v-model="q.questionText"
                          rows="2"
                          placeholder="Tuliskan pertanyaan pilihan ganda di sini..."
                          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-indigo-500 focus:outline-none resize-none font-medium"
                        ></textarea>
                      </div>

                      <!-- Options A, B, C, D -->
                      <div class="space-y-2.5">
                        <label class="text-xs font-bold text-slate-600 uppercase tracking-wide block">Pilihan Jawaban (Pilih Radio Button untuk Jawaban Benar)</label>
                        <div
                          v-for="(opt, oIdx) in 4"
                          :key="oIdx"
                          :class="[
                            'flex items-center gap-3 p-2.5 rounded-xl border transition',
                            q.correctOptionIndex === oIdx ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
                          ]"
                        >
                          <label class="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                            :class="q.correctOptionIndex === oIdx ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'"
                          >
                            <input
                              type="radio"
                              :name="`correct-${qIdx}`"
                              :value="oIdx"
                              v-model="q.correctOptionIndex"
                              class="sr-only"
                            />
                            {{ String.fromCharCode(65 + oIdx) }}
                          </label>

                          <input
                            v-model="q.options[oIdx]"
                            :placeholder="`Pilihan ${String.fromCharCode(65 + oIdx)}...`"
                            class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />

                          <span v-if="q.correctOptionIndex === oIdx" class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1">
                            <CheckCircle2 class="w-3.5 h-3.5" /> Jawaban Benar
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Save bar at bottom -->
                <div class="flex items-center justify-between pt-4 mt-6 border-t border-slate-200">
                  <button @click="showForm = false" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition cursor-pointer">
                    Batal
                  </button>
                  <button
                    @click="handleSave"
                    class="flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold cursor-pointer active:scale-95 transition"
                    style="background:linear-gradient(135deg,#FF7315,#e86105); box-shadow:0 4px 14px rgba(255,115,21,0.30);"
                  >
                    <Save class="w-4 h-4" />
                    Simpan Materi
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- PAGE: DASHBOARD OVERVIEW -->
          <!-- ============================================================ -->
          <div v-else-if="activePage === 'dashboard'" class="p-6 space-y-6">
            <!-- Welcome -->
            <div>
              <h1 class="text-2xl font-extrabold text-[#0F3261]">Selamat datang kembali, {{ currentUser?.name?.split(' ')[0] }}! 👋</h1>
              <p class="text-slate-400 text-sm mt-1">Pantau dan kelola seluruh konten pembelajaran Inkluvia dari sini.</p>
            </div>

            <!-- Stats grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <BookOpen class="w-5 h-5 text-[#3587CE]" />
                  </div>
                  <ArrowUpRight class="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p class="text-3xl font-extrabold text-[#0F3261]">{{ materiList.length }}</p>
                  <p class="text-xs text-slate-400 font-medium mt-0.5">Total Materi</p>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Sparkles class="w-5 h-5 text-[#FF7315]" />
                  </div>
                  <ArrowUpRight class="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p class="text-3xl font-extrabold text-[#0F3261]">{{ totalPoinBelajar }}</p>
                  <p class="text-xs text-slate-400 font-medium mt-0.5">Poin Belajar</p>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Video class="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p class="text-3xl font-extrabold text-[#0F3261]">{{ totalVideos }}</p>
                  <p class="text-xs text-slate-400 font-medium mt-0.5">Video Terupload</p>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <div :class="['w-10 h-10 rounded-xl flex items-center justify-center', isCloudinaryConfigured ? 'bg-emerald-50' : 'bg-amber-50']">
                    <CloudUpload :class="['w-5 h-5', isCloudinaryConfigured ? 'text-emerald-600' : 'text-amber-600']" />
                  </div>
                </div>
                <div>
                  <p :class="['text-sm font-extrabold', isCloudinaryConfigured ? 'text-emerald-600' : 'text-amber-600']">
                    {{ isCloudinaryConfigured ? 'Aktif' : 'Perlu Konfigurasi' }}
                  </p>
                  <p class="text-xs text-slate-400 font-medium mt-0.5">Cloudinary Storage</p>
                </div>
              </div>
            </div>

            <!-- Quick action + recent content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <!-- Quick Actions -->
              <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <h3 class="text-sm font-bold text-[#0F3261]">Aksi Cepat</h3>
                <button
                  @click="openAddForm"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[#3DA5FF]/40 hover:border-[#3DA5FF] hover:bg-blue-50/50 text-sm font-semibold text-[#3587CE] transition cursor-pointer"
                >
                  <Plus class="w-5 h-5" /> Tambah Materi Baru
                </button>
                <button
                  @click="activePage = 'materi'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-700 transition cursor-pointer"
                >
                  <BookOpen class="w-5 h-5 text-slate-400" /> Lihat Semua Materi
                </button>
                <button
                  @click="activePage = 'video'"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-700 transition cursor-pointer"
                >
                  <FileVideo class="w-5 h-5 text-slate-400" /> Manajemen Video
                </button>
              </div>

              <!-- Recent Content -->
              <div class="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm font-bold text-[#0F3261]">Konten Terbaru</h3>
                  <button @click="activePage = 'materi'" class="text-xs text-[#3587CE] font-semibold cursor-pointer hover:underline">Lihat semua →</button>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="item in materiList.slice(0, 4)"
                    :key="item.id"
                    class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group"
                  >
                    <img :src="item.image || '/es_batu_card.jpg'" :alt="item.title" class="w-10 h-10 rounded-xl object-cover shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-[#0F3261] truncate">{{ item.title }}</p>
                      <p class="text-xs text-slate-400 truncate">{{ item.level }}</p>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button @click="emit('previewMateri', item)" class="p-1.5 rounded-lg hover:bg-blue-50 text-[#3587CE] cursor-pointer">
                        <Eye class="w-4 h-4" />
                      </button>
                      <button @click="openEditForm(item)" class="p-1.5 rounded-lg hover:bg-orange-50 text-[#FF7315] cursor-pointer">
                        <Edit3 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div v-if="materiList.length === 0" class="py-6 text-center text-slate-300 text-sm">
                    Belum ada konten. Tambah materi pertama!
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- PAGE: KONTEN MATERI (Table) -->
          <!-- ============================================================ -->
          <div v-else-if="activePage === 'materi'" class="p-6 space-y-5">
            <!-- Page header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl font-extrabold text-[#0F3261]">Konten Materi</h1>
                <p class="text-slate-400 text-sm mt-0.5">Kelola semua konten pembelajaran Inkluvia</p>
              </div>
              <button
                @click="openAddForm"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer active:scale-95 transition shrink-0"
                style="background:linear-gradient(135deg,#FF7315,#e86105); box-shadow:0 4px 14px rgba(255,115,21,0.25);"
              >
                <Plus class="w-4 h-4" /> Tambah Materi
              </button>
            </div>

            <!-- Filter + Search Bar -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <!-- Search -->
              <div class="relative flex-1 min-w-0">
                <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  v-model="tableSearch"
                  placeholder="Cari judul atau level materi..."
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:outline-none text-sm text-slate-700"
                />
              </div>
              <!-- Jenjang filter -->
              <div class="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  v-for="j in ['Semua', 'SD', 'SMP', 'SMA']"
                  :key="j"
                  @click="selectedJenjangFilter = j"
                  :class="[
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border',
                    selectedJenjangFilter === j
                      ? 'bg-[#0F3261] text-white border-[#0F3261]'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  ]"
                >{{ j }}</button>
              </div>
              <button @click="resetMateri" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer transition shrink-0">
                <RefreshCw class="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <!-- Table -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <!-- Table header -->
              <div class="grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wide">
                <div class="col-span-5">Materi</div>
                <div class="col-span-2 hidden md:block">Jenjang</div>
                <div class="col-span-2 hidden lg:block">Status Mode</div>
                <div class="col-span-1 hidden lg:block">Badge</div>
                <div class="col-span-3 lg:col-span-2 text-right">Aksi</div>
              </div>

              <!-- Loading -->
              <div v-if="isLoadingMateri" class="py-12 text-center">
                <RefreshCw class="w-6 h-6 animate-spin mx-auto mb-2 text-[#3DA5FF]" />
                <p class="text-sm text-slate-400">Memuat dari Supabase...</p>
              </div>

              <!-- Rows -->
              <div v-else class="divide-y divide-slate-50">
                <div
                  v-for="item in filteredMateri"
                  :key="item.id"
                  class="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-[#FAFCFF] transition group"
                >
                  <!-- Materi info -->
                  <div class="col-span-5 flex items-center gap-3 min-w-0">
                    <img :src="item.image || '/es_batu_card.jpg'" :alt="item.title" class="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100" />
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-[#0F3261] truncate">{{ item.title }}</p>
                      <p class="text-xs text-slate-400 truncate">{{ item.level }}</p>
                    </div>
                  </div>
                  <!-- Jenjang -->
                  <div class="col-span-2 hidden md:block">
                    <span class="px-2.5 py-1 rounded-lg bg-blue-50 text-[#3587CE] text-xs font-bold">{{ item.jenjang }}</span>
                  </div>
                  <!-- Mode Status -->
                  <div class="col-span-2 hidden lg:block">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span> 4 Mode Ready
                    </span>
                  </div>
                  <!-- Badge -->
                  <div class="col-span-1 hidden lg:block">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF7315] text-white">{{ item.badge || 'Gratis' }}</span>
                  </div>
                  <!-- Actions -->
                  <div class="col-span-3 lg:col-span-2 flex items-center gap-1.5 justify-end">
                    <button @click="emit('previewMateri', item)" class="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-[#3587CE] transition cursor-pointer" title="Preview">
                      <Eye class="w-4 h-4" />
                    </button>
                    <button @click="openEditForm(item)" class="p-2 rounded-xl hover:bg-orange-50 text-slate-400 hover:text-[#FF7315] transition cursor-pointer" title="Edit">
                      <Edit3 class="w-4 h-4" />
                    </button>
                    <button @click="handleDelete(item.id, item.title)" class="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Hapus">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Empty state -->
                <div v-if="filteredMateri.length === 0" class="py-16 text-center">
                  <BookOpen class="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p class="text-slate-400 font-medium">{{ tableSearch ? 'Tidak ada materi yang cocok dengan pencarian.' : 'Belum ada materi.' }}</p>
                  <button v-if="!tableSearch" @click="openAddForm" class="mt-3 px-5 py-2 rounded-xl text-white text-sm font-bold cursor-pointer" style="background:#FF7315;">+ Tambah Sekarang</button>
                </div>
              </div>

              <!-- Table footer -->
              <div class="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
                Menampilkan {{ filteredMateri.length }} dari {{ materiList.length }} materi
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- PAGE: MANAJEMEN VIDEO -->
          <!-- ============================================================ -->
          <div v-else-if="activePage === 'video'" class="p-6 space-y-5">
            <div>
              <h1 class="text-2xl font-extrabold text-[#0F3261]">Manajemen Video</h1>
              <p class="text-slate-400 text-sm mt-0.5">Ringkasan video 4 mode yang tersimpan per materi</p>
            </div>

            <!-- Cloudinary status card -->
            <div :class="[
              'rounded-2xl p-5 border flex items-start gap-4',
              isCloudinaryConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            ]">
              <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', isCloudinaryConfigured ? 'bg-emerald-100' : 'bg-amber-100']">
                <CloudUpload :class="['w-6 h-6', isCloudinaryConfigured ? 'text-emerald-600' : 'text-amber-600']" />
              </div>
              <div>
                <p :class="['font-bold text-sm', isCloudinaryConfigured ? 'text-emerald-800' : 'text-amber-800']">
                  {{ isCloudinaryConfigured ? '✅ Cloudinary Terhubung' : '⚠️ Cloudinary Belum Dikonfigurasi' }}
                </p>
                <p :class="['text-xs mt-1', isCloudinaryConfigured ? 'text-emerald-600' : 'text-amber-600']">
                  {{ isCloudinaryConfigured
                    ? 'Video diunggah langsung ke Cloudinary CDN. Buka form edit materi untuk mengelola video per mode.'
                    : 'Isi VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET di file .env.local, lalu restart server.'
                  }}
                </p>
              </div>
            </div>

            <!-- Video list per materi -->
            <div class="space-y-4">
              <div
                v-for="item in materiList"
                :key="item.id"
                class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/70">
                  <img :src="item.image || '/es_batu_card.jpg'" :alt="item.title" class="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div class="flex-1">
                    <p class="font-bold text-[#0F3261] text-sm">{{ item.title }}</p>
                    <p class="text-xs text-slate-400">4 Mode Belajar Terkonfigurasi</p>
                  </div>
                  <button @click="openEditForm(item)" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer" style="background:#0F3261;">
                    <Edit3 class="w-3.5 h-3.5" /> Kelola Video Mode
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4">
                  <!-- Standar -->
                  <div class="p-3 rounded-xl border border-blue-100 bg-blue-50/40 text-xs space-y-1">
                    <p class="font-bold text-[#3587CE]">1. Standar Mode</p>
                    <p :class="item.standardContent?.videoUrl ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      {{ item.standardContent?.videoUrl ? '✓ Video Ready' : 'Belum Ada Video' }}
                    </p>
                  </div>
                  <!-- Slow -->
                  <div class="p-3 rounded-xl border border-purple-100 bg-purple-50/40 text-xs space-y-1">
                    <p class="font-bold text-purple-700">2. Slow Mode</p>
                    <p :class="item.slowContent?.videoUrl ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      {{ item.slowContent?.videoUrl ? '✓ Video Ready' : 'Belum Ada Video' }}
                    </p>
                  </div>
                  <!-- High Contrast -->
                  <div class="p-3 rounded-xl border border-amber-100 bg-amber-50/40 text-xs space-y-1">
                    <p class="font-bold text-amber-800">3. High Contrast</p>
                    <p :class="item.highContrastContent?.videoUrl ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      {{ item.highContrastContent?.videoUrl ? '✓ Video Ready' : 'Belum Ada Video' }}
                    </p>
                  </div>
                  <!-- Focus -->
                  <div class="p-3 rounded-xl border border-orange-100 bg-orange-50/40 text-xs space-y-1">
                    <p class="font-bold text-[#FF7315]">4. Focus Mode</p>
                    <p :class="item.focusContent?.videoUrl ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      {{ item.focusContent?.videoUrl ? '✓ Video Ready' : 'Belum Ada Video' }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-if="materiList.length === 0" class="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <FileVideo class="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p class="text-slate-400 text-sm">Belum ada materi. Tambah materi untuk mengelola video.</p>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- PAGE: PRICING MANAGEMENT (MANAJEMEN PAKET & HARGA) -->
          <!-- ============================================================ -->
          <div v-else-if="activePage === 'pricing'" class="p-6 space-y-6">
            <!-- Header & Action Row -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl font-black text-[#0F3261] flex items-center gap-2.5">
                  <Tag class="w-6 h-6 text-[#FF7315]" />
                  <span>Manajemen Paket & Harga Langganan</span>
                </h1>
                <p class="text-slate-500 text-sm mt-0.5">
                  Kelola tarif Inkluvia Premium, persentase diskon tahunan, promo badge, dan sinkronisasi pembayaran Xendit.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="handleResetPricing"
                  class="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  @click="handleSavePricing"
                  class="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF7315] to-[#E86105] hover:from-[#ff812d] hover:to-[#f06809] text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-102"
                >
                  <Save class="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>

            <!-- Success Alert Banner -->
            <transition name="fade">
              <div
                v-if="pricingSavedAlert"
                class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs"
              >
                <div class="flex items-center gap-2.5">
                  <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Perubahan harga berhasil disimpan dan langsung tersinkronkan ke Tab Harga serta invoice Xendit Sandbox!</span>
                </div>
                <button @click="pricingSavedAlert = false" class="text-emerald-600 hover:text-emerald-800 font-black cursor-pointer">✕</button>
              </div>
            </transition>

            <!-- Xendit Live Sync Notification Banner -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white text-[#0F3261] border border-blue-100 flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
                  💳
                </div>
                <div>
                  <h4 class="text-xs font-black text-[#0F3261] uppercase tracking-wide flex items-center gap-1.5">
                    <span>Sinkronisasi Otomatis Gateway Xendit</span>
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </h4>
                  <p class="text-xs text-slate-600 mt-0.5">
                    Nominal harga yang Anda tentukan di bawah akan langsung diterbitkan sebagai tagihan resmi saat user melakukan checkout.
                  </p>
                </div>
              </div>
              <span class="text-[11px] font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs hidden sm:inline-block">
                Mode Sandbox Aktif
              </span>
            </div>

            <!-- Two-Column Grid: Form Editor (Left) & Live Student Preview (Right) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              <!-- LEFT COLUMN: PRICING FORM (7 Cols) -->
              <div class="lg:col-span-7 space-y-6">
                
                <!-- Card 1: Pengaturan Harga & Diskon -->
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
                  <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 class="font-black text-[#0F3261] text-base">Tarif Langganan Inkluvia Premium</h3>
                      <p class="text-xs text-slate-400">Atur nominal harga bulanan dan diskon tahunan</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-black bg-orange-50 text-[#FF7315] border border-orange-200">
                      IDR (Rupiah)
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Monthly Price Input -->
                    <div class="space-y-1.5">
                      <label class="text-xs font-black text-[#0F3261] uppercase tracking-wider">
                        Harga Bulanan (Rp):
                      </label>
                      <div class="relative">
                        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          v-model.number="pricingForm.premiumTier.monthlyPrice"
                          @input="autoCalculateYearlyPrice"
                          type="number"
                          step="1000"
                          min="1000"
                          class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#FF7315] focus:bg-white rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition"
                        />
                      </div>
                      <p class="text-[11px] text-slate-400 font-mono">
                        {{ formatRupiah(pricingForm.premiumTier.monthlyPrice) }} / bulan
                      </p>
                    </div>

                    <!-- Discount Percentage Input -->
                    <div class="space-y-1.5">
                      <label class="text-xs font-black text-[#0F3261] uppercase tracking-wider">
                        Diskon Tahunan (%):
                      </label>
                      <div class="relative">
                        <input
                          v-model.number="pricingForm.premiumTier.discountPercent"
                          @input="autoCalculateYearlyPrice"
                          type="number"
                          min="0"
                          max="100"
                          class="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#FF7315] focus:bg-white rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition"
                        />
                        <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>
                      <p class="text-[11px] text-slate-400">
                        Diskon otomatis untuk pembayaran tahunan
                      </p>
                    </div>
                  </div>

                  <!-- Yearly Price Input -->
                  <div class="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-black text-amber-900 uppercase tracking-wider">
                        Total Ditagih Tahunan (Rp / Tahun):
                      </label>
                      <button
                        @click="autoCalculateYearlyPrice"
                        class="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                      >
                        ⚡ Hitung dari Diskon
                      </button>
                    </div>

                    <div class="relative">
                      <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        v-model.number="pricingForm.premiumTier.yearlyPrice"
                        type="number"
                        step="1000"
                        min="1000"
                        class="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-300 focus:border-[#FF7315] rounded-xl text-sm font-black text-slate-800 focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    <div class="flex items-center justify-between text-[11px] text-amber-800">
                      <span>Setara per bulan: <strong>{{ formatRupiah(Math.round(pricingForm.premiumTier.yearlyPrice / 12)) }}</strong> /bln</span>
                      <span>Hemat: <strong>{{ formatRupiah((pricingForm.premiumTier.monthlyPrice * 12) - pricingForm.premiumTier.yearlyPrice) }}</strong></span>
                    </div>
                  </div>

                  <!-- Promo Badges -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div class="space-y-1.5">
                      <label class="text-xs font-black text-[#0F3261] uppercase tracking-wider">
                        Teks Badge Diskon:
                      </label>
                      <input
                        v-model="pricingForm.premiumTier.discountBadge"
                        type="text"
                        placeholder="Contoh: HEMAT 20% 🏷️"
                        class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#FF7315] focus:bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-none transition"
                      />
                    </div>

                    <div class="space-y-1.5">
                      <label class="text-xs font-black text-[#0F3261] uppercase tracking-wider">
                        Teks Tag Populer:
                      </label>
                      <input
                        v-model="pricingForm.premiumTier.popularBadge"
                        type="text"
                        placeholder="Contoh: Paling Populer"
                        class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#FF7315] focus:bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <!-- Card 2: Kelola Fitur-Fitur Paket Premium -->
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
                  <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 class="font-black text-[#0F3261] text-base">Daftar Fitur Paket Premium</h3>
                      <p class="text-xs text-slate-400">Poin keunggulan yang ditampilkan pada checklist kartu langganan</p>
                    </div>
                    <span class="text-xs font-mono font-bold text-slate-500">
                      {{ pricingForm.premiumTier.features.length }} Fitur
                    </span>
                  </div>

                  <!-- Features List -->
                  <div class="space-y-2">
                    <div
                      v-for="(feat, idx) in pricingForm.premiumTier.features"
                      :key="idx"
                      class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-xs text-slate-700 font-semibold group transition"
                    >
                      <div class="flex items-center gap-2 flex-1">
                        <CheckCircle2 class="w-4 h-4 text-[#FF7315] shrink-0" />
                        <input
                          v-model="pricingForm.premiumTier.features[idx]"
                          type="text"
                          class="w-full bg-transparent focus:bg-white px-2 py-1 rounded border border-transparent focus:border-slate-300 focus:outline-none text-xs text-slate-800 font-semibold"
                        />
                      </div>
                      <button
                        @click="removePremiumFeature(idx)"
                        title="Hapus fitur"
                        class="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Add Feature Input -->
                  <div class="flex items-center gap-2 pt-2">
                    <input
                      v-model="newFeatureInput"
                      @keydown.enter.prevent="addPremiumFeature"
                      type="text"
                      placeholder="Ketik fitur baru lalu tekan Tambah..."
                      class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#FF7315] focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition"
                    />
                    <button
                      @click="addPremiumFeature"
                      class="px-4 py-2.5 rounded-xl bg-[#0F3261] hover:bg-[#154687] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>

                <!-- Bottom Save Actions -->
                <div class="flex items-center justify-end gap-3 pt-2">
                  <button
                    @click="handleResetPricing"
                    class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    Batal / Reset
                  </button>

                  <button
                    @click="handleSavePricing"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7315] to-[#E86105] hover:from-[#ff812d] hover:to-[#f06809] text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md hover:scale-102"
                  >
                    <Save class="w-4 h-4" />
                    <span>Simpan Perubahan Harga</span>
                  </button>
                </div>
              </div>

              <!-- RIGHT COLUMN: LIVE PREVIEW CARD (5 Cols) -->
              <div class="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-black text-[#0F3261] uppercase tracking-wider flex items-center gap-1.5">
                    <Eye class="w-4 h-4 text-[#3587CE]" />
                    <span>Live Preview Siswa</span>
                  </span>
                  <span class="text-slate-400 text-[11px]">Tampilan realtime tab Harga</span>
                </div>

                <!-- Replicated Preview Card -->
                <div class="bg-gradient-to-b from-[#FFFDF9] to-amber-50/40 rounded-3xl p-6 sm:p-7 border-4 border-[#FF7315]/80 shadow-xl space-y-6 relative overflow-hidden">
                  <!-- Tag Populer -->
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-[#FF7315] text-white shadow-xs uppercase">
                    <Sparkles class="w-3 h-3 text-[#FFDC58]" />
                    <span>{{ pricingForm.premiumTier.popularBadge || 'Paling Populer' }}</span>
                  </div>

                  <div class="space-y-2">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-[#FF7315]">
                      {{ pricingForm.premiumTier.subtitle }}
                    </span>
                    <h3 class="text-xl font-black text-[#0F3261]">{{ pricingForm.premiumTier.name }}</h3>
                    
                    <div class="flex items-baseline gap-1 pt-1">
                      <span class="text-3xl font-black text-[#FF7315]">
                        {{ formatRupiah(pricingForm.premiumTier.monthlyPrice) }}
                      </span>
                      <span class="text-xs font-bold text-slate-500">/bulan</span>
                    </div>

                    <div class="pt-1">
                      <span class="inline-block text-[11px] font-extrabold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-md">
                        {{ pricingForm.premiumTier.discountBadge || 'HEMAT' }} • Tahunan: {{ formatRupiah(pricingForm.premiumTier.yearlyPrice) }}
                      </span>
                    </div>
                  </div>

                  <!-- Checklist Preview -->
                  <div class="space-y-2.5 pt-2 border-t border-slate-100">
                    <div
                      v-for="(feat, fIdx) in pricingForm.premiumTier.features.slice(0, 6)"
                      :key="fIdx"
                      class="flex items-start gap-2.5 text-xs text-slate-700 font-bold"
                    >
                      <CheckCircle2 class="w-4 h-4 text-[#FF7315] shrink-0 mt-0.5" />
                      <span class="truncate">{{ feat }}</span>
                    </div>
                    <div v-if="pricingForm.premiumTier.features.length > 6" class="text-[11px] text-slate-400 font-semibold pl-6">
                      + {{ pricingForm.premiumTier.features.length - 6 }} fitur lainnya
                    </div>
                  </div>

                  <!-- Preview Button -->
                  <div class="pt-2">
                    <button
                      disabled
                      class="btn-tactile-orange w-full py-3 rounded-full font-black text-xs flex items-center justify-center gap-1.5 cursor-default opacity-90 shadow-md"
                    >
                      <span>Beli via Xendit Sandbox ➔</span>
                    </button>
                  </div>
                </div>

                <!-- Simulation Guide Box -->
                <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs text-slate-600">
                  <h4 class="font-black text-[#0F3261] flex items-center gap-1.5">
                    <span>💡 Tips Administrator:</span>
                  </h4>
                  <p class="leading-relaxed">
                    Jika harga bulanan diubah (misalnya menjadi <strong>Rp39.000</strong>), klik tombol <strong>"Simpan Perubahan"</strong>. 
                    Tab Harga siswa dan jumlah invoice Xendit akan langsung terbarui secara instan.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <!-- ============================================================ -->
          <!-- PAGE: SETTINGS -->
          <!-- ============================================================ -->
          <div v-else-if="activePage === 'settings'" class="p-6 space-y-5">
            <div>
              <h1 class="text-2xl font-extrabold text-[#0F3261]">Pengaturan</h1>
              <p class="text-slate-400 text-sm mt-0.5">Konfigurasi sistem Inkluvia CMS</p>
            </div>
            <div class="max-w-2xl space-y-4">
              <!-- Supabase -->
              <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-100">
                  <h3 class="font-bold text-[#0F3261] text-sm">Supabase Database</h3>
                  <p class="text-xs text-slate-400 mt-0.5">Konfigurasi koneksi database di .env.local</p>
                </div>
                <div class="p-5 space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-600 font-medium">VITE_SUPABASE_URL</span>
                    <span class="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Terkonfigurasi ✓</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-600 font-medium">VITE_SUPABASE_ANON_KEY</span>
                    <span class="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Terkonfigurasi ✓</span>
                  </div>
                </div>
              </div>

              <!-- Cloudinary -->
              <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-100">
                  <h3 class="font-bold text-[#0F3261] text-sm">Cloudinary Video CDN</h3>
                  <p class="text-xs text-slate-400 mt-0.5">Konfigurasi penyimpanan video di .env.local</p>
                </div>
                <div class="p-5 space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-600 font-medium">VITE_CLOUDINARY_CLOUD_NAME</span>
                    <span :class="['text-xs font-mono px-2 py-1 rounded-lg', isCloudinaryConfigured ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50']">
                      {{ isCloudinaryConfigured ? 'Terkonfigurasi ✓' : 'Belum diisi' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-600 font-medium">VITE_CLOUDINARY_UPLOAD_PRESET</span>
                    <span :class="['text-xs font-mono px-2 py-1 rounded-lg', isCloudinaryConfigured ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50']">
                      {{ isCloudinaryConfigured ? 'Terkonfigurasi ✓' : 'Belum diisi' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Data reset -->
              <div class="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-rose-100">
                  <h3 class="font-bold text-rose-600 text-sm">Danger Zone</h3>
                </div>
                <div class="p-5 flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold text-slate-700">Reset Data ke Default</p>
                    <p class="text-xs text-slate-400 mt-0.5">Kembalikan semua konten ke data contoh awal. Tidak bisa diurungkan.</p>
                  </div>
                  <button @click="resetMateri" class="px-4 py-2 rounded-xl border-2 border-rose-200 text-rose-600 text-sm font-bold hover:bg-rose-50 transition cursor-pointer shrink-0">
                    Reset Default
                  </button>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  </template>
</template>
