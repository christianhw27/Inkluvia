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
const showFilters = ref(false)

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
  <div class="space-y-5">
    <!-- Banner Materi -->
    <section class="relative rounded-3xl overflow-hidden shadow-sm border border-slate-100 min-h-[160px] sm:min-h-[180px] flex items-center bg-[#E6F3FD]">
      <img
        src="/Banner_Materi.jpg"
        alt="Banner Materi Inkluvia"
        class="absolute inset-0 w-full h-full object-cover object-right pointer-events-none select-none"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-[#DDF1FF]/95 via-[#E6F4FE]/80 to-transparent w-full md:w-3/5 pointer-events-none"></div>
      <div class="relative z-10 px-6 sm:px-10 lg:px-12 py-8 max-w-xl space-y-2">
        <h1 class="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#0F3261] tracking-tight leading-tight">
          Jelajahi Materi Pembelajaran
        </h1>
        <p class="text-sm text-slate-600 font-medium">
          Temukan media pembelajaran yang sesuai dengan kebutuhanmu.
        </p>
      </div>
    </section>

    <!-- Filter Section -->
    <section class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <!-- Filter Header -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="w-4 h-4 text-[#3587CE]" />
          <span class="text-sm font-bold text-[#0F3261]">Filter Materi</span>
          <span v-if="hasActiveFilter" class="w-2 h-2 rounded-full bg-[#FF7315] animate-pulse"></span>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="hasActiveFilter"
            @click="resetFilters"
            class="text-xs font-semibold text-rose-500 hover:text-rose-700 transition cursor-pointer"
          >
            Reset Filter
          </button>
          <button
            @click="showFilters = !showFilters"
            class="text-xs font-semibold text-[#3587CE] cursor-pointer"
          >
            {{ showFilters ? 'Sembunyikan' : 'Tampilkan' }}
          </button>
        </div>
      </div>

      <!-- Filter Chips -->
      <div v-show="showFilters || hasActiveFilter" class="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-5 border-b border-slate-100">
        <!-- Jenjang -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Jenjang</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in jenjangOptions" :key="opt"
              @click="selectedJenjang = opt"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border',
                selectedJenjang === opt
                  ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#3DA5FF] hover:text-[#3587CE]'
              ]"
            >{{ opt }}</button>
          </div>
        </div>

        <!-- Mata Pelajaran -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Mata Pelajaran</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in mapelOptions" :key="opt"
              @click="selectedMapel = opt"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border',
                selectedMapel === opt
                  ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#3DA5FF] hover:text-[#3587CE]'
              ]"
            >{{ opt }}</button>
          </div>
        </div>

        <!-- Jenis Media -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Jenis Media</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in jenisOptions" :key="opt"
              @click="selectedJenis = opt"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border',
                selectedJenis === opt
                  ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#3DA5FF] hover:text-[#3587CE]'
              ]"
            >{{ opt }}</button>
          </div>
        </div>
      </div>

      <!-- Hasil Pencarian Count -->
      <div class="px-5 py-2.5 flex items-center justify-between">
        <span class="text-xs text-slate-400">
          Menampilkan <strong class="text-[#0F3261]">{{ filteredMateri.length }}</strong> materi
        </span>
        <button
          v-if="!showFilters && !hasActiveFilter"
          @click="showFilters = true"
          class="text-xs text-[#3587CE] font-semibold cursor-pointer hover:underline"
        >
          Tampilkan Filter
        </button>
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
        class="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 flex flex-col md:flex-row items-start gap-5 hover:shadow-lg transition-all duration-300 group"
        style="box-shadow: 0 1px 4px rgba(0,0,0,0.04);"
      >
        <!-- Thumbnail -->
        <div class="w-full md:w-56 lg:w-64 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100 relative">
          <img
            :src="item.image || '/es_batu_card.jpg'"
            :alt="item.title"
            class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <!-- Badge -->
          <span class="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF7315] text-white shadow">
            {{ item.badge || 'Gratis' }}
          </span>
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col justify-between h-full space-y-4 w-full text-left">
          <div class="space-y-2">
            <p class="text-xs font-semibold text-slate-400">{{ item.level }}</p>
            <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F3261] leading-tight">{{ item.title }}</h2>
            <p class="text-sm text-slate-600 leading-relaxed max-w-2xl">{{ item.description }}</p>
          </div>

          <!-- Bottom Row -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <!-- Media Types -->
            <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 flex-wrap">
              <span v-if="item.types?.includes('Video')" class="inline-flex items-center gap-1.5 text-[#3587CE]">
                <Video class="w-3.5 h-3.5" /> Video
              </span>
              <span v-if="item.types?.includes('Interaktif')" class="inline-flex items-center gap-1.5 text-[#7B4699]">
                <Sparkles class="w-3.5 h-3.5" /> Interaktif
              </span>
              <span v-if="item.types?.includes('Worksheet')" class="inline-flex items-center gap-1.5 text-emerald-600">
                <FileText class="w-3.5 h-3.5" /> Worksheet
              </span>
              <span v-if="item.types?.includes('Evaluasi')" class="inline-flex items-center gap-1.5 text-amber-600">
                <HelpCircle class="w-3.5 h-3.5" /> Evaluasi
              </span>
            </div>

            <!-- CTA -->
            <button
              @click="emit('openDetail', item)"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-bold text-sm transition active:scale-95 cursor-pointer shadow-md shrink-0"
              style="background: linear-gradient(135deg,#FF7315,#e86105); box-shadow: 0 4px 14px rgba(255,115,21,0.30);"
            >
              Lihat Materi
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
