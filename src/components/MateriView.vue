<script setup>
import { ref, computed } from 'vue'
import { materiList } from '../lib/materiService'
import {
  ArrowRight,
  Film,
  RotateCcw,
  Sparkles,
  Clock,
  Video
} from '@lucide/vue'
import DoodleOrnament from './DoodleOrnament.vue'
import { currentUser, isAdmin } from '../lib/authService'
import { playButtonPop } from '../lib/soundEffects'

const props = defineProps({
  searchQuery: { type: String, default: '' }
})

const emit = defineEmits(['openDetail'])

// Filter States
const selectedJenjang = ref('Semua')
const selectedMapel = ref('Semua')
const selectedKelas = ref('Semua')

// Filter Options
const jenjangOptions = ['Semua', 'SD', 'SMP', 'SMA']
const mapelOptions = ['Semua', 'IPAS', 'Matematika', 'Bahasa Indonesia']

// Daftar Kelas per Jenjang
const kelasByJenjang = {
  SD: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'],
  SMP: ['Kelas 7', 'Kelas 8', 'Kelas 9'],
  SMA: ['Kelas 10', 'Kelas 11', 'Kelas 12']
}

const allKelasList = [
  ...kelasByJenjang.SD,
  ...kelasByJenjang.SMP,
  ...kelasByJenjang.SMA
]

const kelasOptions = computed(() => {
  if (selectedJenjang.value === 'SD') return ['Semua', ...kelasByJenjang.SD]
  if (selectedJenjang.value === 'SMP') return ['Semua', ...kelasByJenjang.SMP]
  if (selectedJenjang.value === 'SMA') return ['Semua', ...kelasByJenjang.SMA]
  return ['Semua', ...allKelasList]
})

const getItemKelas = (item) => {
  if (!item) return ''
  const lvl = (item.level || '').toLowerCase()
  if (lvl.includes('kelas 10') || (lvl.includes('kelas x') && !lvl.includes('kelas xi') && !lvl.includes('kelas xii'))) return 'Kelas 10'
  if (lvl.includes('kelas 11') || (lvl.includes('kelas xi') && !lvl.includes('kelas xii'))) return 'Kelas 11'
  if (lvl.includes('kelas 12') || lvl.includes('kelas xii')) return 'Kelas 12'
  if (lvl.includes('kelas 1') || (lvl.includes('kelas i') && !lvl.includes('kelas iv') && !lvl.includes('kelas ix'))) return 'Kelas 1'
  if (lvl.includes('kelas 2') || lvl.includes('kelas ii')) return 'Kelas 2'
  if (lvl.includes('kelas 3') || lvl.includes('kelas iii')) return 'Kelas 3'
  if (lvl.includes('kelas 4') || lvl.includes('kelas iv')) return 'Kelas 4'
  if (lvl.includes('kelas 5') || lvl.includes('kelas v')) return 'Kelas 5'
  if (lvl.includes('kelas 6') || lvl.includes('kelas vi')) return 'Kelas 6'
  if (lvl.includes('kelas 7') || lvl.includes('kelas vii')) return 'Kelas 7'
  if (lvl.includes('kelas 8') || lvl.includes('kelas viii')) return 'Kelas 8'
  if (lvl.includes('kelas 9') || lvl.includes('kelas ix')) return 'Kelas 9'
  return ''
}

const onSelectJenjang = (opt) => {
  playButtonPop()
  selectedJenjang.value = opt
  if (selectedKelas.value !== 'Semua') {
    const valid = opt === 'Semua' ? allKelasList : (kelasByJenjang[opt] || [])
    if (!valid.includes(selectedKelas.value)) {
      selectedKelas.value = 'Semua'
    }
  }
}

const hasActiveFilter = computed(() =>
  selectedJenjang.value !== 'Semua' ||
  selectedMapel.value !== 'Semua' ||
  selectedKelas.value !== 'Semua' ||
  props.searchQuery.trim() !== ''
)

