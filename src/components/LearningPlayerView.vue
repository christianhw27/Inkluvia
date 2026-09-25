<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  XCircle,
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
  Video,
  Trophy,
  Clock,
  Award,
  Medal,
  ChevronRight,
  User,
  Star
} from '@lucide/vue'
import { currentUser } from '../lib/authService'
import { RELIABLE_MODE_VIDEOS, sanitizeVideoUrl } from '../lib/materiService'
import {
  formatDuration,
  getUserMateriHighScore,
  saveQuizAttempt,
  getMateriLeaderboard,
  fetchMateriLeaderboardFromSupabase,
  submitToMateriLeaderboard
} from '../lib/quizService'
import { playMascotChime, playButtonPop } from '../lib/soundEffects'

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

// Active Right View ('video' | 'assessment' | 'leaderboard')
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
const showVideoRequiredModal = ref(false)
const selectedAnswers = ref({})
const quizFinished = ref(false)
const quizUserScore = ref(0)
const quizCorrectCount = ref(0)
const quizResultsList = ref([])
const quizDurationSeconds = ref(0)
const quizSeconds = ref(0)
let quizTimerInterval = null

// High Score & Leaderboard State
const userHighScore = ref(null)
const isNewRecord = ref(false)
const userRankInLeaderboard = ref(0)
const materiLeaderboard = ref([])

const quizQuestions = computed(() => {
  if (props.materi?.assessment?.questions?.length) {
    return props.materi.assessment.questions.map((q, idx) => ({
      ...q,
      points: Number(q.points) || (props.materi.assessment.questions.length <= 2 ? 50 : 25)
    }))
  }
  return [
    {
      id: 'def-1',
      questionText: `Apa perubahan wujud yang terjadi pada materi "${props.materi?.title || 'ini'}"?`,
      points: 35,
      options: ['Mencair (Padat ke Cair)', 'Membeku (Cair ke Padat)', 'Menguap (Cair ke Gas)', 'Sublimasi (Padat ke Gas)'],
      correctOptionIndex: 0
    },
    {
      id: 'def-2',
      questionText: 'Apa faktor utama yang menyebabkan es batu dapat mencair?',
      points: 35,
      options: ['Suhu dingin', 'Suhu panas / energi kalor', 'Angin kencang', 'Cahaya redup'],
      correctOptionIndex: 1
    },
    {
      id: 'def-3',
      questionText: 'Manakah contoh peristiwa mencair dalam kehidupan sehari-hari?',
      points: 30,
      options: ['Air disimpan di freezer', 'Es krim meleleh di bawah sinar matahari', 'Embun di pagi hari', 'Kapur barus mengecil'],
      correctOptionIndex: 1
    }
  ]
})

const totalPossibleScore = computed(() => {
  return quizQuestions.value.reduce((acc, q) => acc + (Number(q.points) || 25), 0)
})

const startQuizTimer = () => {
  stopQuizTimer()
  quizSeconds.value = 0
  quizTimerInterval = setInterval(() => {
    if (!quizFinished.value && activeRightView.value === 'assessment') {
      quizSeconds.value++
    }
  }, 1000)
}

const stopQuizTimer = () => {
  if (quizTimerInterval) {
    clearInterval(quizTimerInterval)
    quizTimerInterval = null
  }
}

onUnmounted(() => {
  stopQuizTimer()
})

const handleVideoEnded = () => {
  isPlaying.value = false
  isVideoCompleted.value = true
}

const handleLockedQuizClick = () => {
  playButtonPop()
  showVideoRequiredModal.value = true
}

const goToVideoFromModal = () => {
  playButtonPop()
  showVideoRequiredModal.value = false
  activeRightView.value = 'video'
  if (videoRef.value && videoRef.value.paused) {
    videoRef.value.play().then(() => {
      isPlaying.value = true
    }).catch(() => {})
  }
}

const openQuiz = () => {
  if (!isVideoCompleted.value) {
    handleLockedQuizClick()
    return
  }
  playButtonPop()
  activeRightView.value = 'assessment'
  if (!quizFinished.value && quizSeconds.value === 0) {
    startQuizTimer()
  }
}

const calculateUserRank = () => {
  const userKey = currentUser.value?.id || currentUser.value?.email || 'guest_user'
  const studentDisplayName = studentName.value || currentUser.value?.name || 'Siswa Hebat'
  const idx = materiLeaderboard.value.findIndex(
    item => (item.userId && item.userId === userKey) || item.userName === studentDisplayName
  )
  userRankInLeaderboard.value = idx >= 0 ? idx + 1 : 0
}

