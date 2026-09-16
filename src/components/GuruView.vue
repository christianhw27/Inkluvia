<script setup>
import { ref, computed } from 'vue'
import {
  BookOpen,
  FileText,
  Download,
  Trophy,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  GraduationCap,
  Layers,
  Clock,
  Check,
  ChevronRight,
  Info,
  Target,
  FileDown
} from '@lucide/vue'

// Active Tab inside Guru View
const activeTab = ref('panduan') // 'dashboard' | 'panduan' | 'gamifikasi' | 'download'

// Selected Grade / Jenjang & Mapel
const selectedGrade = ref('kelas-4')
const selectedMapel = ref('ipas')

// Notification toast for download simulation
const downloadToast = ref(null)
const triggerDownload = (fileName) => {
  downloadToast.value = `Mengunduh file ${fileName}...`
  setTimeout(() => {
    downloadToast.value = null
  }, 3500)
}

// Grade Options Data
const gradeOptions = [
  { id: 'kelas-1', label: 'Kelas I (Fase A)', level: 'SD' },
  { id: 'kelas-2', label: 'Kelas II (Fase A)', level: 'SD' },
  { id: 'kelas-3', label: 'Kelas III (Fase B)', level: 'SD' },
  { id: 'kelas-4', label: 'Kelas IV (Fase B)', level: 'SD' },
  { id: 'kelas-5', label: 'Kelas V (Fase C)', level: 'SD' },
  { id: 'kelas-6', label: 'Kelas VI (Fase C)', level: 'SD' },
  { id: 'smp-7', label: 'Kelas VII (Fase D)', level: 'SMP' },
  { id: 'sma-10', label: 'Kelas X (Fase E)', level: 'SMA' }
]

const mapelOptions = [
  { id: 'ipas', label: 'IPAS (Sains & Sosial)' },
  { id: 'matematika', label: 'Matematika' },
  { id: 'indonesia', label: 'Bahasa Indonesia' }
]