const filteredMateri = computed(() => {
  return materiList.value.filter((item) => {
    if (selectedJenjang.value !== 'Semua' && item.jenjang !== selectedJenjang.value) return false
    if (selectedMapel.value !== 'Semua' && item.mataPelajaran !== selectedMapel.value) return false
    if (selectedKelas.value !== 'Semua') {
      const k = getItemKelas(item)
      if (k !== selectedKelas.value) return false
    }
    if (props.searchQuery.trim()) {
      const q = props.searchQuery.toLowerCase()
      if (
        !item.title?.toLowerCase().includes(q) &&
        !item.description?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })
})

const resetFilters = () => {
  playButtonPop()
  selectedJenjang.value = 'Semua'
  selectedMapel.value = 'Semua'
  selectedKelas.value = 'Semua'
}
</script>

<template>
  <div
    class="w-full flex flex-col flex-1 pt-4 sm:pt-6 pb-12 px-4 sm:px-6 lg:px-10 space-y-4 sm:space-y-5 relative overflow-hidden"
    style="background-image: radial-gradient(#d3e5fa 1.2px, transparent 1.2px); background-size: 30px 30px;"
  >
    <!-- Background Ambient Glow Blobs -->
    <div class="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#FFDC58]/12 blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-[#3DA5FF]/10 blur-3xl pointer-events-none"></div>

    <!-- Authentic Floating Doodles for Materi Page -->
    <div class="absolute top-8 left-8 pointer-events-none select-none hidden sm:block -rotate-12 animate-bounce-subtle">
      <DoodleOrnament name="star-outline" color="#FFDC58" :size="40" />
    </div>
    <div class="absolute top-8 right-12 pointer-events-none select-none hidden sm:block rotate-12 animate-float-slow">
      <DoodleOrnament name="arrow-loop" color="#3DA5FF" :size="48" />
    </div>
    <div class="absolute top-1/2 left-4 pointer-events-none select-none hidden xl:block animate-float-medium">
      <DoodleOrnament name="dots-duo" :size="42" />
    </div>
    <div class="absolute top-1/2 right-6 pointer-events-none select-none hidden xl:block rotate-12">
      <DoodleOrnament name="heart-outline" color="#FF74BC" :size="36" />
    </div>
    <div class="absolute bottom-8 left-8 pointer-events-none select-none hidden md:block">
      <DoodleOrnament name="squiggle" color="#FF7315" :size="65" />
    </div>
    <div class="absolute bottom-8 right-10 pointer-events-none select-none hidden sm:block animate-pulse-subtle">
      <DoodleOrnament name="burst" color="#54AA1B" :size="32" />
    </div>

    <div class="w-full max-w-[1440px] mx-auto space-y-4 sm:space-y-5 relative z-10">

      <!-- ==================== 1. AREA HEADER HALAMAN ==================== -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center px-1 py-1 relative">
        <!-- Text Left -->
        <div class="lg:col-span-8 space-y-1.5 text-left">
          <h1 class="text-3xl sm:text-4xl lg:text-4xl font-black text-[#0F3261] tracking-tight leading-tight">
            Jelajahi Materi Pembelajaran
          </h1>
          
          <p class="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed max-w-xl">
            Temukan media pembelajaran yang sesuai dengan kebutuhanmu.
          </p>
        </div>

        <!-- Banner Artwork Right with Hand-drawn Vector Doodles -->
        <div class="lg:col-span-4 flex justify-center lg:justify-end pointer-events-none relative select-none">
          <div class="absolute -top-4 left-4 sm:left-12 -rotate-12 animate-bounce-subtle">
            <DoodleOrnament name="star-outline" color="#FFDC58" :size="32" />
          </div>
          <div class="absolute -bottom-2 right-2 animate-pulse-subtle">
            <DoodleOrnament name="burst" color="#3DA5FF" :size="26" />
          </div>
          <div class="absolute -top-5 right-8 rotate-12 hidden sm:block">
            <DoodleOrnament name="heart-outline" color="#FF74BC" :size="28" />
          </div>

          <img
            src="/Banner_Materi.jpg"
            alt="Artwork Notebook Inkluvia"
            class="w-full max-w-[170px] sm:max-w-[190px] lg:max-w-[210px] h-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      <!-- ==================== 2. KONTAINER LUAR UTAMA ==================== -->
      <div class="bg-white rounded-3xl p-5 sm:p-7 lg:p-8 border border-blue-100/90 shadow-xl space-y-6 sm:space-y-8 relative z-10">
        
        <!-- ==================== 3A. BAGIAN FILTER ==================== -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-[#0F3261] uppercase tracking-wider">Kategori Filter</span>
              <span v-if="hasActiveFilter" class="w-2 h-2 rounded-full bg-[#FF7315] animate-pulse"></span>
            </div>

            <button
              v-if="hasActiveFilter"
              @click="resetFilters"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>

          <!-- Filter Area -->
          <div class="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Filter 1: Jenjang -->
              <div class="space-y-2 text-left">
                <label class="text-xs font-black text-[#0F3261] block">
                  Jenjang
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="opt in jenjangOptions"
                    :key="opt"
                    @click="onSelectJenjang(opt)"
                    :class="[
                      'px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer',
                      selectedJenjang === opt
                        ? 'bg-[#0F3261] text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    ]"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>

              <!-- Filter 2: Mata Pelajaran -->
              <div class="space-y-2 text-left">
                <label class="text-xs font-black text-[#0F3261] block">
                  Mata Pelajaran
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="opt in mapelOptions"
                    :key="opt"
                    @click="selectedMapel = opt; playButtonPop()"
                    :class="[
                      'px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer',
                      selectedMapel === opt
                        ? 'bg-[#3DA5FF] text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    ]"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Filter 3: Kelas -->
            <div class="space-y-2 text-left pt-3 border-t border-slate-200/60">
              <div class="flex items-center justify-between">
                <label class="text-xs font-black text-[#0F3261] block">
                  Kelas
                </label>
                <span v-if="selectedJenjang !== 'Semua'" class="text-[11px] font-bold text-slate-400">
                  Menampilkan kelas untuk jenjang {{ selectedJenjang }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in kelasOptions"
                  :key="opt"
                  @click="selectedKelas = opt; playButtonPop()"
                  :class="[
                    'px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer',
                    selectedKelas === opt
                      ? 'bg-[#FF7315] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  ]"
                >
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== 3B. ITEM MATERI ==================== -->
        <div class="space-y-6 pt-2">
          <!-- Count info -->
          <div class="text-xs text-slate-500 font-bold text-left">
            Menampilkan <strong class="text-[#0F3261] font-black text-sm">{{ filteredMateri.length }}</strong> materi pembelajaran
          </div>

          <!-- Empty State -->
          <div v-if="filteredMateri.length === 0" class="bg-slate-50/70 rounded-2xl p-10 border border-slate-200/80 text-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto">
              <Film class="w-7 h-7 text-slate-300" />
            </div>
            <h3 class="text-base font-extrabold text-[#0F3261]">Tidak Ada Materi yang Cocok</h3>
            <p class="text-sm text-slate-500 max-w-sm mx-auto font-medium">
              Coba ubah filter atau kata kunci pencarian.
            </p>
            <button
              @click="resetFilters"
              class="px-5 py-2.5 rounded-full bg-[#0F3261] text-white text-xs font-extrabold hover:bg-[#10458C] transition cursor-pointer shadow-md"
            >
              Reset Filter
            </button>
          </div>

          <!-- MATERI CARDS -->
          <div
            v-for="item in filteredMateri"
            :key="item.id"
            class="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-stretch gap-6 group"
          >
            <!-- Left Thumbnail Image -->
            <div class="w-full md:w-64 lg:w-72 h-48 md:h-auto min-h-[200px] rounded-xl overflow-hidden shrink-0 bg-slate-100 relative shadow-inner">
              <img
                :src="item.image || '/es_batu_card.jpg'"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <!-- Badge Gratis / Pro -->
              <span
                v-if="(item.badge || '').toLowerCase() === 'pro' && (currentUser?.isPro || isAdmin)"
                class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black text-slate-900 shadow-md bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 border border-amber-300 flex items-center gap-1"
              >
                <span>👑 PRO (AKSES AKTIF)</span>
              </span>
              <span
                v-else
                class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black text-white shadow-md"
                :style="(item.badge || '').toLowerCase() === 'pro' ? 'background: linear-gradient(135deg, #d97706, #b45309);' : 'background: linear-gradient(135deg, #10b981, #059669);'"
              >
                {{ (item.badge || '').toLowerCase() === 'pro' ? '🔒 PRO' : '⭐ GRATIS' }}
              </span>
            </div>

            <!-- Right Details & Content -->
            <div class="flex-1 flex flex-col justify-between space-y-4 text-left">
              <div class="space-y-2">
                <h2 class="text-xl sm:text-2xl font-black text-[#0F3261] group-hover:text-[#FF7315] transition-colors leading-tight">
                  {{ item.title }}
                </h2>
                <p class="text-xs font-bold text-slate-400">
                  {{ item.level }}
                </p>
                <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
                  {{ item.description }}
                </p>
              </div>

              <!-- Apa yang akan kamu pelajari? (Learning Points) -->
              <div class="space-y-2 pt-1">
                <h3 class="text-xs font-extrabold text-[#0F3261]">
                  Apa yang akan kamu pelajari?
                </h3>
                <div class="flex items-center gap-2 flex-wrap">
                  <div
                    v-for="(lp, idx) in (item.learningPoints || [{ title: 'Mencair' }, { title: 'Menguap' }, { title: 'Mengembun' }])"
                    :key="lp.id || idx"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F9FD] border border-blue-100/80 text-xs font-semibold text-[#0F3261]"
                  >
                    <Sparkles class="w-3.5 h-3.5 text-[#3DA5FF]" />
                    <span>{{ typeof lp === 'string' ? lp : lp.title }}</span>
                  </div>
                </div>
              </div>

              <!-- Meta Info Row (Durasi, Aktivitas, Pilihan Belajar) -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                <div class="flex items-center gap-2">
                  <Clock class="w-4 h-4 text-[#0F3261] shrink-0" />
                  <div>
                    <span class="block text-[10px] text-slate-400">Durasi</span>
                    <span class="font-bold text-slate-700">{{ item.duration || '± 4 menit' }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Video class="w-4 h-4 text-[#0F3261] shrink-0" />
                  <div>
                    <span class="block text-[10px] text-slate-400">Aktivitas</span>
                    <span class="font-bold text-slate-700">{{ item.activityType || 'Video + Aktivitas' }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Sparkles class="w-4 h-4 text-[#0F3261] shrink-0" />
                  <div>
                    <span class="block text-[10px] text-slate-400">Pilihan Belajar</span>
                    <span class="font-bold text-slate-700">{{ item.learningOptions || '4 Mode Belajar' }}</span>
                  </div>
                </div>
              </div>

              <!-- Bottom Row: CTA Button -->
              <div class="flex justify-end pt-3 border-t border-slate-100">
                <button
                  @click="emit('openDetail', item); playButtonPop()"
                  class="btn-tactile-orange px-6 py-3 text-xs font-extrabold flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <span v-if="(item.badge || '').toLowerCase() === 'pro' && (currentUser?.isPro || isAdmin)">Mulai Materi PRO ⭐</span>
                  <span v-else>Mulai Petualangan</span>
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>