const openLeaderboard = async () => {
  playButtonPop()
  activeRightView.value = 'leaderboard'
  // 1. Tampilkan cache lokal segera (instant response)
  materiLeaderboard.value = getMateriLeaderboard(props.materi?.id)
  calculateUserRank()

  // 2. Tarik update terbaru dari Supabase Cloud (sinkron antar-device)
  const cloudList = await fetchMateriLeaderboardFromSupabase(props.materi?.id)
  if (cloudList) {
    materiLeaderboard.value = cloudList
    calculateUserRank()
  }
}

const resetQuiz = () => {
  if (!isVideoCompleted.value) {
    handleLockedQuizClick()
    return
  }
  playButtonPop()
  selectedAnswers.value = {}
  quizFinished.value = false
  quizUserScore.value = 0
  quizCorrectCount.value = 0
  quizResultsList.value = []
  activeRightView.value = 'assessment'
  startQuizTimer()
}

const submitQuiz = () => {
  stopQuizTimer()
  quizDurationSeconds.value = quizSeconds.value

  let earnedPoints = 0
  let correctCount = 0
  const results = []

  quizQuestions.value.forEach((q, idx) => {
    const userChoice = selectedAnswers.value[idx]
    const isCorrect = userChoice === q.correctOptionIndex
    const points = Number(q.points) || 25
    if (isCorrect) {
      correctCount++
      earnedPoints += points
    }
    results.push({
      questionId: q.id || idx,
      questionText: q.questionText,
      points,
      userChoiceIndex: userChoice,
      userChoiceText: q.options[userChoice] || 'Tidak dijawab',
      isCorrect,
      pointsEarned: isCorrect ? points : 0
    })
  })

  quizUserScore.value = earnedPoints
  quizCorrectCount.value = correctCount
  quizResultsList.value = results
  quizFinished.value = true

  // Simpan Rekor Skor Tertinggi (High Score saja, tidak diakumulasi)
  const userKey = currentUser.value?.id || currentUser.value?.email || 'guest_user'
  const studentDisplayName = studentName.value || currentUser.value?.name || 'Siswa Hebat'

  const attemptRes = saveQuizAttempt(userKey, props.materi?.id, {
    score: earnedPoints,
    totalPoints: totalPossibleScore.value,
    timeSeconds: quizDurationSeconds.value,
    correctCount,
    totalQuestions: quizQuestions.value.length
  })

  isNewRecord.value = attemptRes.isNewHighScore
  userHighScore.value = attemptRes.currentRecord

  // Simpan ke Leaderboard Materi
  const lbRes = submitToMateriLeaderboard(props.materi?.id, {
    userId: userKey,
    userName: studentDisplayName,
    userAvatar: currentUser.value?.avatar || '👧',
    score: earnedPoints,
    totalPoints: totalPossibleScore.value,
    timeSeconds: quizDurationSeconds.value
  })

  userRankInLeaderboard.value = lbRes.rank
  materiLeaderboard.value = lbRes.leaderboard

  playMascotChime()
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
      videoUrl: RELIABLE_MODE_VIDEOS.slow
    }
  }
  if (currentMode.value === 'high_contrast') {
    return props.materi.highContrastContent || {
      title: props.materi.title?.toUpperCase() || 'HIGH CONTRAST MODE',
      text: props.materi.description?.toUpperCase() || 'HURUF BESAR KONTRAS TINGGI',
      videoUrl: RELIABLE_MODE_VIDEOS.high_contrast
    }
  }
  if (currentMode.value === 'focus') {
    return props.materi.focusContent || {
      title: props.materi.title || 'Focus Mode',
      text: props.materi.description || 'Tampilan sederhana bebas distraksi.',
      videoUrl: RELIABLE_MODE_VIDEOS.focus
    }
  }
  // Standard
  return props.materi.standardContent || {
    title: props.materi.title || 'Standar Mode',
    text: props.materi.description || 'Penjelasan materi lengkap.',
    videoUrl: RELIABLE_MODE_VIDEOS.standard
  }
})

// Video Source — prioritas: URL Cloudinary/custom > sanitize URL 403 > fallback CDN
const activeVideoSource = computed(() => {
  const url = activeContent.value?.videoUrl
  // Jika URL ada dan bukan commondatastorage yang 403, langsung pakai
  if (url && url.startsWith('http')) {
    return sanitizeVideoUrl(url, currentMode.value) || RELIABLE_MODE_VIDEOS[currentMode.value] || RELIABLE_MODE_VIDEOS.standard
  }
  // Jika kosong, fallback ke reliable CDN
  return RELIABLE_MODE_VIDEOS[currentMode.value] || RELIABLE_MODE_VIDEOS.standard
})

const handleVideoError = (e) => {
  console.warn('Video playback error, restoring reliable CDN source:', e)
  const fallback = RELIABLE_MODE_VIDEOS[currentMode.value] || RELIABLE_MODE_VIDEOS.standard
  if (videoRef.value && videoRef.value.src !== fallback) {
    videoRef.value.src = fallback
    videoRef.value.load()
  }
}

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