// Dynamic Content based on selectedGrade
const currentGuideData = computed(() => {
  switch (selectedGrade.value) {
    case 'kelas-1':
    case 'kelas-2':
      return {
        gradeName: 'Kelas I & II • Fase A (SD)',
        title: 'Mengenal Benda di Sekitar Kita',
        durasi: '± 35 Menit',
        jenisMedia: 'Video + Lagu Interaktif',
        aksesibilitas: 'Standard & Focus Mode',
        cp: 'Peserta didik mengidentifikasi wujud dan sifat benda padat dan cair yang ada di lingkungan sekitar rumah dan sekolah.',
        tujuan: [
          'Membedakan benda padat dan benda cair melalui kegiatan mengamati.',
          'Menyebutkan contoh benda padat dan cair di kelas.',
          'Mengikuti aturan keselamatan saat bermain dengan air dan es.'
        ],
        files: [
          { name: 'Panduan_Guru_FaseA_IPAS.pdf', size: '2.1 MB', type: 'Panduan Utama' },
          { name: 'LKPD_Mewarnai_Benda_FaseA.pdf', size: '1.5 MB', type: 'Worksheet Berdiferensiasi' },
          { name: 'Kartu_Bergambar_Benda.pdf', size: '3.2 MB', type: 'Media Visual' },
          { name: 'Modul_Ajar_FaseA_SD.pdf', size: '1.9 MB', type: 'RPP / Modul Ajar' }
        ]
      }

    case 'kelas-3':
      return {
        gradeName: 'Kelas III • Fase B (SD)',
        title: 'Perubahan Benda dan Sifat-sifatnya',
        durasi: '± 40 Menit',
        jenisMedia: 'Video + Simulasi Sederhana',
        aksesibilitas: 'Standard & Focus Mode',
        cp: 'Peserta didik menganalisis proses perubahan wujud zat (mencair dan membeku) serta pengaruh suhu lingkungan.',
        tujuan: [
          'Memahami pengaruh panas terhadap es dan air.',
          'Mengidentifikasi contoh perubahan mencair dan membeku.',
          'Melakukan eksperimen mandiri es batu di mangkuk.'
        ],
        files: [
          { name: 'Panduan_Guru_Kelas3_IPAS.pdf', size: '2.3 MB', type: 'Panduan Utama' },
          { name: 'Worksheet_Eksperimen_Kelas3.pdf', size: '1.7 MB', type: 'Worksheet Berdiferensiasi' },
          { name: 'Evaluasi_Formatif_Kelas3.pdf', size: '1.1 MB', type: 'Asesmen Formatif' },
          { name: 'Modul_Ajar_IPAS_Kelas3.pdf', size: '2.0 MB', type: 'RPP / Modul Ajar' }
        ]
      }

    case 'kelas-5':
    case 'kelas-6':
      return {
        gradeName: 'Kelas V & VI • Fase C (SD)',
        title: 'Siklus Air & Kalor Perubahan Wujud',
        durasi: '± 50 Menit',
        jenisMedia: 'Simulasi Interaktif + Kuis',
        aksesibilitas: 'Standard & Focus Mode',
        cp: 'Peserta didik menginvestigasi hubungan antara energi panas (kalor) dengan perubahan wujud zat cair, gas, dan padat pada siklus air.',
        tujuan: [
          'Menganalisis hubungan evaporasi, kondensasi, dan presipitasi.',
          'Menjelaskan azas pergeseran kalor pada perubahan wujud.',
          'Menyelesaikan studi kasus evaporasi pada kehidupan sehari-hari.'
        ],
        files: [
          { name: 'Panduan_Guru_FaseC_SiklusAir.pdf', size: '2.8 MB', type: 'Panduan Utama' },
          { name: 'LKPD_Analisis_SiklusAir_FaseC.pdf', size: '2.2 MB', type: 'Worksheet Berdiferensiasi' },
          { name: 'Soal_HOTS_Evaluasi_FaseC.pdf', size: '1.4 MB', type: 'Evaluasi HOTS' },
          { name: 'Modul_Ajar_IPAS_FaseC.pdf', size: '2.5 MB', type: 'RPP / Modul Ajar' }
        ]
      }

    case 'smp-7':
      return {
        gradeName: 'Kelas VII • Fase D (SMP)',
        title: 'Zat, Wujud, dan Perubahannya (Fisika & Kimia)',
        durasi: '± 80 Menit (2 JP)',
        jenisMedia: 'Simulasi Lab Virtual + Video',
        aksesibilitas: 'Standard & Focus Mode',
        cp: 'Peserta didik menjelaskan model partikel untuk menjelaskan wujud zat (padat, cair, gas) serta perubahan wujud zat secara mikroskopis.',
        tujuan: [
          'Menjelaskan susunan partikel padat, cair, dan gas.',
          'Mengukur titik lebur dan titik didih secara kualitatif.',
          'Merancang percobaan perubahan wujud zat cair ke gas.'
        ],
        files: [
          { name: 'Panduan_Guru_SMP_FaseD.pdf', size: '3.1 MB', type: 'Panduan Utama' },
          { name: 'LKPD_LabVirtual_FaseD.pdf', size: '2.4 MB', type: 'Worksheet Berdiferensiasi' },
          { name: 'Asesmen_Diagnostik_SMP.pdf', size: '1.6 MB', type: 'Asesmen Diagnostik' },
          { name: 'Modul_Ajar_Fisika_FaseD.pdf', size: '2.8 MB', type: 'RPP / Modul Ajar' }
        ]
      }

    case 'sma-10':
      return {
        gradeName: 'Kelas X • Fase E (SMA)',
        title: 'Termodinamika & Wujud Zat Dasar',
        durasi: '± 90 Menit (2 JP)',
        jenisMedia: 'Simulasi Virtual + Lab Data',
        aksesibilitas: 'Standard & Focus Mode',
        cp: 'Peserta didik mengevaluasi konsep energi termal, perubahan fase zat, serta dampaknya terhadap lingkungan sekitar.',
        tujuan: [
          'Menghitung kalor jenis dan kalor lebur pada perubahan fase es.',
          'Menganalisis grafik hubungan suhu terhadap waktu (T vs t).',
          'Menyusun laporan ilmiah hasil observasi termal.'
        ],
        files: [
          { name: 'Panduan_Guru_SMA_FaseE.pdf', size: '3.5 MB', type: 'Panduan Utama' },
          { name: 'LKPD_Perhitungan_Kalor_FaseE.pdf', size: '2.6 MB', type: 'Worksheet Berdiferensiasi' },
          { name: 'Bank_Soal_Evaluasi_SMA.pdf', size: '1.9 MB', type: 'Evaluasi Asesmen' },
          { name: 'Modul_Ajar_Fisika_FaseE.pdf', size: '3.0 MB', type: 'RPP / Modul Ajar' }
        ]
      }

    case 'kelas-4':
    default:
      return {
        gradeName: 'Kelas IV • Fase B (SD)',
        title: 'Petualangan Si Es Batu (Perubahan Wujud Benda)',
        durasi: '± 45 Menit',
        jenisMedia: 'Video Interaktif + Worksheet',
        aksesibilitas: 'Standard & Focus Mode',
        cp: 'Peserta didik mengidentifikasi proses perubahan wujud zat (mencair, menguap, mengembun) dan mengaitkannya dengan kehidupan sehari-hari.',
        tujuan: [
          'Memahami proses mencair, menguap, dan mengembun melalui simulasi visual.',
          'Mengidentifikasi perbedaan antara Standard Mode dan Focus Mode untuk siswa inklusif.',
          'Menyelesaikan Lembar Kerja Peserta Didik (LKPD) sesuai tingkat pemahaman.'
        ],
        files: [
          { name: 'Panduan_Guru_IPAS_Kelas4.pdf', size: '2.4 MB', type: 'Panduan Utama' },
          { name: 'Worksheet_Diferensiasi_Kelas4.pdf', size: '1.8 MB', type: 'Worksheet Berdiferensiasi' },
          { name: 'Evaluasi_Pembelajaran_Kelas4.pdf', size: '1.2 MB', type: 'Evaluasi Pembelajaran' },
          { name: 'Modul_Ajar_IPAS_FaseB.pdf', size: '2.1 MB', type: 'RPP / Modul Ajar' },
          { name: 'Rubrik_Asesmen_Diagnostik_FaseB.pdf', size: '1.5 MB', type: 'Asesmen Diagnostik' }
        ]
      }
  }
})

