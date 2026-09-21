<script setup>
import { ref, computed } from 'vue'
import { materiList } from '../lib/materiService'
import {
  Video,
  Sparkles,
  FileText,
  ArrowRight,
  Film,
  HelpCircle,
  SlidersHorizontal
} from '@lucide/vue'

const props = defineProps({
  searchQuery: { type: String, default: '' }
})

const emit = defineEmits(['openDetail'])

// Filter States
const selectedJenjang = ref('Semua')
const selectedMapel = ref('Semua')
const selectedJenis = ref('Semua')

// Filter Options
const jenjangOptions = ['Semua', 'SD', 'SMP', 'SMA']
const mapelOptions = ['Semua', 'IPAS', 'Matematika', 'Bahasa Indonesia']
const jenisOptions = ['Semua', 'Video', 'Interaktif', 'Worksheet', 'Evaluasi']

const hasActiveFilter = computed(() =>
  selectedJenjang.value !== 'Semua' ||
  selectedMapel.value !== 'Semua' ||
  selectedJenis.value !== 'Semua' ||
  props.searchQuery.trim() !== ''
)

const filteredMateri = computed(() => {
  return materiList.value.filter((item) => {
    if (selectedJenjang.value !== 'Semua' && item.jenjang !== selectedJenjang.value) return false
    if (selectedMapel.value !== 'Semua' && item.mataPelajaran !== selectedMapel.value) return false
    if (selectedJenis.value !== 'Semua' && !item.types?.includes(selectedJenis.value)) return false
    if (props.searchQuery.trim()) {
      const q = props.searchQuery.toLowerCase()
      if (
        !item.title?.toLowerCase().includes(q) &&
        !item.description?.toLowerCase().includes(q) &&
        !item.level?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })
})

const resetFilters = () => {
  selectedJenjang.value = 'Semua'
  selectedMapel.value = 'Semua'
  selectedJenis.value = 'Semua'
}
</script>

<template>
  <div class="w-full flex flex-col flex-1">
    <!-- Banner Materi (Using official Banner_Materi.jpg with notebook artwork) -->
    <section class="relative w-full overflow-hidden flex items-center py-10 sm:py-12 lg:py-16 min-h-[190px] sm:min-h-[220px]" style="background: #EBF5FF url('/Banner_Materi.jpg') no-repeat right center / cover;">
      <!-- Subtle gradient tint for text legibility -->
      <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(90deg, rgba(235,245,255,0.95) 0%, rgba(235,245,255,0.85) 50%, rgba(235,245,255,0.3) 100%);"></div>

      <div class="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div class="max-w-2xl space-y-2.5 text-left">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border border-blue-200/80 bg-white/90 shadow-2xs text-[#0F3261]">
            <Sparkles class="w-3.5 h-3.5 text-[#3DA5FF]" />
            Katalog Pembelajaran Inklusif
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F3261] tracking-tight leading-tight">
            Jelajahi Materi
            <span class="text-[#FF7315]">Pembelajaran</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-lg">
            Temukan media pembelajaran yang sesuai dengan kebutuhan dan gaya belajarmu.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content (Filter + Materi Grid) -->
    <div class="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 flex-1">
      <!-- Filter Section -->
      <section class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" style="box-shadow: 0 4px 20px rgba(15,50,97,0.07);">
      <!-- Filter Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100" style="background: linear-gradient(135deg, #F0F7FF 0%, white 100%);">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #3DA5FF, #3587CE); box-shadow: 0 4px 10px rgba(61,165,255,0.30);">
            <SlidersHorizontal class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-extrabold text-[#0F3261]">Filter Materi</h2>
              <span v-if="hasActiveFilter" class="w-2 h-2 rounded-full bg-[#FF7315] animate-pulse"></span>
            </div>
            <p class="text-[11px] text-slate-400 font-medium">Pilih kategori untuk menyaring materi</p>
          </div>
        </div>
        
        <button
          v-if="hasActiveFilter"
          @click="resetFilters"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
        >
          Reset Filter
        </button>
      </div>

      <!-- Filter Chips Grid (Directly visible) -->
      <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 bg-slate-50/50">
        <!-- Jenjang -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#3DA5FF]"></span>
            Jenjang Pendidikan
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in jenjangOptions" :key="opt"
              @click="selectedJenjang = opt"
              :class="[
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border',
                selectedJenjang === opt
                  ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#3DA5FF] hover:text-[#3587CE]'
              ]"
            >{{ opt }}</button>
          </div>
        </div>

        <!-- Mata Pelajaran -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#74DC2E]"></span>
            Mata Pelajaran
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in mapelOptions" :key="opt"
              @click="selectedMapel = opt"
              :class="[
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border',
                selectedMapel === opt
                  ? 'bg-[#3587CE] text-white border-[#3587CE] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#3DA5FF] hover:text-[#3587CE]'
              ]"
            >{{ opt }}</button>
          </div>
        </div>

        <!-- Jenis Media -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#FF74BC]"></span>
            Jenis Media
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in jenisOptions" :key="opt"
              @click="selectedJenis = opt"
              :class="[
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border',
                selectedJenis === opt
                  ? 'bg-[#E1529C] text-white border-[#E1529C] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#FF74BC] hover:text-[#E1529C]'
              ]"
            >{{ opt }}</button>
          </div>
        </div>
      </div>

      <!-- Hasil Pencarian Count Header -->
      <div class="px-6 py-3 flex items-center justify-between bg-white text-xs">
        <span class="text-slate-500 font-medium">
          Menampilkan <strong class="text-[#0F3261] font-extrabold text-sm">{{ filteredMateri.length }}</strong> materi pembelajaran
        </span>
      </div>
    </section>

    <!-- Materi Cards List -->
    <section class="space-y-4">
      <!-- Empty State -->
      <div v-if="filteredMateri.length === 0" class="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto">
          <Film class="w-7 h-7 text-slate-300" />
        </div>
        <h3 class="text-base font-bold text-[#0F3261]">Tidak Ada Materi yang Cocok</h3>
        <p class="text-sm text-slate-500 max-w-sm mx-auto">
          Coba ubah filter atau kata kunci pencarian.
        </p>
        <button
          @click="resetFilters"
          class="px-5 py-2 rounded-full bg-[#0F3261] text-white text-xs font-bold hover:bg-[#10458C] transition cursor-pointer"
        >
          Reset Filter
        </button>
      </div>

      <!-- Cards -->
      <div
        v-for="item in filteredMateri"
        :key="item.id"
        class="bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col md:flex-row items-start hover:shadow-xl transition-all duration-300 group"
        style="box-shadow: 0 2px 12px rgba(15,50,97,0.06);"
      >
        <!-- Thumbnail -->
        <div class="w-full md:w-64 lg:w-72 h-48 md:h-auto md:min-h-[200px] overflow-hidden shrink-0 bg-slate-100 relative">
          <img
            :src="item.image || '/es_batu_card.jpg'"
            :alt="item.title"
            class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <!-- Gradient overlay -->
          <div class="absolute inset-0" style="background: linear-gradient(to top, rgba(15,50,97,0.35) 0%, transparent 45%);"></div>
          <!-- Badge -->
          <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-extrabold text-white shadow" style="background: linear-gradient(135deg, #FF7315, #E86105); box-shadow: 0 2px 8px rgba(255,115,21,0.4);">
            {{ item.badge || 'Gratis' }}
          </span>
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col justify-between p-5 sm:p-6 space-y-4 w-full text-left">
          <div class="space-y-2">
            <p class="text-[11px] font-bold uppercase tracking-wider" style="color: #3587CE;">{{ item.level }}</p>
            <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F3261] leading-tight">{{ item.title }}</h2>
            <p class="text-sm text-slate-600 leading-relaxed max-w-2xl">{{ item.description }}</p>
          </div>

          <!-- Bottom Row -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <!-- Media Types -->
            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="item.types?.includes('Video')" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background: #EBF5FF; color: #3587CE;">
                <Video class="w-3.5 h-3.5" /> Video
              </span>
              <span v-if="item.types?.includes('Interaktif')" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background: #FDF0F7; color: #E1529C;">
                <Sparkles class="w-3.5 h-3.5" /> Interaktif
              </span>
              <span v-if="item.types?.includes('Worksheet')" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background: #F0FBE6; color: #54AA1B;">
                <FileText class="w-3.5 h-3.5" /> Worksheet
              </span>
              <span v-if="item.types?.includes('Evaluasi')" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background: #FFFAE6; color: #D9BA40;">
                <HelpCircle class="w-3.5 h-3.5" /> Evaluasi
              </span>
            </div>

            <!-- CTA -->
            <button
              @click="emit('openDetail', item)"
              class="btn-tactile-orange px-6 py-2.5 font-extrabold text-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Lihat Materi</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>
