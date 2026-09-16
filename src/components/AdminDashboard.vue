<script setup>
import { ref, computed } from 'vue'
import {
  materiList, addMateri, updateMateri, deleteMateri, resetMateri, isLoadingMateri
} from '../lib/materiService'
import { currentUser, isAdmin, logoutUser } from '../lib/authService'
import { uploadVideo, isCloudinaryConfigured } from '../lib/cloudinary'
import {
  LayoutDashboard, BookOpen, Video, Settings, LogOut, Plus, Trash2, Edit3, Eye,
  X, Sun, CheckCircle2, UploadCloud, ShieldAlert, Search, Bell, ChevronRight,
  FileVideo, CloudUpload, RefreshCw, Sparkles, TrendingUp, Users, Clock,
  ArrowUpRight, MoreVertical, Filter, Download, AlertCircle, Menu, ChevronDown,
  ArrowLeft, Save, ImagePlus, ListVideo, Tag, AlignLeft, Layers
} from '@lucide/vue'

const emit = defineEmits(['previewMateri', 'backToApp', 'openAuth'])

// Sidebar nav state
const activePage = ref('dashboard') // 'dashboard' | 'materi' | 'upload' | 'settings'
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

// Form data
const currentForm = ref(getEmptyForm())

function getEmptyForm() {
  return {
    id: '',
    title: '',
    jenjang: 'SD',
    mataPelajaran: 'IPAS',
    level: 'IPAS • Kelas IV • Fase B',
    description: '',
    badge: 'Gratis',
    duration: '± 5 menit',
    activityType: 'Video + Aktivitas',
    learningOptions: 'Standard & Focus Mode',
    image: '/es_batu_card.jpg',
    types: ['Video', 'Interaktif'],
    standardConfig: {
      title: 'Standard Mode',
      features: ['Visual, animasi, dan narasi', 'untuk pengalaman belajar yang lebih lengkap.']
    },
    focusConfig: {
      title: 'Focus Mode',
      features: ['Tampilan lebih sederhana', 'Gerakan lebih lambat', 'Distraksi lebih sedikit', 'Kontras lebih jelas']
    },
    steps: [{
      id: 'step-1', number: 1, title: 'Pengenalan Materi',
      standardContent: { title: 'Pengenalan Materi', text: '', videoUrl: '' },
      focusContent: { title: 'Poin Kunci', text: '', videoUrl: '' }
    }]
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
  currentForm.value = JSON.parse(JSON.stringify(item))
  activeFormTab.value = 'general'
  showForm.value = true
}

const handleSave = async () => {
  if (!currentForm.value.title.trim()) {
    alert('Judul materi wajib diisi')
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

const addStep = () => {
  const n = currentForm.value.steps.length + 1
  currentForm.value.steps.push({
    id: `step-${Date.now()}`, number: n, title: `Langkah ${n}`,
    standardContent: { title: `Langkah ${n} (Standard)`, text: '', videoUrl: '' },
    focusContent: { title: `Langkah ${n} (Fokus)`, text: '', videoUrl: '' }
  })
}

const removeStep = (idx) => {
  if (currentForm.value.steps.length > 1) currentForm.value.steps.splice(idx, 1)
}

// Video upload
const doUpload = async (file, stepIdx, mode) => {
  const key = `step-${stepIdx}-${mode}`
  uploadTargetKey.value = key
  uploadProgress.value = 0
  if (!isCloudinaryConfigured) {
    const samples = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    ]
    const url = samples[stepIdx % samples.length]
    if (mode === 'standard') currentForm.value.steps[stepIdx].standardContent.videoUrl = url
    else currentForm.value.steps[stepIdx].focusContent.videoUrl = url
    uploadTargetKey.value = null
    return
  }
  isUploadingVideo.value = true
  try {
    const res = await uploadVideo(file, (pct) => { uploadProgress.value = pct })
    if (mode === 'standard') currentForm.value.steps[stepIdx].standardContent.videoUrl = res.secure_url
    else currentForm.value.steps[stepIdx].focusContent.videoUrl = res.secure_url
  } catch (err) { alert(`Upload gagal: ${err.message}`) }
  finally {
    isUploadingVideo.value = false
    uploadTargetKey.value = null
    uploadProgress.value = 0
  }
}
const handleDrop = async (e, idx, mode) => {
  e.preventDefault(); dragOverKey.value = null
  const file = e.dataTransfer?.files?.[0]
  if (file?.type.startsWith('video/')) await doUpload(file, idx, mode)
}
const handleFileInput = async (e, idx, mode) => {
  const file = e.target.files?.[0]
  if (file) await doUpload(file, idx, mode)
}

// Computed stats
const totalSteps = computed(() => materiList.value.reduce((a, m) => a + (m.steps?.length || 0), 0))
const totalVideos = computed(() => materiList.value.reduce((a, m) =>
  a + (m.steps?.filter(s => s.standardContent?.videoUrl || s.focusContent?.videoUrl).length || 0), 0
))

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

// Nav items
const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'materi', label: 'Konten Materi', icon: BookOpen },
  { key: 'video', label: 'Manajemen Video', icon: FileVideo },
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

                <!-- Tab Pills -->
                <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                  <button
                    v-for="(label, key) in {
                      general: 'Info Dasar',
                      standard: 'Standard Mode',
                      focus: 'Focus Mode',
                      steps: `Babak Video (${currentForm.steps.length})`
                    }"
                    :key="key"
                    @click="activeFormTab = key"
                    :class="[
                      'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition cursor-pointer border',
                      activeFormTab === key
                        ? key === 'general' ? 'bg-[#0F3261] text-white border-[#0F3261]'
                          : key === 'standard' ? 'bg-[#3587CE] text-white border-[#3587CE]'
                          : key === 'focus' ? 'bg-[#FF7315] text-white border-[#FF7315]'
                          : 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    ]"
                  >
                    <Layers v-if="key === 'general'" class="w-4 h-4" />
                    <Sparkles v-else-if="key === 'standard'" class="w-4 h-4" />
                    <Sun v-else-if="key === 'focus'" class="w-4 h-4" />
                    <ListVideo v-else class="w-4 h-4" />
                    {{ label }}
                  </button>
                </div>

                <!-- ---- TAB: INFO DASAR ---- -->
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
                        <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Deskripsi</label>
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

                    <!-- Jenis Media -->
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                      <h3 class="text-sm font-bold text-[#0F3261] flex items-center gap-2">
                        <Tag class="w-4 h-4 text-[#3DA5FF]" /> Jenis Media
                      </h3>
                      <div class="flex flex-wrap gap-2">
                        <button
                          v-for="t in ['Video', 'Interaktif', 'Worksheet', 'Evaluasi', 'Audio']"
                          :key="t"
                          type="button"
                          @click="currentForm.types.includes(t) ? (currentForm.types.length > 1 && (currentForm.types = currentForm.types.filter(x => x !== t))) : currentForm.types.push(t)"
                          :class="[
                            'px-4 py-2 rounded-xl text-sm font-semibold border-2 transition cursor-pointer flex items-center gap-1.5',
                            currentForm.types.includes(t)
                              ? 'bg-[#0F3261] border-[#0F3261] text-white'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          ]"
                        >
                          <CheckCircle2 v-if="currentForm.types.includes(t)" class="w-3.5 h-3.5" />
                          {{ t }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Right column: thumbnail -->
                  <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                      <h3 class="text-sm font-bold text-[#0F3261] flex items-center gap-2">
                        <ImagePlus class="w-4 h-4 text-[#3DA5FF]" /> Thumbnail
                      </h3>
                      <!-- Preview -->
                      <div class="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          :src="currentForm.image || '/es_batu_card.jpg'"
                          alt="Thumbnail Preview"
                          class="w-full h-full object-cover"
                          @error="$event.target.src = '/es_batu_card.jpg'"
                        />
                      </div>
                      <div>
                        <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">URL Gambar</label>
                        <input
                          v-model="currentForm.image"
                          placeholder="/es_batu_card.jpg"
                          class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <!-- Status summary -->
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                      <h3 class="text-sm font-bold text-[#0F3261]">Status Konten</h3>
                      <div class="space-y-2 text-xs">
                        <div class="flex items-center justify-between py-1.5 border-b border-slate-50">
                          <span class="text-slate-500">Judul</span>
                          <span :class="currentForm.title ? 'text-emerald-600 font-semibold' : 'text-rose-500'">
                            {{ currentForm.title ? '✓ Terisi' : '✗ Wajib' }}
                          </span>
                        </div>
                        <div class="flex items-center justify-between py-1.5 border-b border-slate-50">
                          <span class="text-slate-500">Babak Video</span>
                          <span class="text-[#0F3261] font-bold">{{ currentForm.steps.length }} babak</span>
                        </div>
                        <div class="flex items-center justify-between py-1.5 border-b border-slate-50">
                          <span class="text-slate-500">Video Standard</span>
                          <span class="text-[#3587CE] font-bold">
                            {{ currentForm.steps.filter(s => s.standardContent?.videoUrl).length }}/{{ currentForm.steps.length }}
                          </span>
                        </div>
                        <div class="flex items-center justify-between py-1.5">
                          <span class="text-slate-500">Video Focus</span>
                          <span class="text-[#FF7315] font-bold">
                            {{ currentForm.steps.filter(s => s.focusContent?.videoUrl).length }}/{{ currentForm.steps.length }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ---- TAB: STANDARD MODE ---- -->
                <div v-if="activeFormTab === 'standard'" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style="background:linear-gradient(135deg,#EAF3FD,#f4f9fe);">
                    <Sparkles class="w-5 h-5 text-[#3587CE]" />
                    <div>
                      <h3 class="font-bold text-[#0F3261]">Konfigurasi Standard Mode</h3>
                      <p class="text-xs text-slate-500">Mode penuh: animasi, narasi lengkap, kecepatan 1.0x</p>
                    </div>
                  </div>
                  <div class="p-6 space-y-4">
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Judul Mode</label>
                      <input v-model="currentForm.standardConfig.title" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3DA5FF] focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-3">Keunggulan yang Ditampilkan ke Siswa</label>
                      <div class="space-y-2">
                        <div v-for="(feat, idx) in currentForm.standardConfig.features" :key="idx" class="flex items-center gap-3">
                          <div class="w-6 h-6 rounded-full bg-[#3DA5FF] flex items-center justify-center shrink-0">
                            <CheckCircle2 class="w-3.5 h-3.5 text-white" />
                          </div>
                          <input v-model="currentForm.standardConfig.features[idx]" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none" />
                        </div>
                      </div>
                      <button @click="currentForm.standardConfig.features.push('')" class="mt-3 text-xs text-[#3587CE] font-semibold cursor-pointer hover:underline">
                        + Tambah poin
                      </button>
                    </div>
                  </div>
                </div>

                <!-- ---- TAB: FOCUS MODE ---- -->
                <div v-if="activeFormTab === 'focus'" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style="background:linear-gradient(135deg,#FFF5EC,#fffaf5);">
                    <Sun class="w-5 h-5 text-[#FF7315]" />
                    <div>
                      <h3 class="font-bold text-[#0F3261]">Konfigurasi Focus Mode</h3>
                      <p class="text-xs text-slate-500">Ramah ADHD/sensorik: kecepatan 0.75x, kontras tinggi</p>
                    </div>
                  </div>
                  <div class="p-6 space-y-4">
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Judul Mode</label>
                      <input v-model="currentForm.focusConfig.title" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF7315] focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-3">Keunggulan yang Ditampilkan ke Siswa</label>
                      <div class="space-y-2">
                        <div v-for="(feat, idx) in currentForm.focusConfig.features" :key="idx" class="flex items-center gap-3">
                          <div class="w-6 h-6 rounded-full bg-[#FF7315] flex items-center justify-center shrink-0">
                            <CheckCircle2 class="w-3.5 h-3.5 text-white" />
                          </div>
                          <input v-model="currentForm.focusConfig.features[idx]" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none" />
                        </div>
                      </div>
                      <button @click="currentForm.focusConfig.features.push('')" class="mt-3 text-xs text-[#FF7315] font-semibold cursor-pointer hover:underline">
                        + Tambah poin
                      </button>
                    </div>
                  </div>
                </div>

                <!-- ---- TAB: BABAK VIDEO ---- -->
                <div v-if="activeFormTab === 'steps'" class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-bold text-[#0F3261]">Babak Video ({{ currentForm.steps.length }})</h3>
                      <p class="text-xs text-slate-400 mt-0.5">Setiap babak memiliki video Standard & Focus terpisah.</p>
                    </div>
                    <button
                      @click="addStep"
                      class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer active:scale-95 transition"
                      style="background:#16a34a;"
                    >
                      <Plus class="w-4 h-4" /> Tambah Babak
                    </button>
                  </div>

                  <div
                    v-for="(st, idx) in currentForm.steps"
                    :key="st.id || idx"
                    class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                  >
                    <!-- Step header bar -->
                    <div class="flex items-center gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50">
                      <span class="w-8 h-8 rounded-xl bg-[#0F3261] text-white text-sm font-extrabold flex items-center justify-center shrink-0">
                        {{ idx + 1 }}
                      </span>
                      <input
                        v-model="st.title"
                        placeholder="Nama babak..."
                        class="flex-1 bg-transparent font-bold text-[#0F3261] text-base border-none outline-none placeholder:text-slate-300 placeholder:font-normal"
                      />
                      <button
                        @click="removeStep(idx)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                      >
                        <X class="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>

                    <!-- Side-by-side: Standard | Focus -->
                    <div class="grid grid-cols-1 md:grid-cols-2">
                      <!-- Standard Side -->
                      <div class="p-5 space-y-3 border-r border-slate-100 md:border-b-0 border-b">
                        <div class="flex items-center gap-2 mb-1">
                          <div class="w-3 h-3 rounded-full bg-[#3587CE]"></div>
                          <span class="text-sm font-bold text-[#3587CE]">Standard Mode</span>
                          <span class="ml-auto text-[10px] font-mono bg-blue-50 text-[#3587CE] px-2 py-0.5 rounded-full">1.0x</span>
                        </div>
                        <input v-model="st.standardContent.title" placeholder="Judul narasi..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none" />
                        <textarea v-model="st.standardContent.text" rows="3" placeholder="Teks narasi / penjelasan animasi..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none resize-none"></textarea>

                        <!-- Upload Zone Standard -->
                        <div>
                          <label class="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Video Standard</label>
                          <div
                            @dragover.prevent="dragOverKey = `step-${idx}-standard`"
                            @dragleave="dragOverKey = null"
                            @drop="handleDrop($event, idx, 'standard')"
                            :class="[
                              'relative border-2 border-dashed rounded-xl overflow-hidden transition',
                              dragOverKey === `step-${idx}-standard` ? 'border-[#3DA5FF] bg-blue-50' :
                              st.standardContent.videoUrl ? 'border-emerald-300 bg-emerald-50/40' :
                              'border-slate-200 hover:border-[#3DA5FF] hover:bg-blue-50/20'
                            ]"
                          >
                            <input type="file" accept="video/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="handleFileInput($event, idx, 'standard')" />
                            <!-- Uploading state -->
                            <div v-if="uploadTargetKey === `step-${idx}-standard` && isUploadingVideo" class="p-5 text-center space-y-2">
                              <UploadCloud class="w-6 h-6 text-[#3587CE] mx-auto animate-bounce" />
                              <div class="w-full bg-blue-100 rounded-full h-2">
                                <div class="bg-[#3587CE] h-2 rounded-full transition-all duration-300" :style="`width:${uploadProgress}%`"></div>
                              </div>
                              <p class="text-xs text-[#3587CE] font-bold">Mengunggah ke Cloudinary... {{ uploadProgress }}%</p>
                            </div>
                            <!-- Has video -->
                            <div v-else-if="st.standardContent.videoUrl" class="p-4 flex items-center gap-3">
                              <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 class="w-5 h-5 text-emerald-600" />
                              </div>
                              <div class="min-w-0">
                                <p class="text-xs font-bold text-emerald-700">Video tersimpan</p>
                                <p class="text-[10px] text-slate-400 truncate">{{ st.standardContent.videoUrl }}</p>
                              </div>
                            </div>
                            <!-- Empty state -->
                            <div v-else class="p-5 text-center">
                              <UploadCloud class="w-7 h-7 text-slate-300 mx-auto mb-2" />
                              <p class="text-xs font-semibold text-slate-400">Drag & drop video atau klik untuk pilih</p>
                              <p class="text-[10px] text-slate-300 mt-0.5">MP4, MOV, WebM</p>
                            </div>
                          </div>
                          <input v-model="st.standardContent.videoUrl" placeholder="atau paste URL video..." class="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[11px] font-mono text-slate-500 focus:outline-none" />
                        </div>
                      </div>

                      <!-- Focus Side -->
                      <div class="p-5 space-y-3">
                        <div class="flex items-center gap-2 mb-1">
                          <div class="w-3 h-3 rounded-full bg-[#FF7315]"></div>
                          <span class="text-sm font-bold text-[#FF7315]">Focus Mode</span>
                          <span class="ml-auto text-[10px] font-mono bg-orange-50 text-[#FF7315] px-2 py-0.5 rounded-full">0.75x</span>
                        </div>
                        <input v-model="st.focusContent.title" placeholder="Judul ringkas..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none" />
                        <textarea v-model="st.focusContent.text" rows="3" placeholder="Kalimat pendek & mudah dipahami..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none resize-none"></textarea>

                        <!-- Upload Zone Focus -->
                        <div>
                          <label class="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Video Focus</label>
                          <div
                            @dragover.prevent="dragOverKey = `step-${idx}-focus`"
                            @dragleave="dragOverKey = null"
                            @drop="handleDrop($event, idx, 'focus')"
                            :class="[
                              'relative border-2 border-dashed rounded-xl overflow-hidden transition',
                              dragOverKey === `step-${idx}-focus` ? 'border-[#FF7315] bg-orange-50' :
                              st.focusContent.videoUrl ? 'border-emerald-300 bg-emerald-50/40' :
                              'border-slate-200 hover:border-[#FF7315] hover:bg-orange-50/20'
                            ]"
                          >
                            <input type="file" accept="video/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="handleFileInput($event, idx, 'focus')" />
                            <div v-if="uploadTargetKey === `step-${idx}-focus` && isUploadingVideo" class="p-5 text-center space-y-2">
                              <UploadCloud class="w-6 h-6 text-[#FF7315] mx-auto animate-bounce" />
                              <div class="w-full bg-orange-100 rounded-full h-2">
                                <div class="bg-[#FF7315] h-2 rounded-full transition-all duration-300" :style="`width:${uploadProgress}%`"></div>
                              </div>
                              <p class="text-xs text-[#FF7315] font-bold">Mengunggah ke Cloudinary... {{ uploadProgress }}%</p>
                            </div>
                            <div v-else-if="st.focusContent.videoUrl" class="p-4 flex items-center gap-3">
                              <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 class="w-5 h-5 text-emerald-600" />
                              </div>
                              <div class="min-w-0">
                                <p class="text-xs font-bold text-emerald-700">Video tersimpan</p>
                                <p class="text-[10px] text-slate-400 truncate">{{ st.focusContent.videoUrl }}</p>
                              </div>
                            </div>
                            <div v-else class="p-5 text-center">
                              <UploadCloud class="w-7 h-7 text-slate-300 mx-auto mb-2" />
                              <p class="text-xs font-semibold text-slate-400">Drag & drop video atau klik untuk pilih</p>
                              <p class="text-[10px] text-slate-300 mt-0.5">MP4, MOV, WebM</p>
                            </div>
                          </div>
                          <input v-model="st.focusContent.videoUrl" placeholder="atau paste URL video..." class="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[11px] font-mono text-slate-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Save bar at bottom -->
                <div class="flex items-center justify-between pt-4 mt-2 border-t border-slate-200">
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
                    <FileVideo class="w-5 h-5 text-[#FF7315]" />
                  </div>
                  <ArrowUpRight class="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p class="text-3xl font-extrabold text-[#0F3261]">{{ totalSteps }}</p>
                  <p class="text-xs text-slate-400 font-medium mt-0.5">Total Babak Video</p>
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
                <div class="col-span-2 hidden lg:block">Babak</div>
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
                  <!-- Babak -->
                  <div class="col-span-2 hidden lg:block">
                    <span class="text-sm font-bold text-[#0F3261]">{{ item.steps?.length || 0 }}</span>
                    <span class="text-xs text-slate-400 ml-1">babak</span>
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
              <p class="text-slate-400 text-sm mt-0.5">Ringkasan video yang sudah diupload ke Cloudinary</p>
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
                    ? 'Video akan diunggah langsung ke Cloudinary CDN. Buka form edit materi untuk upload video per babak.'
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
                    <p class="text-xs text-slate-400">{{ item.steps?.length || 0 }} babak video</p>
                  </div>
                  <button @click="openEditForm(item)" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer" style="background:#0F3261;">
                    <Edit3 class="w-3.5 h-3.5" /> Kelola Video
                  </button>
                </div>
                <div class="divide-y divide-slate-50">
                  <div
                    v-for="(step, idx) in (item.steps || [])"
                    :key="step.id || idx"
                    class="grid grid-cols-12 items-center gap-3 px-5 py-3 text-xs"
                  >
                    <div class="col-span-1">
                      <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">{{ idx + 1 }}</span>
                    </div>
                    <div class="col-span-4 font-semibold text-slate-700 truncate">{{ step.title }}</div>
                    <div class="col-span-3">
                      <span :class="['inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold', step.standardContent?.videoUrl ? 'bg-blue-50 text-[#3587CE]' : 'bg-slate-100 text-slate-400']">
                        <div class="w-1.5 h-1.5 rounded-full" :class="step.standardContent?.videoUrl ? 'bg-[#3587CE]' : 'bg-slate-300'"></div>
                        Standard
                      </span>
                    </div>
                    <div class="col-span-3">
                      <span :class="['inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold', step.focusContent?.videoUrl ? 'bg-orange-50 text-[#FF7315]' : 'bg-slate-100 text-slate-400']">
                        <div class="w-1.5 h-1.5 rounded-full" :class="step.focusContent?.videoUrl ? 'bg-[#FF7315]' : 'bg-slate-300'"></div>
                        Focus
                      </span>
                    </div>
                    <div class="col-span-1 text-right">
                      <span v-if="step.standardContent?.videoUrl || step.focusContent?.videoUrl" class="text-emerald-500">✓</span>
                      <span v-else class="text-slate-300">—</span>
                    </div>
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
