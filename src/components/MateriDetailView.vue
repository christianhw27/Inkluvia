<script setup>
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Droplets,
  Wind,
  Cloud,
  Clock,
  Video,
  Sparkles
} from '@lucide/vue'

const props = defineProps({
  materi: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'start'])
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto py-2">
    <!-- Tombol Kembali -->
    <div>
      <button
        @click="emit('back')"
        class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0F3261] transition cursor-pointer"
      >
        <ArrowLeft class="w-4 h-4" />
        Kembali ke Materi
      </button>
    </div>

    <!-- Main Card Detail Container -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-100/90 shadow-sm">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <!-- Sisi Kiri: Video / Image Preview with Play Overlay -->
        <div class="lg:col-span-5 flex justify-center">
          <div class="relative w-full max-w-md aspect-4/3 rounded-3xl overflow-hidden shadow-md border border-slate-100 group">
            <img
              :src="materi.image || '/es_batu_card.jpg'"
              :alt="materi.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/30 transition-colors flex items-center justify-center">
              <button
                @click="emit('start')"
                class="w-16 h-16 rounded-full bg-slate-900/80 hover:bg-[#FF7315] text-white flex items-center justify-center pl-1 shadow-xl shadow-slate-950/30 group-hover:scale-110 transition-all duration-300 cursor-pointer"
              >
                <Play class="w-7 h-7 fill-white" />
              </button>
            </div>
          </div>
        </div>

        <!-- Sisi Kanan: Detail & Deskripsi Materi -->
        <div class="lg:col-span-7 space-y-5 text-left">
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F3261] tracking-tight">
                {{ materi.title }}
              </h1>
              <span class="px-3.5 py-1 rounded-full text-xs font-bold text-[#FF7315] border border-[#FF7315] bg-[#FFF4EC] shrink-0">
                {{ materi.badge || 'Gratis' }}
              </span>
            </div>

            <p class="text-xs font-semibold text-slate-400">
              {{ materi.level || 'IPAS • Kelas IV • Fase B' }}
            </p>

            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1 font-medium">
              {{ materi.description }}
            </p>
          </div>

          <!-- Section: Apa yang akan kamu pelajari? -->
          <div class="space-y-3 pt-2">
            <h2 class="text-xs sm:text-sm font-bold text-[#0F3261]">
              Apa yang akan kamu pelajari?
            </h2>

            <div class="flex items-center gap-3 sm:gap-4 flex-wrap">
              <!-- Item 1: Mencair -->
              <div class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F4F9FD] border border-blue-100/80 text-xs font-semibold text-[#0F3261]">
                <Droplets class="w-4 h-4 text-[#3DA5FF]" />
                Mencair
              </div>

              <!-- Item 2: Menguap -->
              <div class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F4F9FD] border border-blue-100/80 text-xs font-semibold text-[#0F3261]">
                <Wind class="w-4 h-4 text-[#3DA5FF]" />
                Menguap
              </div>

              <!-- Item 3: Mengembun -->
              <div class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F4F9FD] border border-blue-100/80 text-xs font-semibold text-[#0F3261]">
                <Cloud class="w-4 h-4 text-[#3DA5FF]" />
                Mengembun
              </div>
            </div>
          </div>

          <!-- Meta Info Row (Durasi, Aktivitas, Pilihan Belajar) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div class="flex items-center gap-2 text-slate-600">
              <Clock class="w-4 h-4 text-[#0F3261] shrink-0" />
              <div>
                <span class="block text-[11px] text-slate-400">Durasi</span>
                <span class="font-bold text-slate-700">{{ materi.duration || '± 4 menit' }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 text-slate-600">
              <Video class="w-4 h-4 text-[#0F3261] shrink-0" />
              <div>
                <span class="block text-[11px] text-slate-400">Aktivitas</span>
                <span class="font-bold text-slate-700">{{ materi.activityType || 'Video + Aktivitas' }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 text-slate-600">
              <Sparkles class="w-4 h-4 text-[#0F3261] shrink-0" />
              <div>
                <span class="block text-[11px] text-slate-400">Pilihan Belajar</span>
                <span class="font-bold text-slate-700">{{ materi.learningOptions || 'Standard & Focus Mode' }}</span>
              </div>
            </div>
          </div>

          <!-- CTA Mulai Petualangan -->
          <div class="pt-4">
            <button
              @click="emit('start')"
              class="w-full sm:w-auto btn-tactile-orange px-8 py-3.5 font-extrabold text-sm inline-flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Mulai Petualangan</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
