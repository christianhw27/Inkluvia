<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Sun,
  Check,
  Lock,
  X,
  HelpCircle,
  Video
} from '@lucide/vue'
import { currentUser } from '../lib/authService'

const props = defineProps({
  materi: {
    type: Object,
    required: true
  },
  initialMode: {
    type: String,
    default: 'standard' // 'standard' | 'slow' | 'high_contrast' | 'focus'
  }
})

const emit = defineEmits(['back', 'finish', 'open-settings'])

// Active Mode State
const currentMode = ref(props.initialMode || 'standard')

// Active Right View ('video' | 'assessment')
const activeRightView = ref('video')

// Video Player State
const videoRef = ref(null)
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(180)
const playbackRate = ref(currentMode.value === 'slow' || currentMode.value === 'focus' ? 0.75 : 1.0)
const showSubtitles = ref(true)

// Assessment & Quiz State
const isVideoCompleted = ref(false)
const selectedAnswers = ref({})
const quizFinished = ref(false)
const quizScore = ref(0)

const quizQuestions = computed(() => {
  if (props.materi?.assessment?.questions?.length) {
    return props.materi.assessment.questions
  }
  return [
    {
      id: 'def-1',
      questionText: `Apa perubahan wujud yang terjadi pada materi "${props.materi?.title || 'ini'}"?`,
      options: ['Mencair (Padat ke Cair)', 'Membeku (Cair ke Padat)', 'Menguap (Cair ke Gas)', 'Sublimasi (Padat ke Gas)'],
      correctOptionIndex: 0
    },
    {
      id: 'def-2',
      questionText: 'Apa faktor utama yang menyebabkan es batu dapat mencair?',
      options: ['Suhu dingin', 'Suhu panas / energi kalor', 'Angin kencang', 'Cahaya redup'],
      correctOptionIndex: 1
    },
    {
      id: 'def-3',
      questionText: 'Manakah contoh peristiwa mencair dalam kehidupan sehari-hari?',
      options: ['Air disimpan di freezer', 'Es krim meleleh di bawah sinar matahari', 'Embun di pagi hari', 'Kapur barus mengecil'],
      correctOptionIndex: 1
    }
  ]
})

const handleVideoEnded = () => {
  isPlaying.value = false
  isVideoCompleted.value = true
}

const openQuiz = () => {
  if (!isVideoCompleted.value) return
  activeRightView.value = 'assessment'
}

const resetQuiz = () => {
  selectedAnswers.value = {}
  quizFinished.value = false
  quizScore.value = 0
}

const submitQuiz = () => {
  let correctCount = 0
  const questions = quizQuestions.value
  questions.forEach((q, idx) => {
    if (selectedAnswers.value[idx] === q.correctOptionIndex) {
      correctCount++
    }
  })
  quizScore.value = Math.round((correctCount / questions.length) * 100)
  quizFinished.value = true
}

// Mode change watcher -> set playback rate
watch(currentMode, (newMode) => {
  if (newMode === 'slow' || newMode === 'focus') {
    playbackRate.value = 0.75
  } else {
    playbackRate.value = 1.0
  }
  if (videoRef.value) {
    videoRef.value.playbackRate = playbackRate.value
  }
})

// Active Mode Content object from materi
const activeContent = computed(() => {
  if (currentMode.value === 'slow') {
    return props.materi.slowContent || {
      title: `${props.materi.title || ''} (Slow Mode)`,
      text: props.materi.description || 'Penjelasan diputar dengan tempo lebih lambat.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    }
  }
  if (currentMode.value === 'high_contrast') {
    return props.materi.highContrastContent || {
      title: props.materi.title?.toUpperCase() || 'HIGH CONTRAST MODE',
      text: props.materi.description?.toUpperCase() || 'HURUF BESAR KONTRAS TINGGI',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    }
  }
  if (currentMode.value === 'focus') {
    return props.materi.focusContent || {
      title: props.materi.title || 'Focus Mode',
      text: props.materi.description || 'Tampilan sederhana bebas distraksi.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
    }
  }
  // Standard
  return props.materi.standardContent || {
    title: props.materi.title || 'Standar Mode',
    text: props.materi.description || 'Penjelasan materi lengkap.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  }
})

// Video Source
const activeVideoSource = computed(() => {
  const url = activeContent.value?.videoUrl
  if (url && url.startsWith('http')) return url
  const samples = {
    standard: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    slow: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    high_contrast: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    focus: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
  }
  return samples[currentMode.value] || samples.standard
})

// Player controls
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
    Math.min(videoRef.value.duration || 180, videoRef.value.currentTime + seconds)
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
    // Auto unlock assessment when video reaches near end (last 3s or finished)
    if (duration.value > 0 && currentTime.value >= duration.value - 3) {
      isVideoCompleted.value = true
    }
  }
}

