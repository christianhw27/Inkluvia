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
  <div class="space-y-6 max-w-5xl mx-auto py-2">
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
    <div class="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100/90 shadow-sm text-center space-y-8">
      <!-- Heading -->
      <div class="space-y-1.5 max-w-lg mx-auto">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F3261] tracking-tight">
          Pilih Cara Belajarmu!
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 font-medium">
          Kamu bisa memilih mode belajar sesuai dengan kebutuhanmu.
        </p>
      </div>

      <!-- 2 Mode Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
        <!-- 1. Standard Mode Card -->
        <div
          @click="activeMode = 'standard'"
          :class="[
            'rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center relative group',
            activeMode === 'standard'
              ? 'border-[#3DA5FF] bg-[#F4F9FF] shadow-lg shadow-blue-500/10 scale-[1.02]'
              : 'border-slate-100 bg-[#FAFDFE] hover:border-blue-200 hover:bg-white'
          ]"
        >
          <!-- Active Selection Checkmark Badge -->
          <div
            v-if="activeMode === 'standard'"
            class="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#3587CE] text-white flex items-center justify-center shadow-xs"
          >
            <Check class="w-4 h-4" />
          </div>

          <!-- Mode Illustration: Icon_Standar Mode.png -->
          <div class="w-36 h-28 flex items-center justify-center mb-4">
            <img
              src="/Icon_Standar Mode.png"
              alt="Standard Mode Icon"
              class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          <!-- Content -->
          <div class="space-y-3 w-full">
            <h3 class="text-xl font-bold text-[#3587CE]">
              Standard Mode
            </h3>

            <ul class="text-xs text-slate-600 space-y-1.5 text-left max-w-xs mx-auto">
              <li class="flex items-start gap-2">
                <Check class="w-4 h-4 text-[#3587CE] shrink-0 mt-0.5" />
                <span>Visual, animasi, dan narasi</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-4 h-4 text-[#3587CE] shrink-0 mt-0.5" />
                <span>untuk pengalaman belajar yang lebih lengkap.</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 2. Focus Mode Card -->
        <div
          @click="activeMode = 'focus'"
          :class="[
            'rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center relative group',
            activeMode === 'focus'
              ? 'border-[#FF7315] bg-[#FFF8F2] shadow-lg shadow-orange-500/10 scale-[1.02]'
              : 'border-slate-100 bg-[#FAFDFE] hover:border-orange-200 hover:bg-white'
          ]"
        >
          <!-- Active Selection Checkmark Badge -->
          <div
            v-if="activeMode === 'focus'"
            class="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#FF7315] text-white flex items-center justify-center shadow-xs"
          >
            <Check class="w-4 h-4" />
          </div>

          <!-- Mode Illustration: Icon_Focus Mode.png -->
          <div class="w-36 h-28 flex items-center justify-center mb-4">
            <img
              src="/Icon_Focus Mode.png"
              alt="Focus Mode Icon"
              class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          <!-- Content -->
          <div class="space-y-3 w-full">
            <h3 class="text-xl font-bold text-[#FF7315]">
              Focus Mode
            </h3>

            <ul class="text-xs text-slate-600 space-y-1.5 text-left max-w-xs mx-auto">
              <li class="flex items-start gap-2">
                <Check class="w-4 h-4 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Tampilan lebih sederhana</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-4 h-4 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Gerakan lebih lambat</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-4 h-4 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Distraksi lebih sedikit</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-4 h-4 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Kontras lebih jelas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Action Button Lanjutkan -->
      <div class="pt-4">
        <button
          @click="handleContinue"
          class="inline-flex items-center gap-2.5 px-10 py-3 rounded-full bg-[#FF7315] hover:bg-[#E86105] text-white font-bold text-sm shadow-lg shadow-[#FF7315]/25 transition active:scale-95 cursor-pointer"
        >
          Lanjutkan
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
