<script setup>
import { ref } from 'vue'
import { ArrowLeft, ArrowRight, Check } from '@lucide/vue'

const props = defineProps({
  materi: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'selectMode'])

const activeMode = ref('standard') // 'standard' | 'focus'

const handleContinue = () => {
  emit('selectMode', activeMode.value)
}
</script>

<template>
  <div class="w-full flex flex-col flex-1 pt-4 sm:pt-6 pb-12 px-4 sm:px-6 lg:px-10 space-y-4 sm:space-y-5">
    <div class="w-full max-w-[1440px] mx-auto space-y-4 sm:space-y-5">
      <!-- Top Header Bar -->
      <div class="bg-white rounded-2xl px-5 sm:px-8 py-3.5 border border-slate-100/90 shadow-xs flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button
            @click="emit('back')"
            class="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-[#0F3261] transition cursor-pointer"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-[#0F3261]">
              {{ materi.title }}
            </h2>
            <p class="text-[10px] sm:text-xs text-slate-400">
              {{ materi.level }}
            </p>
          </div>
        </div>
      </div>

      <!-- Center Content: Title & Mode Cards -->
      <div class="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100/90 shadow-xl text-center space-y-8">
        <!-- Heading -->
        <div class="space-y-1.5 max-w-lg mx-auto">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F3261] tracking-tight">
            Pilih Cara Belajarmu!
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 font-medium">
            Kamu bisa memilih mode belajar sesuai dengan kebutuhanmu.
          </p>
        </div>

        <!-- 4 Mode Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full items-stretch">
        
        <!-- 1. Standard Mode Card -->
        <div
          @click="activeMode = 'standard'"
          :class="[
            'rounded-3xl p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center relative group',
            activeMode === 'standard'
              ? 'border-[#3DA5FF] bg-[#F4F9FF] shadow-lg shadow-blue-500/10 scale-[1.02]'
              : 'border-slate-100 bg-[#FAFDFE] hover:border-blue-200 hover:bg-white'
          ]"
        >
          <div
            v-if="activeMode === 'standard'"
            class="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#3587CE] text-white flex items-center justify-center shadow-xs"
          >
            <Check class="w-4 h-4" />
          </div>

          <div class="w-28 h-24 flex items-center justify-center mb-3">
            <img
              src="/Icon_Standar Mode.png"
              alt="Standard Mode Icon"
              class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          <div class="space-y-2 w-full">
            <h3 class="text-lg font-bold text-[#3587CE]">
              Standar Mode
            </h3>

            <ul class="text-[11px] text-slate-600 space-y-1 text-left max-w-xs mx-auto">
              <li class="flex items-start gap-1.5">
                <Check class="w-3.5 h-3.5 text-[#3587CE] shrink-0 mt-0.5" />
                <span>Visual, animasi, dan narasi audio lengkap.</span>
              </li>
              <li class="flex items-start gap-1.5">
                <Check class="w-3.5 h-3.5 text-[#3587CE] shrink-0 mt-0.5" />
                <span>Pengalaman belajar menyeluruh.</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 2. Slow Mode Card -->
        <div
          @click="activeMode = 'slow'"
          :class="[
            'rounded-3xl p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center relative group',
            activeMode === 'slow'
              ? 'border-purple-500 bg-purple-50/70 shadow-lg shadow-purple-500/10 scale-[1.02]'
              : 'border-slate-100 bg-[#FAFDFE] hover:border-purple-200 hover:bg-white'
          ]"
        >
          <div
            v-if="activeMode === 'slow'"
            class="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs"
          >
            <Check class="w-4 h-4" />
          </div>

          <div class="w-28 h-24 flex items-center justify-center mb-3">
            <span class="text-4xl">🐢</span>
          </div>

          <div class="space-y-2 w-full">
            <h3 class="text-lg font-bold text-purple-700">
              Slow Mode
            </h3>

            <ul class="text-[11px] text-slate-600 space-y-1 text-left max-w-xs mx-auto">
              <li class="flex items-start gap-1.5">
                <Check class="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>Video & audio diputar 0.75x lebih santai.</span>
              </li>
              <li class="flex items-start gap-1.5">
                <Check class="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>Penyampaian materi bertahap & jelas.</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 3. High Contrast Mode Card -->
        <div
          @click="activeMode = 'high_contrast'"
          :class="[
            'rounded-3xl p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center relative group',
            activeMode === 'high_contrast'
              ? 'border-yellow-500 bg-slate-900 text-white shadow-lg shadow-yellow-500/20 scale-[1.02]'
              : 'border-slate-100 bg-[#FAFDFE] hover:border-yellow-400 hover:bg-white'
          ]"
        >
          <div
            v-if="activeMode === 'high_contrast'"
            class="absolute top-3 right-3 w-6 h-6 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center shadow-xs"
          >
            <Check class="w-4 h-4 font-bold" />
          </div>

          <div class="w-28 h-24 flex items-center justify-center mb-3">
            <span class="text-4xl">👁️‍🗨️</span>
          </div>

          <div class="space-y-2 w-full">
            <h3 :class="['text-lg font-bold', activeMode === 'high_contrast' ? 'text-yellow-400' : 'text-slate-800']">
              High Contrast
            </h3>

            <ul :class="['text-[11px] space-y-1 text-left max-w-xs mx-auto', activeMode === 'high_contrast' ? 'text-slate-200' : 'text-slate-600']">
              <li class="flex items-start gap-1.5">
                <Check :class="['w-3.5 h-3.5 shrink-0 mt-0.5', activeMode === 'high_contrast' ? 'text-yellow-400' : 'text-slate-700']" />
                <span>Warna kontras tinggi bebas silau.</span>
              </li>
              <li class="flex items-start gap-1.5">
                <Check :class="['w-3.5 h-3.5 shrink-0 mt-0.5', activeMode === 'high_contrast' ? 'text-yellow-400' : 'text-slate-700']" />
                <span>Teks berukuran lebih besar & mudah dibaca.</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 4. Focus Mode Card -->
        <div
          @click="activeMode = 'focus'"
          :class="[
            'rounded-3xl p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center relative group',
            activeMode === 'focus'
              ? 'border-[#FF7315] bg-[#FFF8F2] shadow-lg shadow-orange-500/10 scale-[1.02]'
              : 'border-slate-100 bg-[#FAFDFE] hover:border-orange-200 hover:bg-white'
          ]"
        >
          <div
            v-if="activeMode === 'focus'"
            class="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#FF7315] text-white flex items-center justify-center shadow-xs"
          >
            <Check class="w-4 h-4" />
          </div>

          <div class="w-28 h-24 flex items-center justify-center mb-3">
            <img
              src="/Icon_Focus Mode.png"
              alt="Focus Mode Icon"
              class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          <div class="space-y-2 w-full">
            <h3 class="text-lg font-bold text-[#FF7315]">
              Focus Mode
            </h3>

            <ul class="text-[11px] text-slate-600 space-y-1 text-left max-w-xs mx-auto">
              <li class="flex items-start gap-1.5">
                <Check class="w-3.5 h-3.5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Tampilan lebih sederhana & tenang.</span>
              </li>
              <li class="flex items-start gap-1.5">
                <Check class="w-3.5 h-3.5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Bebas dari distraksi visual berlebih.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      <!-- Action Button Lanjutkan -->
      <div class="pt-4">
        <button
          @click="handleContinue"
          class="btn-tactile-orange px-10 py-3.5 font-extrabold text-sm inline-flex items-center gap-2.5 cursor-pointer"
        >
          <span>Lanjutkan</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</div>
</template>
