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
import { playButtonPop } from '../lib/soundEffects'

const props = defineProps({
  searchQuery: { type: String, default: '' }
})

const emit = defineEmits(['openDetail'])

// Filter States
const selectedJenjang = ref('Semua')
const selectedMapel = ref('Semua')

// Filter Options
const jenjangOptions = ['Semua', 'SD', 'SMP', 'SMA']
const mapelOptions = ['Semua', 'IPAS', 'Matematika', 'Bahasa Indonesia']

const hasActiveFilter = computed(() =>
  selectedJenjang.value !== 'Semua' ||
  selectedMapel.value !== 'Semua' ||
  props.searchQuery.trim() !== ''
)

const filteredMateri = computed(() => {
  return materiList.value.filter((item) => {
    if (selectedJenjang.value !== 'Semua' && item.jenjang !== selectedJenjang.value) return false
    if (selectedMapel.value !== 'Semua' && item.mataPelajaran !== selectedMapel.value) return false
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
}
</script>

<template>
  <div class="w-full flex flex-col flex-1 pt-4 sm:pt-6 pb-12 px-4 sm:px-6 lg:px-10 space-y-4 sm:space-y-5">
    <div class="w-full max-w-[1440px] mx-auto space-y-4 sm:space-y-5">

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

        <!-- Banner Artwork Right -->
        <div class="lg:col-span-4 flex justify-center lg:justify-end pointer-events-none relative">
          <div class="absolute -top-3 left-4 sm:left-12 text-lg text-[#FFDC58] animate-bounce-subtle">⭐</div>
          <div class="absolute -bottom-1 right-2 text-base text-[#FF7315]">✨</div>

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

          <!-- 2 Area Filter -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
            <!-- Filter 1: Jenjang -->
            <div class="space-y-2 text-left">
              <label class="text-xs font-black text-[#0F3261] block">
                Jenjang
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in jenjangOptions"
                  :key="opt"
                  @click="selectedJenjang = opt; playButtonPop()"
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
              <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black text-white shadow-md" style="background: linear-gradient(135deg, #FF7315, #E86105);">
                {{ item.badge || 'Gratis' }}
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
                  <span>Mulai Petualangan</span>
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
