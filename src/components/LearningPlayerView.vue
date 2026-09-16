<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Sliders,
  Type,
  BookOpen,
  Volume1,
  Sun
} from '@lucide/vue'
import { currentUser } from '../lib/authService'

const props = defineProps({
  materi: {
    type: Object,
    required: true
  },
  initialMode: {
    type: String,
    default: 'standard' // 'standard' | 'focus'
  }
})

const emit = defineEmits(['back', 'finish'])

// State Mode
const currentMode = ref(props.initialMode)

// Steps
const activeStepIndex = ref(2) // Default step 3 (Air Menguap)

const steps = computed(() => {
  return (
    props.materi.steps || [
      { id: '1', number: 1, title: 'Kenalan dengan Es Batu' },
      { id: '2', number: 2, title: 'Es Batu Mencair' },
      { id: '3', number: 3, title: 'Air Menguap' },
      { id: '4', number: 4, title: 'Uap Mengembun' },
      { id: '5', number: 5, title: 'Yuk Ingat Lagi' }
    ]
  )
})

const currentStep = computed(() => {
  return steps.value[activeStepIndex.value] || steps.value[0]
})

// Video Player DOM & State
const videoRef = ref(null)
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(250) // seconds
const playbackRate = ref(currentMode.value === 'focus' ? 0.75 : 1.0)
const showSubtitles = ref(true)

// Update playback speed when switching mode
watch(currentMode, (newMode) => {
  if (newMode === 'focus') {
    playbackRate.value = 0.75
  } else {
    playbackRate.value = 1.0
  }
  if (videoRef.value) {
    videoRef.value.playbackRate = playbackRate.value
  }
})

// Current Step Content according to Standard vs Focus Mode
const stepContent = computed(() => {
  if (currentMode.value === 'focus') {
    return (
      currentStep.value.focusContent || {
        title: currentStep.value.title,
        text: 'Ketika dipanaskan, air menjadi uap (gas). Ini dinamakan proses menguap.',
        keyPoints: [
          'Air dipanaskan -> Berubah jadi uap air',
          'Wujud berubah dari Cair ke Gas',
          'Uap naik ke udara'
        ],
        videoUrl: currentStep.value.standardContent?.videoUrl || ''
      }
    )
  }
  return (
    currentStep.value.standardContent || {
      title: currentStep.value.title,
      text: 'Ketika dipanaskan, air berubah menjadi uap. Proses ini disebut menguap.',
      keyPoints: [
        'Kalor dari panas menyebabkan molekul air bergerak lebih cepat',
        'Air menguap menjadi gas di atmosfer',
        'Bagian penting dalam siklus hidrologi'
      ],
      videoUrl: ''
    }
  )
})

// Video Source
const activeVideoSource = computed(() => {
  const url = stepContent.value?.videoUrl || props.materi.videoUrl
  if (url && url.startsWith('http')) return url
  // Reliable sample educational video streams
  const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
  ]
  return sampleVideos[activeStepIndex.value % sampleVideos.length]
})

// Player Controls
const togglePlay = () => {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play().then(() => {
      isPlaying.value = true
    }).catch(() => {})
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
}

const toggleMute = () => {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

const seekRelative = (seconds) => {
  if (!videoRef.value) return
  videoRef.value.currentTime = Math.max(
    0,
    Math.min(videoRef.value.duration || 250, videoRef.value.currentTime + seconds)
  )
}

const setSpeed = (speed) => {
  playbackRate.value = speed
  if (videoRef.value) {
    videoRef.value.playbackRate = speed
  }
}

const handleTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
    if (videoRef.value.duration) {
      duration.value = videoRef.value.duration
    }
  }
}

const handleSeek = (e) => {
  if (!videoRef.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const pos = (e.clientX - rect.left) / rect.width
  videoRef.value.currentTime = pos * (videoRef.value.duration || 250)
}

const toggleFullscreen = () => {
  if (!videoRef.value) return
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  } else {
    videoRef.value.requestFullscreen().catch(() => {})
  }
}