const handleSeek = (e) => {
  if (!videoRef.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const pos = (e.clientX - rect.left) / rect.width
  videoRef.value.currentTime = pos * (videoRef.value.duration || 180)
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

const studentName = computed(() => currentUser.value?.name || 'Teman Belajar')
</script>

<template>
  <div class="w-full flex flex-col flex-1 pt-4 sm:pt-6 pb-12 px-4 sm:px-6 lg:px-10 space-y-4 sm:space-y-5">
    <div class="w-full max-w-[1440px] mx-auto space-y-4 sm:space-y-5">
    <!-- 1. TOP NAVIGATION HEADER -->
    <div class="bg-white rounded-2xl px-4 sm:px-6 py-3.5 border border-slate-100/90 shadow-sm flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
      <!-- Back + Title -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <button
          @click="emit('back')"
          class="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-[#0F3261] transition cursor-pointer shrink-0"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-[#0F3261] truncate">
            {{ materi.title }}
          </h1>
          <p class="text-[11px] text-slate-400 truncate">
            {{ materi.level }}
          </p>
        </div>
      </div>

      <!-- Static Mode Badge (Terunci Sesuai Pilihan Awal) -->
      <div class="shrink-0">
        <span
          :class="[
            'px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border shadow-xs',
            currentMode === 'standard' ? 'bg-blue-50 text-[#3587CE] border-blue-200'
              : currentMode === 'slow' ? 'bg-purple-50 text-purple-700 border-purple-200'
              : currentMode === 'high_contrast' ? 'bg-yellow-400 text-slate-950 border-yellow-500 font-black'
              : 'bg-orange-50 text-[#FF7315] border-orange-200'
          ]"
        >
          <Sparkles v-if="currentMode === 'standard'" class="w-3.5 h-3.5" />
          <span v-else-if="currentMode === 'slow'">🐢</span>
          <span v-else-if="currentMode === 'high_contrast'">👁️</span>
          <Sun v-else class="w-3.5 h-3.5" />
          <span>
            Mode: {{
              currentMode === 'standard' ? 'Standar' :
              currentMode === 'slow' ? 'Slow' :
              currentMode === 'high_contrast' ? 'High Contrast' : 'Focus'
            }}
          </span>
        </span>
      </div>

      <!-- User Chip & Settings Quick Trigger -->
      <div class="flex items-center gap-2 pl-3 border-l border-slate-100 shrink-0">
        <span class="text-xs font-bold text-slate-600 hidden sm:block">Hai, {{ studentName }}!</span>
        <button
          type="button"
          @click="emit('open-settings', 'profile')"
          title="Buka Pengaturan & Profil"
          class="relative w-9 h-9 rounded-full border-2 border-[#3DA5FF] overflow-hidden flex items-center justify-center text-base hover:scale-105 active:scale-95 transition cursor-pointer shadow-sm focus:outline-none ring-2 ring-transparent hover:ring-[#3DA5FF]/40"
          style="background: linear-gradient(135deg,#EAF3FD,#c3dff7);"
        >
          {{ currentUser?.avatar || '👧' }}
        </button>
      </div>
    </div>

    <!-- 2. MAIN LEARNING PLAYER GRID -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      
      <!-- LEFT SIDEBAR: Navigasi Tab, Poin Belajar & Asesmen (4 Kolom) -->
      <div class="lg:col-span-4 space-y-4">
        
        <!-- Tombol Navigasi Video di Bagian Atas Sidebar -->
        <button
          @click="activeRightView = 'video'"
          :class="[
            'w-full py-3.5 px-5 rounded-3xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-between shadow-sm cursor-pointer border',
            activeRightView === 'video'
              ? 'bg-[#0F3261] text-white border-[#0F3261] ring-2 ring-[#0F3261]/20'
              : 'bg-white text-slate-700 border-slate-200 hover:border-[#3587CE] hover:text-[#3587CE]'
          ]"
        >
          <div class="flex items-center gap-2.5">
            <Video class="w-4 h-4 text-[#3587CE]" />
            <span>Video Pembelajaran</span>
          </div>
          <span
            :class="[
              'text-[10px] px-2.5 py-0.5 rounded-full font-bold',
              activeRightView === 'video' ? 'bg-blue-500/30 text-blue-100' : 'bg-slate-100 text-slate-500'
            ]"
          >
            {{ activeRightView === 'video' ? 'Sedang Dibuka' : 'Buka Video' }}
          </span>
        </button>

        <!-- Card 1: Poin Belajar & Mode Aktif -->
        <div class="bg-white rounded-3xl p-5 border border-slate-100/90 shadow-sm space-y-4">
          <div>
            <h3 class="text-sm font-bold text-[#0F3261] flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-[#FF7315]" />
              Apa yang akan kamu pelajari?
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Poin utama materi ini</p>
          </div>

          <div class="space-y-2.5">
            <div
              v-for="(lp, idx) in (materi.learningPoints || [
                { id: '1', title: 'Mencair (Padat -> Cair)' },
                { id: '2', title: 'Menguap (Cair -> Gas)' },
                { id: '3', title: 'Mengembun (Gas -> Cair)' }
              ])"
              :key="lp.id || idx"
              class="p-3.5 rounded-2xl bg-[#F0F7FE] border border-[#3DA5FF]/20 flex items-center gap-3"
            >
              <span class="w-7 h-7 rounded-xl bg-[#3587CE] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {{ idx + 1 }}
              </span>
              <span class="text-xs font-bold text-[#0F3261] leading-tight">
                {{ lp.title }}
              </span>
            </div>
          </div>

          <!-- Mode Indicator Box in Sidebar -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <p class="font-bold text-slate-700">Mode Belajar Aktif:</p>
            <p v-if="currentMode === 'standard'" class="text-[#3587CE] font-semibold">
              ✨ Standar Mode: Pengalaman belajar interaktif dengan animasi dan audio jernih.
            </p>
            <p v-else-if="currentMode === 'slow'" class="text-purple-700 font-semibold">
              🐢 Slow Mode: Artikulasi bertahap dan jeda terukur untuk pemahaman optimal.
            </p>
            <p v-else-if="currentMode === 'high_contrast'" class="text-slate-900 font-bold">
              👁️ High Contrast Mode: Teks besar kontras tinggi untuk kenyamanan penglihatan.
            </p>
            <p v-else class="text-[#FF7315] font-semibold">
              ☀️ Focus Mode: Tampilan sederhana, bebas distraksi, dan tempo tenang.
            </p>
          </div>
        </div>

        <!-- Card 2: Asesmen Card (Terbuka setelah video selesai) -->
        <div
          :class="[
            'bg-white rounded-3xl p-5 border shadow-sm transition-all duration-300 space-y-3 relative overflow-hidden',
            isVideoCompleted ? 'border-emerald-300 ring-2 ring-emerald-400/20' : 'border-slate-200/90'
          ]"
        >
          <!-- Header Badge & Title -->
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-[#0F3261] flex items-center gap-2">
              <span v-if="isVideoCompleted" class="text-base">✍️</span>
              <Lock v-else class="w-4 h-4 text-slate-400" />
              Asesmen Pemahaman
            </h3>
            <span
              :class="[
                'px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1',
                isVideoCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              ]"
            >
              <CheckCircle2 v-if="isVideoCompleted" class="w-3.5 h-3.5" />
              <Lock v-else class="w-3 h-3" />
              {{ isVideoCompleted ? 'Terbuka' : 'Terkunci' }}
            </span>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed">
            <template v-if="isVideoCompleted">
              Hebat! Kamu telah menyelesaikan video. Yuk, kerjakan kuis singkat untuk menguji pemahamanmu!
            </template>
            <template v-else>
              Asesmen kuis ini akan terbuka secara otomatis setelah kamu menonton video hingga selesai.
            </template>
          </p>

          <!-- Action Button (Satu-satunya tombol asesmen) -->
          <button
            @click="activeRightView = 'assessment'"
            :disabled="!isVideoCompleted"
            :class="[
              'w-full py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm',
              isVideoCompleted
                ? activeRightView === 'assessment'
                  ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400/40 cursor-default'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 cursor-pointer active:scale-95 shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            ]"
          >
            <template v-if="isVideoCompleted">
              <span v-if="activeRightView === 'assessment'" class="flex items-center gap-1.5">
                ✍️ Sedang Dikerjakan di Sebelah Kanan
              </span>
              <span v-else class="flex items-center gap-1.5">
                ✍️ Kerjakan Asesmen ({{ quizQuestions.length }} Soal)
              </span>
            </template>
            <span v-else class="flex items-center gap-1.5">
              <Lock class="w-3.5 h-3.5" />
              Tonton Video Dulu
            </span>
          </button>
        </div>
      </div>

      <!-- RIGHT SIDE: VIDEO PLAYER OR GOOGLE FORM-STYLE ASSESSMENT (8 Kolom) -->
      <div class="lg:col-span-8 space-y-4">
        
        <!-- VIEW 1: VIDEO PLAYER (Default) -->
        <div v-if="activeRightView === 'video'" class="space-y-4">
          <!-- Active Mode Banner -->
          <div
            :class="[
              'p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all duration-300',
              currentMode === 'focus'
                ? 'bg-[#FFF9F3] border-[#FF7315]/40 text-[#E86105]'
                : currentMode === 'slow'
                  ? 'bg-purple-50 border-purple-300 text-purple-800'
                  : currentMode === 'high_contrast'
                    ? 'bg-slate-950 border-yellow-400 text-yellow-300'
                    : 'bg-[#F2F8FE] border-[#3DA5FF]/40 text-[#3587CE]'
            ]"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full animate-ping"
                :class="
                  currentMode === 'focus'
                    ? 'bg-[#FF7315]'
                    : currentMode === 'slow'
                      ? 'bg-purple-600'
                      : currentMode === 'high_contrast'
                        ? 'bg-yellow-400'
                        : 'bg-[#3587CE]'
                "
              ></span>
              <span>
                Aktif: <strong>
                  {{
                    currentMode === 'focus'
                      ? 'Focus Mode (Tampilan Sederhana & Bebas Distraksi)'
                      : currentMode === 'slow'
                        ? 'Slow Mode (Tempo Terukur & Artikulasi Bertahap)'
                        : currentMode === 'high_contrast'
                          ? 'High Contrast Mode (Visual Kontras Tinggi & Teks Besar)'
                          : 'Standar Mode (Visual & Animasi Lengkap)'
                  }}
                </strong>
              </span>
            </div>
            <span class="text-[11px] font-mono opacity-80 hidden sm:inline">
              Speed: {{ playbackRate }}x
            </span>
          </div>

          <!-- VIDEO PLAYER FRAME -->
          <div
            :class="[
              'relative rounded-3xl overflow-hidden shadow-xl transition-all duration-300 border',
              currentMode === 'high_contrast'
                ? 'bg-black border-yellow-400 ring-2 ring-yellow-400/40'
                : currentMode === 'focus'
                  ? 'bg-black border-[#FF7315] ring-2 ring-[#FF7315]/30'
                  : 'bg-slate-950 border-slate-800'
            ]"
          >
            <div class="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
              <!-- Video Element -->
              <video
                ref="videoRef"
                :src="activeVideoSource"
                @timeupdate="handleTimeUpdate"
                @ended="handleVideoEnded"
                class="w-full h-full object-contain cursor-pointer"
                @click="togglePlay"
                playsinline
              ></video>

              <!-- Big Center Play Button Overlay (when paused) -->
              <div
                v-if="!isPlaying"
                class="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                @click="togglePlay"
              >
                <div class="w-16 h-16 rounded-full bg-[#FF7315] text-white flex items-center justify-center pl-1 shadow-2xl animate-pulse">
                  <Play class="w-8 h-8 fill-white" />
                </div>
              </div>

              <!-- Subtitle Overlay -->
              <div
                v-if="showSubtitles"
                class="absolute bottom-16 inset-x-4 flex justify-center pointer-events-none"
              >
                <div
                  :class="[
                    'px-4 py-2 rounded-xl text-center transition-all duration-200 shadow-md',
                    currentMode === 'high_contrast'
                      ? 'bg-black/95 text-yellow-300 font-black text-base sm:text-lg border-2 border-yellow-400 max-w-xl'
                      : currentMode === 'focus'
                        ? 'bg-black/90 text-yellow-300 font-extrabold text-sm sm:text-base border-2 border-yellow-400 max-w-xl'
                        : 'bg-slate-950/75 text-white font-medium text-xs sm:text-sm max-w-lg'
                  ]"
                >
                  {{ activeContent.text }}
                </div>
              </div>

              <!-- Custom Video Controls Overlay -->
              <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 text-white space-y-2">
                <!-- Seekbar -->
                <div
                  @click="handleSeek"
                  class="w-full h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer overflow-hidden transition-all flex items-center"
                >
                  <div
                    class="h-full bg-[#FF7315] transition-all duration-100"
                    :style="{ width: `${(currentTime / duration) * 100}%` }"
                  ></div>
                </div>

                <!-- Bottom Control Buttons -->
                <div class="flex items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-2 sm:gap-3">
                    <button
                      @click="togglePlay"
                      class="p-1.5 hover:text-[#FF7315] transition cursor-pointer"
                    >
                      <Pause v-if="isPlaying" class="w-4 h-4" />
                      <Play v-else class="w-4 h-4 fill-current" />
                    </button>

                    <button
                      @click="seekRelative(-10)"
                      class="p-1.5 hover:text-[#FF7315] transition cursor-pointer"
                      title="Mundur 10 detik"
                    >
                      <RotateCcw class="w-4 h-4" />
                    </button>

                    <button
                      @click="seekRelative(10)"
                      class="p-1.5 hover:text-[#FF7315] transition cursor-pointer"
                      title="Maju 10 detik"
                    >
                      <RotateCw class="w-4 h-4" />
                    </button>

                    <button
                      @click="toggleMute"
                      class="p-1.5 hover:text-[#FF7315] transition cursor-pointer"
                    >
                      <VolumeX v-if="isMuted" class="w-4 h-4" />
                      <Volume2 v-else class="w-4 h-4" />
                    </button>

                    <span class="font-mono text-[11px] text-slate-300">
                      {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 sm:gap-3 font-semibold">
                    <div class="hidden sm:flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 text-[11px]">
                      <span>Speed:</span>
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

          <!-- CONTENT DESCRIPTION CARD -->
          <div
            :class="[
              'rounded-3xl p-5 sm:p-6 border shadow-sm transition-all duration-300 space-y-4',
              currentMode === 'high_contrast'
                ? 'bg-slate-950 border-yellow-400 text-yellow-300'
                : currentMode === 'focus'
                  ? 'bg-[#FFFDFB] border-[#FF7315]/30 ring-1 ring-amber-100'
                  : 'bg-white border-slate-100'
            ]"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="space-y-2 max-w-xl text-left">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-bold inline-block',
                    currentMode === 'high_contrast' ? 'bg-yellow-400 text-slate-950 font-black'
                      : currentMode === 'focus' ? 'bg-amber-100 text-[#E86105]'
                      : currentMode === 'slow' ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-[#3587CE]'
                  ]"
                >
                  {{ activeContent.title }}
                </span>

                <p
                  :class="[
                    'leading-relaxed',
                    currentMode === 'high_contrast'
                      ? 'text-base sm:text-lg text-white font-extrabold uppercase'
                      : currentMode === 'focus'
                        ? 'text-sm sm:text-base text-slate-800 font-medium'
                        : 'text-xs sm:text-sm text-slate-600'
                  ]"
                >
                  {{ activeContent.text }}
                </p>
              </div>

              <!-- Complete Learning Button -->
              <button
                @click="emit('finish')"
                class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#FF7315] hover:bg-[#E86105] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#FF7315]/25 transition active:scale-95 shrink-0 cursor-pointer"
              >
                <CheckCircle2 class="w-5 h-5" />
                Selesai Belajar
              </button>
            </div>
          </div>
        </div>

        <!-- VIEW 2: INLINE GOOGLE FORM-STYLE ASSESSMENT (Menggantikan posisi video) -->
        <div v-else-if="activeRightView === 'assessment'" class="space-y-4">
          
          <!-- Form Header Card (Google Form style top banner) -->
          <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm">
            <div class="h-3.5 bg-gradient-to-r from-[#0F3261] via-[#3587CE] to-indigo-600"></div>
            <div class="p-6 sm:p-7 space-y-3">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1.5">
                  ✍️ Form Asesmen & Kuis Siswa
                </span>
                <button
                  type="button"
                  @click="activeRightView = 'video'"
                  class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Video class="w-4 h-4 text-[#3587CE]" />
                  Kembali ke Video
                </button>
              </div>

              <h2 class="text-xl sm:text-2xl font-black text-[#0F3261]">
                {{ materi.assessment?.title || 'Asesmen Pemahaman Materi' }}
              </h2>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pilihlah satu jawaban yang paling tepat untuk setiap pertanyaan di bawah ini untuk menguji pemahamanmu.
              </p>
              
              <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100 flex-wrap">
                <span class="flex items-center gap-1">📚 Materi: <strong class="text-slate-800">{{ materi.title }}</strong></span>
                <span class="flex items-center gap-1">👤 Siswa: <strong class="text-slate-800">{{ studentName }}</strong></span>
                <span class="flex items-center gap-1">📝 Jumlah: <strong class="text-slate-800">{{ quizQuestions.length }} Soal Pilihan Ganda</strong></span>
              </div>
            </div>
          </div>

          <!-- Active Form (All Questions listed Google Form style) -->
          <form v-if="!quizFinished" @submit.prevent="submitQuiz" class="space-y-4">
            
            <div
              v-for="(q, qIdx) in quizQuestions"
              :key="q.id || qIdx"
              class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4 transition hover:border-indigo-300"
            >
              <!-- Question Card Header -->
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                  Soal {{ qIdx + 1 }} dari {{ quizQuestions.length }}
                </span>
                <span v-if="selectedAnswers[qIdx] !== undefined" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 class="w-3.5 h-3.5" /> Terjawab
                </span>
                <span v-else class="text-xs text-rose-500 font-bold">* Wajib diisi</span>
              </div>

              <!-- Question Text -->
              <h3 class="text-sm sm:text-base font-bold text-[#0F3261] leading-relaxed">
                {{ q.questionText }}
              </h3>

              <!-- Radio Options A, B, C, D (Google Form style) -->
              <div class="space-y-2.5 pt-1">
                <label
                  v-for="(opt, oIdx) in q.options"
                  :key="oIdx"
                  :class="[
                    'flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none',
                    selectedAnswers[qIdx] === oIdx
                      ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-400/30'
                      : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                  ]"
                >
                  <div class="pt-0.5 shrink-0">
                    <input
                      type="radio"
                      :name="`q-${qIdx}`"
                      :value="oIdx"
                      v-model="selectedAnswers[qIdx]"
                      class="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                  </div>
                  <div class="text-xs sm:text-sm leading-snug flex-1">
                    <span class="font-bold mr-1.5 opacity-80">{{ String.fromCharCode(65 + oIdx) }}.</span>
                    {{ opt }}
                  </div>
                </label>
              </div>
            </div>

            <!-- Bottom Action Bar -->
            <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <button
                type="button"
                @click="activeRightView = 'video'"
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Batal / Tonton Video
              </button>

              <button
                type="submit"
                :disabled="Object.keys(selectedAnswers).length < quizQuestions.length"
                :class="[
                  'px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95',
                  Object.keys(selectedAnswers).length === quizQuestions.length
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                ]"
              >
                <CheckCircle2 class="w-5 h-5" />
                Kirim Jawaban Asesmen
              </button>
            </div>
          </form>

          <!-- Result Screen (After submitting Google Form) -->
          <div v-else class="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm text-center space-y-6">
            <div class="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
              🏆
            </div>

            <div>
              <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                Form Asesmen Berhasil Terkirim!
              </span>
              <h3 class="text-2xl font-black text-[#0F3261] mt-3">
                {{ quizScore >= 70 ? 'Luar Biasa, Pemahamanmu Sangat Baik! 🎉' : 'Kerja Bagus! Tetap Semangat Belajar Ya! 💪' }}
              </h3>
              <p class="text-xs text-slate-500 mt-1">
                Jawaban kuis kamu telah berhasil direkam secara rinci.
              </p>
            </div>

            <!-- Score Display Box -->
            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-1">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wide">Nilai Akhir Kamu</p>
              <div class="text-5xl font-black text-[#3587CE]">
                {{ quizScore }} <span class="text-lg font-bold text-slate-400">/ 100</span>
              </div>
              <p class="text-xs text-emerald-600 font-bold pt-1">
                ✓ Berhasil diselesaikan oleh {{ studentName }}
              </p>
            </div>

            <div class="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                @click="resetQuiz"
                class="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Ulangi Kuis
              </button>
              <button
                type="button"
                @click="activeRightView = 'video'"
                class="px-7 py-3 rounded-xl bg-[#0F3261] hover:bg-[#18447d] text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                Kembali ke Video
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</div>
</template>