// Sub-Tab inside Panduan Guru Detail (Informasi, Tujuan, Aktivitas, Download)
const activeGuideSubTab = ref('download') // 'informasi' | 'tujuan' | 'aktivitas' | 'download'

// Gamification Preview Data (Pencapaian & Peringkat Siswa)
const studentLeaderboard = ref([
  { rank: 1, name: 'Dini Fitriani', avatar: '👧', points: 1250, badge: 'Detektif Perubahan Wujud', progress: '100%' },
  { rank: 2, name: 'Budi Santoso', avatar: '👦', points: 1180, badge: 'Penjelajah Es Batu', progress: '95%' },
  { rank: 3, name: 'Siti Rahma', avatar: '👩', points: 1050, badge: 'Sahabat Inkluvia', progress: '90%' },
  { rank: 4, name: 'Ahmad Fauzi', avatar: '🧑', points: 980, badge: 'Pengamat Sains', progress: '85%' },
  { rank: 5, name: 'Rani Permata', avatar: '👧', points: 920, badge: 'Pembelajar Adaptif', progress: '80%' }
])
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto py-2">
    <!-- Toast Download Simulation Notification -->
    <Transition name="fade">
      <div
        v-if="downloadToast"
        class="fixed bottom-6 right-6 z-50 bg-[#0F3261] text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-400/30 flex items-center gap-3 text-xs font-bold"
      >
        <FileDown class="w-4 h-4 text-[#3DA5FF] animate-bounce" />
        <span>{{ downloadToast }}</span>
      </div>
    </Transition>

    <!-- Top Header Banner & Class Selector -->
    <section class="bg-gradient-to-r from-[#0F3261] via-[#10427F] to-[#1E5296] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
      <!-- Background Shapes -->
      <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-[#3DA5FF]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute right-36 -top-10 w-48 h-48 bg-[#FF74BC]/10 rounded-full blur-2xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- Left Title Info -->
        <div class="space-y-2 text-left max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-[#FFDC58] border border-white/20">
            <GraduationCap class="w-4 h-4" />
            Ruang Guru & Modul Ajar Berdiferensiasi
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Panduan Pembelajaran & Ruang Pengajar
          </h1>

          <p class="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            Dapatkan modul ajar Kurikulum Merdeka, panduan adaptif inklusif, asesmen diagnostik, dan lembar kerja peserta didik yang disesuaikan dengan jenjang kelas pilihan Anda.
          </p>
        </div>

        <!-- Right Class / Grade Dropdown Selector -->
        <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2 text-left min-w-[280px]">
          <label class="text-[11px] font-bold text-[#FFDC58] uppercase tracking-wider flex items-center gap-1.5">
            <Filter class="w-3.5 h-3.5" />
            Pilih Jenjang & Kelas Guru
          </label>

          <div class="space-y-2">
            <!-- Dropdown Jenjang -->
            <select
              v-model="selectedGrade"
              class="w-full bg-white text-[#0F3261] font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3DA5FF] cursor-pointer shadow-sm"
            >
              <option v-for="g in gradeOptions" :key="g.id" :value="g.id">
                {{ g.label }}
              </option>
            </select>

            <!-- Dropdown Mapel -->
            <select
              v-model="selectedMapel"
              class="w-full bg-white/90 text-[#0F3261] font-semibold text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3DA5FF] cursor-pointer shadow-sm"
            >
              <option v-for="m in mapelOptions" :key="m.id" :value="m.id">
                {{ m.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Section Tabs (Panduan Guru, Dashboard Kelas, Gamifikasi & Leaderboard) -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
      <button
        @click="activeTab = 'panduan'"
        :class="[
          'px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border',
          activeTab === 'panduan'
            ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-md'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-[#0F3261]'
        ]"
      >
        <BookOpen class="w-4 h-4 text-[#3DA5FF]" />
        Panduan Guru & Modul Ajar
      </button>

      <button
        @click="activeTab = 'dashboard'"
        :class="[
          'px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border',
          activeTab === 'dashboard'
            ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-md'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-[#0F3261]'
        ]"
      >
        <Layers class="w-4 h-4 text-[#FF7315]" />
        Ringkasan & Aktivitas Kelas
      </button>

      <button
        @click="activeTab = 'gamifikasi'"
        :class="[
          'px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border',
          activeTab === 'gamifikasi'
            ? 'bg-[#0F3261] text-white border-[#0F3261] shadow-md'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-[#0F3261]'
        ]"
      >
        <Trophy class="w-4 h-4 text-[#FFDC58]" />
        Pencapaian & Peringkat Siswa
        <span class="px-2 py-0.5 rounded-full text-[10px] bg-[#FF7315] text-white">Gamifikasi</span>
      </button>
    </div>

    <!-- ==================== TAB 1: PANDUAN GURU & DETAIL ==================== -->
    <section v-if="activeTab === 'panduan'" class="space-y-6">
      <!-- Title & Subtitle Banner matching Screenshot -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm text-left space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div class="space-y-1">
            <h2 class="text-2xl font-extrabold text-[#0F3261]">
              Panduan Guru — {{ currentGuideData.gradeName }}
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 font-medium">
              Informasi lengkap untuk mendukung pembelajaran inklusif dan berdiferensiasi di kelas.
            </p>
          </div>

          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6F3FD] text-[#3587CE] text-xs font-bold border border-[#3DA5FF]/30 shrink-0">
            <Sparkles class="w-4 h-4 text-[#3DA5FF]" />
            Modul Adaptif Terverifikasi
          </div>
        </div>

        <!-- Sub-Tabs Filter: Informasi | Tujuan Pembelajaran | Aktivitas | Download -->
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
          <button
            @click="activeGuideSubTab = 'informasi'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer',
              activeGuideSubTab === 'informasi'
                ? 'bg-[#3587CE] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            Informasi
          </button>
          <button
            @click="activeGuideSubTab = 'tujuan'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer',
              activeGuideSubTab === 'tujuan'
                ? 'bg-[#3587CE] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            Tujuan Pembelajaran
          </button>
          <button
            @click="activeGuideSubTab = 'aktivitas'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer',
              activeGuideSubTab === 'aktivitas'
                ? 'bg-[#3587CE] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            Aktivitas
          </button>
          <button
            @click="activeGuideSubTab = 'download'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5',
              activeGuideSubTab === 'download'
                ? 'bg-[#3587CE] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            <Download class="w-3.5 h-3.5" />
            Download File
          </button>
        </div>

        <!-- Sub-Tab Content Grid matching the 2-Column screenshot layout! -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Column Left: Metadata Informasi Pembelajaran (5 cols on lg) -->
          <div class="lg:col-span-5 bg-[#F8FAFD] rounded-3xl p-6 border border-slate-100 space-y-4 text-left">
            <h3 class="text-sm font-bold text-[#0F3261] flex items-center gap-2 border-b border-slate-200 pb-3">
              <Info class="w-4 h-4 text-[#3587CE]" />
              Informasi Pembelajaran
            </h3>

            <div class="space-y-3 text-xs">
              <div class="flex justify-between py-1.5 border-b border-slate-200/60">
                <span class="text-slate-500 font-medium">Mata Pelajaran</span>
                <strong class="text-[#0F3261] font-bold">IPAS / Sains</strong>
              </div>

              <div class="flex justify-between py-1.5 border-b border-slate-200/60">
                <span class="text-slate-500 font-medium">Kelas / Fase</span>
                <strong class="text-[#0F3261] font-bold">{{ currentGuideData.gradeName }}</strong>
              </div>

              <div class="flex justify-between py-1.5 border-b border-slate-200/60">
                <span class="text-slate-500 font-medium">Topik Utama</span>
                <strong class="text-[#0F3261] font-bold truncate max-w-[180px]">{{ currentGuideData.title }}</strong>
              </div>

              <div class="flex justify-between py-1.5 border-b border-slate-200/60">
                <span class="text-slate-500 font-medium">Estimasi Durasi</span>
                <strong class="text-[#0F3261] font-bold">{{ currentGuideData.durasi }}</strong>
              </div>

              <div class="flex justify-between py-1.5 border-b border-slate-200/60">
                <span class="text-slate-500 font-medium">Jenis Media</span>
                <strong class="text-[#0F3261] font-bold">{{ currentGuideData.jenisMedia }}</strong>
              </div>

              <div class="flex justify-between py-1.5">
                <span class="text-slate-500 font-medium">Fitur Aksesibilitas</span>
                <strong class="text-[#3587CE] font-bold">{{ currentGuideData.aksesibilitas }}</strong>
              </div>
            </div>
          </div>

          <!-- Column Right: Download Files Section (7 cols on lg) - Matches screenshot! -->
          <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
            <!-- Dynamic Content based on activeGuideSubTab -->
            <template v-if="activeGuideSubTab === 'download'">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 class="text-base font-extrabold text-[#0F3261] flex items-center gap-2">
                    <Download class="w-4 h-4 text-[#FF7315]" />
                    Unduh File Modul & LKPD
                  </h3>
                  <p class="text-[11px] text-slate-400">File disesuaikan untuk {{ currentGuideData.gradeName }}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-[10px] font-bold bg-[#FF7315]/10 text-[#FF7315]">
                  {{ currentGuideData.files.length }} File Tersedia
                </span>
              </div>

              <!-- Download Files List -->
              <div class="space-y-3">
                <div
                  v-for="(f, idx) in currentGuideData.files"
                  :key="idx"
                  class="p-4 rounded-2xl border border-slate-100 bg-[#FAFDFE] hover:bg-white hover:border-[#3DA5FF]/40 transition flex items-center justify-between gap-4 group shadow-2xs"
                >
                  <div class="flex items-center gap-3.5 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <FileText class="w-5 h-5 text-rose-500" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-[#0F3261] truncate group-hover:text-[#3587CE] transition">
                        {{ f.name }}
                      </p>
                      <p class="text-[10px] text-slate-400 font-medium">
                        {{ f.type }} &bull; PDF &bull; {{ f.size }}
                      </p>
                    </div>
                  </div>

                  <button
                    @click="triggerDownload(f.name)"
                    class="px-4 py-2 rounded-full bg-[#3DA5FF] hover:bg-[#3587CE] text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
                  >
                    <span>Download</span>
                    <Download class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </template>

            <!-- Sub-Tab: Informasi / CP -->
            <template v-else-if="activeGuideSubTab === 'informasi'">
              <div class="space-y-4">
                <h3 class="text-base font-extrabold text-[#0F3261]">Capaian Pembelajaran (CP)</h3>
                <p class="text-xs text-slate-600 leading-relaxed bg-[#F4F9FD] p-4 rounded-2xl border border-blue-100">
                  {{ currentGuideData.cp }}
                </p>
              </div>
            </template>

            <!-- Sub-Tab: Tujuan Pembelajaran -->
            <template v-else-if="activeGuideSubTab === 'tujuan'">
              <div class="space-y-3">
                <h3 class="text-base font-extrabold text-[#0F3261]">Tujuan Pembelajaran Berdiferensiasi</h3>
                <ul class="space-y-2">
                  <li
                    v-for="(t, idx) in currentGuideData.tujuan"
                    :key="idx"
                    class="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100"
                  >
                    <CheckCircle2 class="w-4 h-4 text-[#74DC2E] shrink-0 mt-0.5" />
                    <span>{{ t }}</span>
                  </li>
                </ul>
              </div>
            </template>

            <!-- Sub-Tab: Aktivitas Mengajar -->
            <template v-else>
              <div class="space-y-3">
                <h3 class="text-base font-extrabold text-[#0F3261]">Langkah-Langkah Pembelajaran di Kelas</h3>
                <div class="space-y-2 text-xs">
                  <div class="p-3 bg-[#FFEFE6] rounded-xl border border-orange-100 text-left">
                    <strong class="text-[#FF7315] block mb-1">1. Pendahuluan & Apersepsi (10 Menit)</strong>
                    <p class="text-slate-600">Guru menanyakan ke siswa benda cair di sekitar dan menyalakan video pematik.</p>
                  </div>
                  <div class="p-3 bg-[#EAF3FD] rounded-xl border border-blue-100 text-left">
                    <strong class="text-[#3587CE] block mb-1">2. Eksplorasi Media Interaktif (20 Menit)</strong>
                    <p class="text-slate-600">Siswa melakukan simulasi Standard / Focus Mode di perangkat atau proyektor.</p>
                  </div>
                  <div class="p-3 bg-[#F3EBF7] rounded-xl border border-purple-100 text-left">
                    <strong class="text-[#E1529C] block mb-1">3. Refleksi & Asesmen Mandiri (15 Menit)</strong>
                    <p class="text-slate-600">Siswa mengisi LKPD berdiferensiasi sesuai tingkat kesiapan belajar.</p>
                  </div>
                </div>
              </div>
            </template>
          </div>

        </div>
      </div>
    </section>

    <!-- ==================== TAB 2: RINGKASAN & AKTIVITAS KELAS ==================== -->
    <section v-else-if="activeTab === 'dashboard'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <!-- Card Left: Hai Petualang & Materi Aktif (Matches Left Screenshot!) -->
        <div class="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5 text-left flex flex-col justify-between">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-[#3DA5FF]/20 flex items-center justify-center text-xl">
                👨‍🏫
              </div>
              <div>
                <h2 class="text-xl font-bold text-[#0F3261]">Hai, Bapak/Ibu Guru!</h2>
                <p class="text-xs text-slate-500">Yuk, pantau aktivitas dan kemajuan belajar siswa di kelas.</p>
              </div>
            </div>

            <!-- Active Material Progress Card -->
            <div class="p-5 rounded-2xl bg-[#F4F9FD] border border-blue-100 space-y-3 mt-4">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF7315] text-white">Materi Sedang Berlangsung</span>
                <span class="text-xs font-bold text-[#3587CE]">Progress 60%</span>
              </div>

              <div class="flex items-center gap-4">
                <img src="/es_batu_card.jpg" alt="Materi" class="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0" />
                <div class="space-y-1">
                  <h3 class="text-sm font-extrabold text-[#0F3261]">Petualangan Si Es Batu</h3>
                  <p class="text-[11px] text-slate-500">3 dari 5 tahap dipelajari siswa di kelas</p>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div class="h-full bg-[#FF7315] w-[60%] rounded-full"></div>
              </div>
            </div>
          </div>

          <!-- Recommendations for teacher -->
          <div class="pt-3 border-t border-slate-100 space-y-2">
            <h4 class="text-xs font-bold text-[#0F3261]">Rekomendasi Modul Selanjutnya</h4>
            <div class="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-700">Petualangan Tumbuhan • Kelas V</span>
              <span class="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Fase C</span>
            </div>
          </div>
        </div>

        <!-- Card Right: Pencapaian Kelas Preview (Matches Right Screenshot!) -->
        <div class="md:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5 text-left flex flex-col justify-between">
          <div class="space-y-3">
            <h3 class="text-base font-extrabold text-[#0F3261] flex items-center gap-2">
              <Award class="w-5 h-5 text-[#FF7315]" />
              Pencapaian & Badge Kelas
            </h3>

            <!-- Badge Box -->
            <div class="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-[#FFDC58] flex items-center justify-center text-2xl shadow-sm shrink-0">
                🏆
              </div>
              <div class="space-y-0.5">
                <h4 class="text-xs font-extrabold text-[#0F3261]">Detektif Perubahan Wujud</h4>
                <p class="text-[11px] text-slate-500">18 dari 24 Siswa telah memperoleh badge ini</p>
              </div>
            </div>

            <!-- Gamification Teaser -->
            <div class="p-4 rounded-2xl bg-[#F0F7FE] border border-blue-100 text-xs space-y-2">
              <p class="font-bold text-[#3587CE]">✨ Peringkat Kelas Teratas</p>
              <ol class="space-y-1 text-slate-700 font-medium">
                <li>1. 🥇 Dini Fitriani (1,250 Poin)</li>
                <li>2. 🥈 Budi Santoso (1,180 Poin)</li>
                <li>3. 🥉 Siti Rahma (1,050 Poin)</li>
              </ol>
            </div>
          </div>

          <button
            @click="activeTab = 'gamifikasi'"
            class="w-full py-2.5 rounded-xl bg-[#0F3261] text-white text-xs font-bold hover:bg-[#10458C] transition cursor-pointer"
          >
            Lihat Gamifikasi Lengkap
          </button>
        </div>
      </div>
    </section>

    <!-- ==================== TAB 3: PENCAPAIAN & GAMIFIKASI ==================== -->
    <section v-else class="space-y-6">
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 text-left">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-xl font-extrabold text-[#0F3261] flex items-center gap-2">
              <Trophy class="w-5 h-5 text-[#FFDC58]" />
              Pencapaian & Peringkat Gamifikasi Siswa
            </h2>
            <p class="text-xs text-slate-500">
              Pantau poin, lencana pencapaian (*badge*), dan tingkat keaktifan siswa secara real-time.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            Fase Pengembangan Gamifikasi
          </span>
        </div>

        <!-- Leaderboard Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <th class="p-3">Peringkat</th>
                <th class="p-3">Nama Siswa</th>
                <th class="p-3">Pencapaian Badge</th>
                <th class="p-3">Progress Pembelajaran</th>
                <th class="p-3 text-right">Total Poin</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="s in studentLeaderboard"
                :key="s.rank"
                class="hover:bg-blue-50/50 transition font-medium"
              >
                <td class="p-3 font-bold text-[#0F3261]">
                  <span
                    :class="[
                      'w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-white text-[11px]',
                      s.rank === 1 ? 'bg-amber-400' : s.rank === 2 ? 'bg-slate-400' : s.rank === 3 ? 'bg-amber-700' : 'bg-slate-200 text-slate-700'
                    ]"
                  >
                    {{ s.rank }}
                  </span>
                </td>
                <td class="p-3 font-bold text-[#0F3261] flex items-center gap-2">
                  <span class="text-base">{{ s.avatar }}</span>
                  <span>{{ s.name }}</span>
                </td>
                <td class="p-3">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFDC58]/40 text-slate-800 border border-[#FFDC58]">
                    ⭐ {{ s.badge }}
                  </span>
                </td>
                <td class="p-3">
                  <div class="flex items-center gap-2">
                    <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-[#3DA5FF] rounded-full" :style="{ width: s.progress }"></div>
                    </div>
                    <span class="text-[11px] font-bold text-slate-600">{{ s.progress }}</span>
                  </div>
                </td>
                <td class="p-3 text-right font-extrabold text-[#FF7315] text-sm">
                  {{ s.points.toLocaleString() }} PTS
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