const formatTime = (secs) => {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const progressPercent = computed(() => {
  return Math.round(((activeStepIndex.value + 1) / steps.value.length) * 100)
})

const nextStep = () => {
  if (activeStepIndex.value < steps.value.length - 1) {
    activeStepIndex.value++
    currentTime.value = 0
    if (videoRef.value) {
      videoRef.value.currentTime = 0
      videoRef.value.play().then(() => { isPlaying.value = true }).catch(() => {})
    }
  } else {
    emit('finish')
  }
}

const goToStep = (index) => {
  activeStepIndex.value = index
  currentTime.value = 0
  if (videoRef.value) {
    videoRef.value.currentTime = 0
    videoRef.value.play().then(() => { isPlaying.value = true }).catch(() => {})
  }
}

// Student Name
const studentName = computed(() => {
  return currentUser.value?.name || 'Dini'
})
</script>

<template>
  <div class="space-y-5 max-w-6xl mx-auto py-2">
    <!-- 1. TOP HEADER BAR -->
    <div class="bg-white rounded-2xl px-4 sm:px-6 py-3.5 border border-slate-100/90 shadow-sm flex items-center gap-3">
      <!-- Back + Title (Left) -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <button
          @click="emit('back')"
          class="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-[#0F3261] transition cursor-pointer shrink-0"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-[#0F3261] truncate">
            {{ materi.title }}
          </h1>
          <p class="text-[10px] text-slate-400 truncate">
            {{ materi.level }}
          </p>
        </div>
      </div>

      <!-- Mode Switcher (Center) -->
      <div class="inline-flex p-1 bg-slate-100 rounded-full text-xs font-semibold shadow-inner shrink-0">
        <button
          @click="currentMode = 'standard'"
          :class="[
            'px-3 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer',
            currentMode === 'standard'
              ? 'bg-[#3587CE] text-white shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800'
          ]"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Standard</span>
        </button>
        <button
          @click="currentMode = 'focus'"
          :class="[
            'px-3 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer',
            currentMode === 'focus'
              ? 'bg-[#FF7315] text-white shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800'
          ]"
        >
          <Sun class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Focus</span>
        </button>
      </div>

      <!-- User Avatar (Right) -->
      <div class="flex items-center gap-2.5 pl-3 border-l border-slate-100 shrink-0">
        <span class="text-xs font-bold text-slate-600 hidden sm:block">Hai, {{ studentName }}!</span>
        <div
          class="w-9 h-9 rounded-full border-2 border-[#3DA5FF] overflow-hidden flex items-center justify-center text-base"
          style="background: linear-gradient(135deg,#EAF3FD,#c3dff7);"
        >
          {{ currentUser?.avatar || '👧' }}
        </div>
      </div>
    </div>

    <!-- 2. MAIN LEARNING PLAYER GRID -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- SIDEBAR ALUR BELAJAR (4 Kolom) -->
      <div class="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-100/90 shadow-xs space-y-4">
        <!-- Progress Bar -->
        <div class="space-y-1.5 pb-3 border-b border-slate-100">
          <div class="flex items-center justify-between text-xs font-bold text-[#0F3261]">
            <span>Alur Belajar</span>
            <span>{{ activeStepIndex + 1 }}/{{ steps.length }} ({{ progressPercent }}%)</span>
          </div>
          <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-[#3DA5FF] to-[#3587CE] transition-all duration-300 rounded-full"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Steps List -->
        <div class="space-y-2">
          <button
            v-for="(st, idx) in steps"
            :key="st.id || idx"
            @click="goToStep(idx)"
            :class="[
              'w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer border',
              idx === activeStepIndex
                ? currentMode === 'focus'
                  ? 'bg-[#FFF8F2] border-[#FF7315] shadow-xs'
                  : 'bg-[#F0F7FE] border-[#3DA5FF] shadow-xs'
                : idx < activeStepIndex
                  ? 'bg-white border-slate-100 hover:bg-slate-50'
                  : 'bg-slate-50/50 border-slate-100/60 opacity-60 hover:opacity-100'
            ]"
          >
            <div class="flex items-center gap-3">
              <!-- Number Pill -->
              <span
                :class="[
                  'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 shadow-xs',
                  idx < activeStepIndex
                    ? 'bg-emerald-500 text-white'
                    : idx === activeStepIndex
                      ? currentMode === 'focus'
                        ? 'bg-[#FF7315] text-white'
                        : 'bg-[#3587CE] text-white'
                      : 'bg-slate-200 text-slate-600'
                ]"
              >
                {{ idx + 1 }}
              </span>

              <span
                :class="[
                  'text-xs font-bold truncate max-w-[150px] sm:max-w-[180px]',
                  idx === activeStepIndex ? 'text-[#0F3261]' : 'text-slate-700'
                ]"
              >
                {{ st.title }}
              </span>
            </div>

            <!-- Status Indicator -->
            <div class="shrink-0">
              <Check v-if="idx < activeStepIndex" class="w-4 h-4 text-emerald-500 font-bold" />
              <Play v-else-if="idx === activeStepIndex" class="w-4 h-4 text-[#3587CE] fill-current" />
              <Lock v-else class="w-4 h-4 text-slate-300" />
            </div>
          </button>
        </div>
      </div>

      <!-- VIDEO MEDIA & CONTENT DETAILS (8 Kolom) -->
      <div class="lg:col-span-8 space-y-4">
        <!-- Notification Banner per Mode -->
        <div
          :class="[
            'p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all duration-300',
            currentMode === 'focus'
              ? 'bg-[#FFF9F3] border-[#FF7315]/40 text-[#E86105]'
              : 'bg-[#F2F8FE] border-[#3DA5FF]/40 text-[#3587CE]'
          ]"
        >
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :class="currentMode === 'focus' ? 'bg-[#FF7315] animate-ping' : 'bg-[#3587CE] animate-ping'"></span>
            <span>
              Aktif: <strong>{{ currentMode === 'focus' ? 'Focus Mode (Penyederhanaan & Kontras Jelas)' : 'Standard Mode (Visual & Animasi Lengkap)' }}</strong>
            </span>
          </div>
          <span class="text-[11px] font-mono opacity-80 hidden sm:inline">
            Speed: {{ playbackRate }}x
          </span>
        </div>

        <!-- REAL HTML5 VIDEO PLAYER FRAME -->
        <div
          :class="[
            'relative rounded-3xl overflow-hidden shadow-xl transition-all duration-300 border',
            currentMode === 'focus'
              ? 'bg-black border-[#FF7315] ring-2 ring-[#FF7315]/30'
              : 'bg-slate-950 border-slate-800'
          ]"
        >
          <div class="relative w-full aspect-16/9 bg-black flex items-center justify-center overflow-hidden">
            <!-- Video Element -->
            <video
              ref="videoRef"
              :src="activeVideoSource"
              @timeupdate="handleTimeUpdate"
              @ended="nextStep"
              class="w-full h-full object-contain cursor-pointer"
              @click="togglePlay"
              playsinline
            ></video>

            <!-- Big Center Play Button Overlay (when paused) -->
            <div
              v-if="!isPlaying"
              class="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"
            >
              <div class="w-16 h-16 rounded-full bg-[#FF7315] text-white flex items-center justify-center pl-1 shadow-2xl animate-pulse">
                <Play class="w-8 h-8 fill-white" />
              </div>
            </div>

            <!-- Subtitle / Caption Overlay (Differing in Focus vs Standard Mode) -->
            <div
              v-if="showSubtitles"
              class="absolute bottom-16 inset-x-4 flex justify-center pointer-events-none"
            >
              <div
                :class="[
                  'px-4 py-2 rounded-xl text-center transition-all duration-200 shadow-md',
                  currentMode === 'focus'
                    ? 'bg-black/90 text-yellow-300 font-extrabold text-sm sm:text-base border-2 border-yellow-400 max-w-xl'
                    : 'bg-slate-950/75 text-white font-medium text-xs sm:text-sm max-w-lg'
                ]"
              >
                {{ stepContent.text }}
              </div>
            </div>

            <!-- Custom Video Educational Controls Bar -->
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 sm:p-4 flex flex-col gap-2">
              <!-- Scrubbable Timeline Progress -->
              <div
                @click="handleSeek"
                class="w-full h-2 bg-white/20 hover:h-2.5 rounded-full overflow-hidden cursor-pointer transition-all relative group"
              >
                <div
                  class="h-full bg-[#FF7315] rounded-full transition-all"
                  :style="{ width: `${(currentTime / (duration || 250)) * 100}%` }"
                ></div>
              </div>

              <!-- Media Control Buttons -->
              <div class="flex items-center justify-between text-white text-xs">
                <!-- Left Playback Buttons -->
                <div class="flex items-center gap-3">
                  <button
                    @click="togglePlay"
                    class="p-1 hover:text-[#FF7315] transition cursor-pointer"
                    :title="isPlaying ? 'Pause' : 'Play'"
                  >
                    <component :is="isPlaying ? Pause : Play" class="w-5 h-5 fill-current" />
                  </button>

                  <button
                    @click="seekRelative(-5)"
                    class="p-1 hover:text-[#FF7315] transition cursor-pointer"
                    title="Mundur 5 detik"
                  >
                    <RotateCcw class="w-4 h-4" />
                  </button>

                  <button
                    @click="seekRelative(5)"
                    class="p-1 hover:text-[#FF7315] transition cursor-pointer"
                    title="Maju 5 detik"
                  >
                    <RotateCw class="w-4 h-4" />
                  </button>

                  <button
                    @click="toggleMute"
                    class="p-1 hover:text-[#FF7315] transition cursor-pointer"
                  >
                    <component :is="isMuted ? VolumeX : Volume2" class="w-4 h-4" />
                  </button>

                  <span class="text-[11px] font-mono text-slate-300">
                    {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                  </span>
                </div>

                <!-- Right Utility Buttons -->
                <div class="flex items-center gap-2.5">
                  <!-- Speed Selector Buttons -->
                  <div class="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      @click="setSpeed(0.75)"
                      :class="playbackRate === 0.75 ? 'text-[#FF7315]' : 'text-slate-300 hover:text-white'"
                      class="cursor-pointer"
                    >
                      0.75x
                    </button>
                    <span class="text-white/40">|</span>
                    <button
                      @click="setSpeed(1.0)"
                      :class="playbackRate === 1.0 ? 'text-[#3587CE]' : 'text-slate-300 hover:text-white'"
                      class="cursor-pointer"
                    >
                      1.0x
                    </button>
                    <span class="text-white/40">|</span>
                    <button
                      @click="setSpeed(1.25)"
                      :class="playbackRate === 1.25 ? 'text-emerald-400' : 'text-slate-300 hover:text-white'"
                      class="cursor-pointer"
                    >
                      1.25x
                    </button>
                  </div>

                  <!-- Subtitle Toggle -->
                  <button
                    @click="showSubtitles = !showSubtitles"
                    :class="[
                      'px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer',
                      showSubtitles
                        ? 'border-[#FF7315] text-[#FF7315] bg-[#FF7315]/10'
                        : 'border-white/30 text-white/60'
                    ]"
                  >
                    CC
                  </button>

                  <!-- Fullscreen -->
                  <button
                    @click="toggleFullscreen"
                    class="p-1 hover:text-[#FF7315] transition cursor-pointer"
                  >
                    <Maximize2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. LEARNING CONTENT & SUMMARY BOX (DIFFERING BY MODE) -->
        <div
          :class="[
            'rounded-3xl p-5 sm:p-6 border shadow-xs transition-all duration-300 space-y-4',
            currentMode === 'focus'
              ? 'bg-[#FFFDFB] border-[#FF7315]/30 ring-1 ring-amber-100'
              : 'bg-white border-slate-100'
          ]"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1.5 max-w-xl text-left">
              <!-- Mode Tag -->
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block',
                  currentMode === 'focus'
                    ? 'bg-amber-100 text-[#E86105]'
                    : 'bg-blue-100 text-[#3587CE]'
                ]"
              >
                {{ currentMode === 'focus' ? 'Poin Kunci Fokus' : 'Rangkuman Materi' }}
              </span>

              <h2
                :class="[
                  'font-bold tracking-tight',
                  currentMode === 'focus'
                    ? 'text-xl sm:text-2xl text-[#0F3261]'
                    : 'text-lg sm:text-xl text-[#0F3261]'
                ]"
              >
                {{ stepContent.title }}
              </h2>

              <p
                :class="[
                  'leading-relaxed',
                  currentMode === 'focus'
                    ? 'text-sm sm:text-base text-slate-800 font-medium'
                    : 'text-xs sm:text-sm text-slate-600'
                ]"
              >
                {{ stepContent.text }}
              </p>
            </div>

            <!-- Next Step Action Button -->
            <button
              @click="nextStep"
              class="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#FF7315] hover:bg-[#E86105] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#FF7315]/25 transition active:scale-95 shrink-0 cursor-pointer"
            >
              {{ activeStepIndex < steps.length - 1 ? 'Lanjut' : 'Selesai Belajar' }}
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>

          <!-- Focus Mode Highlights Checklist -->
          <div
            v-if="currentMode === 'focus' && stepContent.keyPoints"
            class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-left space-y-2"
          >
            <h4 class="text-xs font-bold text-[#E86105] flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5" />
              Hal Penting yang Perlu Diingat:
            </h4>
            <ul class="space-y-1.5 text-xs text-slate-800 font-medium">
              <li
                v-for="(pt, idx) in stepContent.keyPoints"
                :key="idx"
                class="flex items-start gap-2"
              >
                <span class="w-4 h-4 rounded-full bg-[#FF7315] text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                  {{ idx + 1 }}
                </span>
                <span>{{ pt }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