onMounted(async () => {
  const userKey = currentUser.value?.id || currentUser.value?.email || 'guest_user'
  userHighScore.value = getUserMateriHighScore(userKey, props.materi?.id)
  materiLeaderboard.value = getMateriLeaderboard(props.materi?.id)
  calculateUserRank()

  // Sinkronisasi data cloud dari Supabase saat player dimuat
  const cloudList = await fetchMateriLeaderboardFromSupabase(props.materi?.id)
  if (cloudList) {
    materiLeaderboard.value = cloudList
    calculateUserRank()
  }
})
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

        <!-- Card 1: Poin Belajar & Mode Aktif -->
        <div class="bg-white rounded-3xl p-5 border border-slate-100/90 shadow-sm space-y-4">
          <!-- Tombol Navigasi Video -->
          <button
            type="button"
            @click="activeRightView = 'video'"
            :class="[
              'w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-between shadow-sm cursor-pointer border',
              activeRightView === 'video'
                ? 'bg-[#0F3261] text-white border-[#0F3261] ring-2 ring-[#0F3261]/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#3587CE] hover:text-[#3587CE] hover:bg-blue-50/50'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <Video class="w-4 h-4 text-[#3587CE]" />
              <span>Video Pembelajaran</span>
            </div>
            <span
              :class="[
                'text-[10px] px-2.5 py-1 rounded-lg font-bold',
                activeRightView === 'video' ? 'bg-blue-500/30 text-blue-100' : 'bg-white border border-slate-200 text-slate-500'
              ]"
            >
              {{ activeRightView === 'video' ? 'Sedang Dibuka' : 'Buka Video' }}
            </span>
          </button>

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

          <!-- High score indicator if exists -->
          <div v-if="userHighScore" class="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-extrabold text-amber-900 flex items-center gap-1.5">
                <Trophy class="w-3.5 h-3.5 text-amber-600" /> Rekor Tertinggi:
              </span>
              <span class="font-black text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                {{ userHighScore.score }} / {{ userHighScore.totalPoints || totalPossibleScore }} Poin
              </span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-amber-800/80 font-medium">
              <span>Waktu Terbaik:</span>
              <span class="font-mono font-bold">{{ formatDuration(userHighScore.timeSeconds) }}</span>
            </div>
          </div>

          <!-- Action Button -->
          <div class="space-y-2">
            <button
              @click="openQuiz"
              :disabled="!isVideoCompleted"
              :class="[
                'w-full py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm',
                isVideoCompleted
                  ? activeRightView === 'assessment'
                    ? 'bg-indigo-700 text-white font-bold ring-2 ring-indigo-400/40 cursor-default'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 cursor-pointer active:scale-95 shadow-indigo-500/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              ]"
            >
              <template v-if="isVideoCompleted">
                <span v-if="activeRightView === 'assessment' && !quizFinished" class="flex items-center gap-1.5">
                  ✍️ Sedang Mengerjakan Kuis...
                </span>
                <span v-else-if="activeRightView === 'assessment' && quizFinished" class="flex items-center gap-1.5">
                  📋 Melihat Review Hasil Kuis
                </span>
                <span v-else-if="quizFinished" class="flex items-center gap-1.5">
                  📋 Lihat Evaluasi ({{ quizUserScore }}/{{ totalPossibleScore }} Poin)
                </span>
                <span v-else class="flex items-center gap-1.5">
                  ✍️ Kerjakan Asesmen ({{ quizQuestions.length }} Soal • {{ totalPossibleScore }} Poin)
                </span>
              </template>
              <span v-else class="flex items-center gap-1.5">
                <Lock class="w-3.5 h-3.5" />
                Tonton Video Dulu
              </span>
            </button>

            <!-- Leaderboard shortcut button -->
            <button
              type="button"
              @click="openLeaderboard"
              class="w-full py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-800 cursor-pointer"
            >
              <Trophy class="w-3.5 h-3.5 text-amber-600" />
              <span>Lihat Papan Peringkat Materi</span>
            </button>
          </div>
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
                @error="handleVideoError"
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

        <!-- VIEW 2: INLINE GOOGLE FORM-STYLE ASSESSMENT & REVIEW JAWABAN -->
        <div v-else-if="activeRightView === 'assessment'" class="space-y-4">
          
          <!-- 1. ACTIVE QUIZ FORM (Saat Kuis Sedang Dikerjakan) -->
          <div v-if="!quizFinished" class="space-y-4">
            <!-- Form Header Card (Google Form style top banner) -->
            <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm">
              <div class="h-3.5 bg-gradient-to-r from-[#0F3261] via-[#3587CE] to-indigo-600"></div>
              <div class="p-6 sm:p-7 space-y-3">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1.5">
                      ✍️ Asesmen Pemahaman Siswa
                    </span>
                    <!-- Live Count-Up Stopwatch -->
                    <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5 shadow-xs">
                      <Clock class="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      Stopwatch: {{ formatDuration(quizSeconds) }}
                    </span>
                  </div>

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
                  Pilihlah satu jawaban yang paling tepat. Poin dinilai berdasarkan bobot masing-masing butir soal. Waktu pengerjaan dicatat untuk papan peringkat (leaderboard)!
                </p>
                
                <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100 flex-wrap">
                  <span class="flex items-center gap-1">📚 Materi: <strong class="text-slate-800">{{ materi.title }}</strong></span>
                  <span class="flex items-center gap-1">👤 Siswa: <strong class="text-slate-800">{{ studentName }}</strong></span>
                  <span class="flex items-center gap-1">📝 Jumlah: <strong class="text-slate-800">{{ quizQuestions.length }} Soal</strong></span>
                  <span class="flex items-center gap-1 text-indigo-700">🌟 Total Bobot: <strong class="text-indigo-900 font-extrabold">{{ totalPossibleScore }} Poin</strong></span>
                </div>
              </div>
            </div>

            <!-- Questions List -->
            <form @submit.prevent="submitQuiz" class="space-y-4">
              <div
                v-for="(q, qIdx) in quizQuestions"
                :key="q.id || qIdx"
                class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4 transition hover:border-indigo-300"
              >
                <!-- Question Card Header -->
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                      Soal {{ qIdx + 1 }} dari {{ quizQuestions.length }}
                    </span>
                    <!-- Dynamic Question Point Weight Badge -->
                    <span class="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                      <Star class="w-3 h-3 text-amber-500 fill-amber-400" /> Bobot: {{ q.points }} Poin
                    </span>
                  </div>

                  <span v-if="selectedAnswers[qIdx] !== undefined" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 class="w-3.5 h-3.5" /> Terjawab
                  </span>
                  <span v-else class="text-xs text-rose-500 font-bold">* Wajib diisi</span>
                </div>

                <!-- Question Text -->
                <h3 class="text-sm sm:text-base font-bold text-[#0F3261] leading-relaxed">
                  {{ q.questionText }}
                </h3>

                <!-- Radio Options A, B, C, D -->
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
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    @click="activeRightView = 'video'"
                    class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal / Tonton Video
                  </button>
                  <span class="text-xs text-slate-500 font-semibold hidden sm:inline">
                    Terjawab: <strong class="text-indigo-600">{{ Object.keys(selectedAnswers).length }}</strong> / {{ quizQuestions.length }}
                  </span>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-xs text-slate-500 font-bold hidden md:inline">
                    Total Nilai Kuis: <strong class="text-[#0F3261] font-black">{{ totalPossibleScore }} Poin</strong>
                  </span>
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
              </div>
            </form>
          </div>

          <!-- 2. FITUR REVIEW JAWABAN & RINGKASAN EVALUASI (Setelah Kuis Di-submit) -->
          <div v-else class="space-y-4">
            
            <!-- Header Summary Card -->
            <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm">
              <div class="h-3.5 bg-gradient-to-r from-emerald-500 via-[#3587CE] to-indigo-600"></div>
              <div class="p-6 sm:p-7 space-y-5">
                
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                    <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> Ringkasan Evaluasi Kuis
                  </span>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="openLeaderboard"
                      class="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Trophy class="w-4 h-4 text-amber-600" />
                      Papan Peringkat
                    </button>
                    <button
                      type="button"
                      @click="activeRightView = 'video'"
                      class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <Video class="w-4 h-4 text-[#3587CE]" />
                      Kembali ke Video
                    </button>
                  </div>
                </div>

                <!-- Score & High Score Record Display Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <!-- Sesi Ini -->
                  <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-100 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-extrabold uppercase tracking-wide text-indigo-600">Perolehan Sesi Ini</span>
                      <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {{ Math.round((quizUserScore / (totalPossibleScore || 1)) * 100) }}%
                      </span>
                    </div>
                    <div class="flex items-baseline gap-2">
                      <span class="text-4xl sm:text-5xl font-black text-[#0F3261]">{{ quizUserScore }}</span>
                      <span class="text-sm font-bold text-slate-400">/ {{ totalPossibleScore }} Poin</span>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t border-indigo-100/70 flex-wrap">
                      <span class="flex items-center gap-1 font-semibold">
                        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> {{ quizCorrectCount }} / {{ quizQuestions.length }} Benar
                      </span>
                      <span class="flex items-center gap-1 font-mono font-bold text-slate-700">
                        <Clock class="w-3.5 h-3.5 text-amber-600" /> Durasi: {{ formatDuration(quizDurationSeconds) }}
                      </span>
                    </div>
                  </div>

                  <!-- Rekor Skor Tertinggi (High Score) -->
                  <div class="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                    <div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-extrabold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                          <Trophy class="w-3.5 h-3.5 text-amber-500" /> Rekor Tertinggi Kamu
                        </span>
                        <span v-if="isNewRecord" class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-900 animate-bounce">
                          ⭐ REKOR BARU!
                        </span>
                      </div>
                      <div class="flex items-baseline gap-2 mt-2">
                        <span class="text-3xl sm:text-4xl font-black text-amber-600">
                          {{ userHighScore?.score ?? quizUserScore }}
                        </span>
                        <span class="text-xs font-bold text-slate-400">/ {{ totalPossibleScore }} Poin Maksimal</span>
                      </div>
                    </div>
                    <div class="text-[11px] text-slate-500 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <span>Waktu Terbaik: <strong class="text-slate-700 font-mono">{{ formatDuration(userHighScore?.timeSeconds || quizDurationSeconds) }}</strong></span>
                      <span class="text-emerald-700 font-bold">Tersimpan Permanen</span>
                    </div>
                  </div>
                </div>

                <!-- Banner Informasi Rahasia Kunci Jawaban -->
                <div class="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                  <div class="text-lg shrink-0 mt-0.5">ℹ️</div>
                  <div class="space-y-0.5 leading-relaxed">
                    <p class="font-extrabold">Informasi Evaluasi Mandiri</p>
                    <p class="text-slate-600">
                      Halaman ini hanya menampilkan indikator status <strong class="text-emerald-700">Benar</strong> atau <strong class="text-rose-600">Salah</strong> untuk mengukur ketepatan jawabanmu. Kunci jawaban asli dan pembahasan sengaja tidak ditampilkan agar kamu dapat berlatih kembali dan mengasah pemahamanmu secara mandiri.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <!-- List of Questions Status Evaluation (BENAR / SALAH SAJA Tanpa Kunci Asli) -->
            <div class="space-y-3.5">
              <div
                v-for="(res, rIdx) in quizResultsList"
                :key="res.questionId || rIdx"
                :class="[
                  'bg-white rounded-3xl p-6 sm:p-7 border shadow-sm space-y-3.5 transition border-l-8',
                  res.isCorrect ? 'border-slate-200 border-l-emerald-500' : 'border-slate-200 border-l-rose-500'
                ]"
              >
                <!-- Card Header with Status Badge -->
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                      Nomor {{ rIdx + 1 }}
                    </span>
                    <span class="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      Bobot: {{ res.points }} Poin
                    </span>
                  </div>

                  <!-- Status Badge: Benar atau Salah Saja -->
                  <div v-if="res.isCorrect" class="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 class="w-4 h-4 text-emerald-600" />
                    <span>BENAR</span>
                    <span class="text-emerald-900 font-black">(+{{ res.pointsEarned }} Poin)</span>
                  </div>
                  <div v-else class="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                    <XCircle class="w-4 h-4 text-rose-600" />
                    <span>SALAH</span>
                    <span class="text-rose-900 font-bold">(0 Poin)</span>
                  </div>
                </div>

                <!-- Question Text -->
                <h4 class="text-sm sm:text-base font-bold text-[#0F3261] leading-relaxed">
                  {{ res.questionText }}
                </h4>

                <!-- Student's Choice (Tanpa Kunci Jawaban Asli) -->
                <div
                  :class="[
                    'p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 border',
                    res.isCorrect
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/60 border-rose-200 text-rose-950'
                  ]"
                >
                  <div class="shrink-0 font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded-md"
                    :class="res.isCorrect ? 'bg-emerald-200/60 text-emerald-800' : 'bg-rose-200/60 text-rose-800'"
                  >
                    Jawaban Kamu
                  </div>
                  <div class="flex-1 font-medium">
                    <span class="font-bold mr-1">{{ String.fromCharCode(65 + res.userChoiceIndex) }}.</span>
                    {{ res.userChoiceText }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Review Bottom Navigation Actions -->
            <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  @click="resetQuiz"
                  class="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw class="w-4 h-4 text-slate-500" />
                  Ulangi Kuis
                </button>
                <button
                  type="button"
                  @click="activeRightView = 'video'"
                  class="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Video class="w-4 h-4 text-[#3587CE]" />
                  Kembali ke Video
                </button>
                <button
                  type="button"
                  @click="emit('finish'); playButtonPop()"
                  class="px-5 py-3 rounded-2xl bg-[#0F3261] hover:bg-[#18447d] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <BookOpen class="w-4 h-4 text-amber-300" />
                  Kembali ke Materi
                </button>
              </div>

              <!-- Button Navigasi ke Leaderboard -->
              <button
                type="button"
                @click="openLeaderboard"
                class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-[#FF7315] hover:from-amber-600 hover:to-[#E86105] text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 flex items-center gap-2.5 transition active:scale-95 cursor-pointer"
              >
                <Trophy class="w-5 h-5 text-yellow-200" />
                <span>Lihat Papan Peringkat (Leaderboard)</span>
                <ChevronRight class="w-4 h-4 text-white/80" />
              </button>
            </div>

          </div>

        </div>

        <!-- VIEW 3: LEADERBOARD PER MATERI (Skor Tertinggi & Waktu Stopwatch Tercepat) -->
        <div v-else-if="activeRightView === 'leaderboard'" class="space-y-4">
          
          <!-- Leaderboard Header Card -->
          <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm">
            <div class="h-3.5 bg-gradient-to-r from-amber-400 via-[#FF7315] to-orange-500"></div>
            <div class="p-6 sm:p-7 space-y-4">
              
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <span class="px-3.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5 shadow-xs">
                  <Trophy class="w-4 h-4 text-amber-600" /> Papan Peringkat Materi
                </span>

                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    v-if="quizFinished"
                    type="button"
                    @click="activeRightView = 'assessment'"
                    class="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-indigo-200"
                  >
                    ← Review Jawaban
                  </button>
                  <button
                    type="button"
                    @click="activeRightView = 'video'"
                    class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <Video class="w-4 h-4 text-[#3587CE]" />
                    Kembali ke Video
                  </button>
                  <button
                    type="button"
                    @click="emit('finish'); playButtonPop()"
                    class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F3261] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200/80"
                    title="Kembali ke Katalog Materi"
                  >
                    <BookOpen class="w-4 h-4 text-[#FF7315]" />
                    Kembali ke Materi
                  </button>
                </div>
              </div>

              <div>
                <h2 class="text-xl sm:text-2xl font-black text-[#0F3261]">
                  Papan Peringkat: {{ materi.title }}
                </h2>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                  Peringkat khusus untuk materi ini. Diurutkan berdasarkan perolehan <strong class="text-slate-800">Skor Tertinggi</strong>, dan jika skor sama, ditentukan oleh <strong class="text-slate-800">Waktu Tercepat (Stopwatch)</strong>.
                </p>
              </div>

              <!-- User Position Highlight Banner -->
              <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 flex items-center justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-white text-indigo-700 font-black text-xl flex items-center justify-center shadow-xs border border-indigo-100 shrink-0">
                    {{ userRankInLeaderboard > 0 ? `#${userRankInLeaderboard}` : '-' }}
                  </div>
                  <div>
                    <p class="text-xs text-indigo-700 font-bold uppercase tracking-wider">
                      {{ userRankInLeaderboard > 0 ? 'Posisi Kamu Saat Ini' : 'Status Siswa' }}
                    </p>
                    <p class="text-sm font-extrabold text-[#0F3261]">
                      {{ studentName }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-5 text-xs font-bold">
                  <div v-if="userHighScore">
                    <span class="text-slate-400 block text-[10px] uppercase">Rekor Nilai</span>
                    <span class="text-amber-600 font-black text-base">{{ userHighScore.score }}</span>
                    <span class="text-slate-400"> / {{ totalPossibleScore }}</span>
                  </div>
                  <div v-if="userHighScore">
                    <span class="text-slate-400 block text-[10px] uppercase">Waktu Stopwatch</span>
                    <span class="text-indigo-900 font-mono font-black text-base">
                      {{ formatDuration(userHighScore.timeSeconds) }}
                    </span>
                  </div>
                  <div v-else class="text-slate-500 italic font-semibold">
                    Belum ada riwayat pengerjaan kuis
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- KONDISI 1: STATE KOSONG (Belum Ada yang Mengerjakan Kuis) -->
          <div v-if="materiLeaderboard.length === 0" class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm text-center space-y-5">
            <div class="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto text-4xl shadow-inner">
              🏆
            </div>
            <div class="space-y-1.5 max-w-md mx-auto">
              <h3 class="text-lg sm:text-xl font-black text-[#0F3261]">
                Papan Peringkat Masih Kosong
              </h3>
              <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Belum ada siswa yang menyelesaikan kuis pada materi ini. Jadilah yang pertama mengerjakan dan raih posisi Juara 1 di papan peringkat!
              </p>
            </div>
            <div class="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                v-if="isVideoCompleted"
                type="button"
                @click="openQuiz"
                class="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF7315] to-amber-500 hover:from-[#E86105] hover:to-amber-600 text-white text-xs sm:text-sm font-extrabold transition shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 class="w-4 h-4" />
                Mulai Kerjakan Kuis Sekarang
              </button>
              <button
                v-else
                type="button"
                @click="handleLockedQuizClick"
                class="px-6 py-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs sm:text-sm font-extrabold transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Lock class="w-4 h-4 text-amber-600" />
                Tonton Video untuk Membuka Kuis
              </button>
              <button
                type="button"
                @click="activeRightView = 'video'"
                class="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Video class="w-4 h-4 text-[#3587CE]" />
                Kembali ke Video
              </button>
              <button
                type="button"
                @click="emit('finish'); playButtonPop()"
                class="px-5 py-3.5 rounded-2xl bg-[#0F3261] hover:bg-[#18447d] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <BookOpen class="w-4 h-4 text-amber-300" />
                Kembali ke Materi
              </button>
            </div>
          </div>

          <!-- KONDISI 2: DATA TERISI (Ada Siswa yang Sudah Menyelesaikan Kuis) -->
          <div v-else class="space-y-4">
            <!-- Top 3 Podium (Visual Juara 1, 2, 3 jika peserta >= 3) -->
            <div v-if="materiLeaderboard.length >= 3" class="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-2 px-1">
              <!-- Rank 2: Silver (Kiri) -->
              <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 text-center shadow-xs flex flex-col items-center">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl sm:text-2xl shadow-inner border border-slate-200">
                  🥈
                </div>
                <div class="mt-2 font-extrabold text-xs sm:text-sm text-[#0F3261] truncate w-full">
                  {{ materiLeaderboard[1].userName }}
                </div>
                <div class="text-xs font-black text-slate-700 mt-1">
                  {{ materiLeaderboard[1].score }} <span class="text-[10px] font-bold text-slate-400">Poin</span>
                </div>
                <div class="text-[11px] font-mono text-slate-500 font-semibold mt-0.5">
                  ⏱️ {{ formatDuration(materiLeaderboard[1].timeSeconds) }}
                </div>
                <span class="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Juara 2
                </span>
              </div>

              <!-- Rank 1: Gold (Tengah - Elevated) -->
              <div class="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300 text-center shadow-md flex flex-col items-center transform -translate-y-2">
                <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-100 flex items-center justify-center text-2xl sm:text-3xl shadow-inner border border-amber-200 animate-pulse">
                  🥇
                </div>
                <div class="mt-2 font-black text-sm sm:text-base text-[#0F3261] truncate w-full">
                  {{ materiLeaderboard[0].userName }}
                </div>
                <div class="text-sm font-black text-amber-600 mt-1">
                  {{ materiLeaderboard[0].score }} <span class="text-xs font-bold text-slate-400">Poin</span>
                </div>
                <div class="text-xs font-mono text-slate-700 font-bold mt-0.5">
                  ⚡ {{ formatDuration(materiLeaderboard[0].timeSeconds) }}
                </div>
                <span class="mt-2 text-[11px] font-black px-3 py-0.5 rounded-full bg-amber-400 text-slate-900 shadow-xs">
                  👑 Juara 1
                </span>
              </div>

              <!-- Rank 3: Bronze (Kanan) -->
              <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 text-center shadow-xs flex flex-col items-center">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-50 flex items-center justify-center text-xl sm:text-2xl shadow-inner border border-orange-200">
                  🥉
                </div>
                <div class="mt-2 font-extrabold text-xs sm:text-sm text-[#0F3261] truncate w-full">
                  {{ materiLeaderboard[2].userName }}
                </div>
                <div class="text-xs font-black text-slate-700 mt-1">
                  {{ materiLeaderboard[2].score }} <span class="text-[10px] font-bold text-slate-400">Poin</span>
                </div>
                <div class="text-[11px] font-mono text-slate-500 font-semibold mt-0.5">
                  ⏱️ {{ formatDuration(materiLeaderboard[2].timeSeconds) }}
                </div>
                <span class="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                  Juara 3
                </span>
              </div>
            </div>

            <!-- Full Leaderboard Table -->
            <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm">
              <div class="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 class="text-sm font-extrabold text-[#0F3261]">
                  Daftar Lengkap Peringkat
                </h3>
                <span class="text-xs font-semibold text-slate-400">
                  {{ materiLeaderboard.length }} Peserta Terdaftar
                </span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr class="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                      <th class="py-3 px-4 sm:px-6 w-16 text-center">Rank</th>
                      <th class="py-3 px-4 sm:px-6">Nama Siswa</th>
                      <th class="py-3 px-4 sm:px-6 text-center">Skor Akhir</th>
                      <th class="py-3 px-4 sm:px-6 text-center">Waktu Pengerjaan</th>
                      <th class="py-3 px-4 sm:px-6 text-right">Rekor</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      v-for="(row, idx) in materiLeaderboard"
                      :key="row.userId || idx"
                      :class="[
                        'transition-colors',
                        row.isCurrentUser
                          ? 'bg-amber-50/80 font-bold ring-1 ring-inset ring-amber-300'
                          : 'hover:bg-slate-50/60'
                      ]"
                    >
                      <!-- Rank Column -->
                      <td class="py-3.5 px-4 sm:px-6 text-center">
                        <span v-if="idx === 0" class="text-lg">🥇</span>
                        <span v-else-if="idx === 1" class="text-lg">🥈</span>
                        <span v-else-if="idx === 2" class="text-lg">🥉</span>
                        <span v-else class="font-extrabold text-slate-500">#{{ idx + 1 }}</span>
                      </td>

                      <!-- Name Column -->
                      <td class="py-3.5 px-4 sm:px-6">
                        <div class="flex items-center gap-2.5">
                          <span class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shrink-0">
                            {{ row.userAvatar || '👧' }}
                          </span>
                          <div class="min-w-0">
                            <p class="font-extrabold text-slate-800 truncate flex items-center gap-1.5">
                              {{ row.userName }}
                              <span v-if="row.isCurrentUser" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900">
                                Kamu
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <!-- Score Column -->
                      <td class="py-3.5 px-4 sm:px-6 text-center">
                        <span class="font-black text-[#0F3261]">{{ row.score }}</span>
                        <span class="text-slate-400 text-xs font-semibold"> / {{ row.totalPoints || totalPossibleScore }}</span>
                      </td>

                      <!-- Duration Column -->
                      <td class="py-3.5 px-4 sm:px-6 text-center font-mono font-bold text-slate-700">
                        ⏱️ {{ formatDuration(row.timeSeconds) }}
                      </td>

                      <!-- Date/Status Column -->
                      <td class="py-3.5 px-4 sm:px-6 text-right text-xs text-slate-400">
                        {{ row.date ? new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Hari ini' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Leaderboard Footer Buttons -->
              <div class="p-6 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-3">
                  <button
                    v-if="isVideoCompleted"
                    type="button"
                    @click="resetQuiz"
                    class="px-5 py-3 rounded-2xl bg-[#0F3261] hover:bg-[#18447d] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <RotateCcw class="w-4 h-4 text-white/80" />
                    Coba Lagi Pecahkan Rekor
                  </button>
                  <button
                    v-else
                    type="button"
                    @click="handleLockedQuizClick"
                    class="px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    title="Selesaikan video pembelajaran terlebih dahulu untuk membuka kuis"
                  >
                    <Lock class="w-4 h-4 text-amber-600" />
                    Tonton Video untuk Pecahkan Rekor
                  </button>
                  <button
                    type="button"
                    @click="activeRightView = 'video'"
                    class="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <Video class="w-4 h-4 text-[#3587CE]" />
                    Kembali ke Video
                  </button>
                  <button
                    type="button"
                    @click="emit('finish'); playButtonPop()"
                    class="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-[#0F3261] border border-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer hover:border-[#0F3261]/40"
                  >
                    <BookOpen class="w-4 h-4 text-[#FF7315]" />
                    Kembali ke Materi
                  </button>
                </div>

                <button
                  v-if="quizFinished"
                  type="button"
                  @click="activeRightView = 'assessment'"
                  class="px-6 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  Review Jawaban Kuis
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</div>

    <!-- MODAL POPUP: PERINGATAN VIDEO HARUS SELESAI DITONTON -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showVideoRequiredModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          @click.self="showVideoRequiredModal = false"
        >
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <!-- Icon Video + Lock Badge -->
            <div class="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 border-2 border-amber-200 flex items-center justify-center mx-auto text-3xl shadow-inner relative">
              <Video class="w-10 h-10 text-amber-600" />
              <div class="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                <Lock class="w-3.5 h-3.5" />
              </div>
            </div>

            <div class="space-y-2">
              <span class="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                🔒 Kuis Masih Terkunci
              </span>
              <h3 class="text-xl font-black text-[#0F3261]">
                Tonton Video Dulu, Yuk!
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kamu harus menyelesaikan video pembelajaran materi ini terlebih dahulu sebelum dapat mengerjakan kuis asesmen ataupun mencoba memecahkan rekor di leaderboard.
              </p>
            </div>

            <!-- Hint Box -->
            <div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 text-left flex items-start gap-2.5">
              <span class="text-base shrink-0">💡</span>
              <span class="leading-relaxed">
                Menonton video sampai selesai akan membuka gembok kuis dan leaderboard secara otomatis!
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3 pt-1">
              <button
                type="button"
                @click="showVideoRequiredModal = false"
                class="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                type="button"
                @click="goToVideoFromModal"
                class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF7315] to-orange-500 hover:from-[#E86105] hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Video class="w-4 h-4" />
                Tonton Video Sekarang
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
</template>
