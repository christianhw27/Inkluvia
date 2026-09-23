<script setup>
import { ref } from 'vue'
import {
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronDown,
  CreditCard,
  Lock,
  Heart,
  Star
} from '@lucide/vue'
import { playButtonPop, playMascotChime } from '../lib/soundEffects'

const emit = defineEmits(['select-plan', 'navigate-auth'])

// Toggle Bulanan vs Tahunan
const isYearly = ref(false)

// Active FAQ index
const openFaqIndex = ref(0)

const toggleFaq = (index) => {
  openFaqIndex.value = openFaqIndex.value === index ? null : index
}

// Checkout Modal State
const showCheckoutModal = ref(false)
const selectedPlan = ref(null)

const handleChoosePlan = (plan) => {
  playButtonPop()
  if (plan === 'free') {
    emit('navigate-auth', 'register', 'Daftar akun gratis sekarang untuk menikmati modul pembelajaran pertama!')
  } else {
    selectedPlan.value = {
      name: 'Inkluvia Premium',
      price: isYearly.value ? 'Rp47.000' : 'Rp59.000',
      period: isYearly.value ? '/bulan (ditagih tahunan)' : '/bulan',
      savings: isYearly.value ? 'Hemat 20%' : null
    }
    showCheckoutModal.value = true
    playMascotChime()
  }
}

const handleProceedCheckout = () => {
  showCheckoutModal.value = false
  emit('navigate-auth', 'register', 'Lanjutkan pendaftaran untuk mengaktifkan akun Inkluvia Premium Anda!')
}

const faqs = [
  {
    q: 'Apakah materi di Paket Gratis bisa diakses selamanya?',
    a: 'Ya, Paket Gratis dapat diakses 100% tanpa batas waktu. Anda dapat mencoba modul membaca & fonik pertama bersama anak tanpa biaya tersembunyi.'
  },
  {
    q: 'Apa perbedaan antara Standard Mode dan Focus Mode?',
    a: 'Standard Mode hadir dengan musik background ceria, efek animasi penuh warna, dan pendamping suara aktif. Focus Mode dirancang lebih tenang dengan warna pastel lembut dan distraksi minimal untuk anak yang sensitif visual/auditori.'
  },
  {
    q: 'Apakah saya bisa membatalkan langganan kapan saja?',
    a: 'Tentu saja! Anda bebas membatalkan perpanjangan langganan kapan saja dari halaman profil Anda tanpa denda atau syarat rumit.'
  },
  {
    q: 'Apakah ada paket khusus untuk Komunitas atau Institusi?',
    a: 'Ada! Kami menyediakan lisensi khusus kelompok dengan fitur cetak worksheet tanpa batas dan dashboard pemantauan belajar. Hubungi tim kami untuk konsultasi.'
  }
]
</script>

<template>
  <div class="w-full bg-transparent py-10 sm:py-16 px-4 sm:px-6 lg:px-10 space-y-16 relative overflow-hidden">
    <!-- Subtle Soft Background Tints -->
    <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#FFDC58]/08 blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-[#3DA5FF]/08 blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-[#FF74BC]/20 blur-3xl pointer-events-none"></div>

    <!-- Floating Doodles -->
    <div class="absolute top-12 left-8 text-2xl text-[#FFDC58] pointer-events-none animate-bounce-subtle hidden sm:block">⭐</div>
    <div class="absolute top-20 right-12 text-2xl text-[#FF7315] pointer-events-none animate-spin-slow hidden sm:block">✨</div>

    <div class="w-full max-w-[1440px] mx-auto space-y-12 relative z-10">

      <!-- ==================== PAGE HEADER ==================== -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-blue-200/80 shadow-2xs text-xs font-black text-[#0F3261]">
          <Sparkles class="w-4 h-4 text-[#FF7315]" />
          <span>PAKET LANGGANAN RAMAH KELUARGA & SEKOLAH</span>
        </div>
        
        <h1 class="text-3xl sm:text-5xl font-black text-[#0F3261] tracking-tight leading-tight">
          Pilih Cara Belajarmu
        </h1>
        
        <p class="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-xl mx-auto">
          Dapatkan akses lebih banyak materi, mode belajar tanpa distraksi, dan fitur pendukung menarik lainnya untuk buah hati.
        </p>

        <!-- Toggle Switcher: Bulanan vs Tahunan -->
        <div class="flex items-center justify-center gap-3 pt-4">
          <span :class="['text-xs sm:text-sm font-extrabold transition', !isYearly ? 'text-[#0F3261]' : 'text-slate-400']">
            Bayar Bulanan
          </span>
          
          <button
            @click="isYearly = !isYearly; playButtonPop()"
            class="w-14 h-8 rounded-full p-1 transition-colors duration-300 cursor-pointer relative shadow-inner focus:outline-none"
            :class="isYearly ? 'bg-[#FF7315]' : 'bg-slate-300'"
          >
            <div
              class="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300"
              :class="isYearly ? 'translate-x-6' : 'translate-x-0'"
            ></div>
          </button>

          <span :class="['text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition', isYearly ? 'text-[#FF7315]' : 'text-slate-400']">
            Bayar Tahunan
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
              HEMAT 20% 🏷️
            </span>
          </span>
        </div>
      </div>

      <!-- ==================== PRICING CARDS & ARTWORK BANNER GRID ==================== -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        <!-- CARD 1: FREE TIER (4 Cols) -->
        <div class="lg:col-span-4 bg-white rounded-3xl p-8 sm:p-10 border-2 border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-8 relative group">
          <div class="space-y-6">
            <!-- Header -->
            <div class="space-y-2">
              <span class="inline-block px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600">
                PEMULA
              </span>
              <h3 class="text-2xl font-black text-[#0F3261]">Free</h3>
              <div class="flex items-baseline gap-1 pt-1">
                <span class="text-4xl font-black text-[#0F3261]">Rp0</span>
                <span class="text-xs font-bold text-slate-400">/selamanya</span>
              </div>
            </div>

            <!-- Features Checklist -->
            <ul class="space-y-4 text-xs sm:text-sm text-slate-600 font-medium">
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#3DA5FF] shrink-0 mt-0.5" />
                <span>Akses 1 materi modul dasar</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#3DA5FF] shrink-0 mt-0.5" />
                <span>Standard Mode (Ceria & Suara)</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#3DA5FF] shrink-0 mt-0.5" />
                <span>Fitur dasar pembelajaran</span>
              </li>
              <li class="flex items-start gap-3 opacity-50">
                <Lock class="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                <span class="line-through">Focus Mode Bebas Distraksi</span>
              </li>
              <li class="flex items-start gap-3 opacity-50">
                <Lock class="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                <span class="line-through">Worksheet Printable Siap Cetak</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              @click="handleChoosePlan('free')"
              class="w-full py-3.5 px-6 rounded-full bg-[#3DA5FF] hover:bg-[#2e94ed] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-md"
            >
              <span>Mulai Gratis</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- CARD 2: PREMIUM TIER (4 Cols) - HIGHLIGHTED -->
        <div class="lg:col-span-4 bg-gradient-to-b from-[#FFFDF9] to-amber-50/40 rounded-3xl p-8 sm:p-10 border-4 border-[#FF7315]/80 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 flex flex-col justify-between space-y-8 relative group scale-102">
          <!-- Popular Badge Tag -->
          <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF7315] to-[#e86105] text-white px-5 py-1.5 rounded-full text-xs font-black tracking-wide shadow-md flex items-center gap-1.5 uppercase">
            <Star class="w-3.5 h-3.5 fill-current text-[#FFDC58]" />
            <span>Paling Populer</span>
          </div>

          <div class="space-y-6 pt-2">
            <!-- Header -->
            <div class="space-y-2">
              <span class="inline-block px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-[#FF7315]">
                INKLUVIA PREMIUM
              </span>
              <h3 class="text-2xl font-black text-[#0F3261]">Inkluvia Premium</h3>
              <div class="flex items-baseline gap-1.5 pt-1">
                <span class="text-4xl font-black text-[#FF7315]">
                  {{ isYearly ? 'Rp47.000' : 'Rp59.000' }}
                </span>
                <span class="text-xs font-bold text-slate-500">/bulan</span>
              </div>
              <p v-if="isYearly" class="text-[11px] font-extrabold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md inline-block">
                Ditagih tahunan (Rp564.000 / tahun)
              </p>
            </div>

            <!-- Features Checklist -->
            <ul class="space-y-3.5 text-xs sm:text-sm text-slate-700 font-bold">
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Semua materi (20+ Modul Lengkap)</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Standard + Focus Mode (Bebas Distraksi)</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Worksheet Aktivitas Siap Cetak</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Aktivitas & Kuis Tambahan</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Evaluasi & Laporan Pembelajaran</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Panduan Pendidik & Orang Tua</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#FF7315] shrink-0 mt-0.5" />
                <span>Materi Baru Setiap Bulan</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              @click="handleChoosePlan('premium')"
              class="btn-tactile-orange w-full py-4 px-6 rounded-full font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl"
            >
              <span>Mulai Premium</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- COLUMN 3: ARTWORK DIRECTLY ON BACKGROUND (NO CARD WRAPPER, NO DUPLICATE SPEECH BUBBLE) -->
        <div class="lg:col-span-4 flex flex-col items-center justify-center text-center space-y-4 relative py-4">
          <!-- Illustration Image -->
          <div class="w-full max-w-[360px] sm:max-w-[400px]">
            <img
              src="/Pricing_element.png"
              alt="Anak belajar gembira bersama Inkluvia"
              class="w-full h-auto object-contain hover:scale-105 transition-transform duration-500 drop-shadow-xl"
            />
          </div>

          <!-- Trust Badges -->
          <div class="space-y-2 pt-1 text-xs font-extrabold text-slate-600">
            <div class="flex items-center justify-center gap-2 bg-white/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-blue-100 shadow-2xs">
              <ShieldCheck class="w-4 h-4 text-emerald-500" />
              <span>Garansi Pembatalan Kapan Saja</span>
            </div>
            <div class="flex items-center justify-center gap-2 bg-white/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-blue-100 shadow-2xs">
              <Heart class="w-4 h-4 text-rose-500" />
              <span>100% Ramah Anak & Bebas Iklan</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ==================== FAQ ACCORDION SECTION ==================== -->
      <div class="bg-white rounded-3xl p-8 sm:p-12 border-2 border-blue-100 shadow-lg space-y-8 max-w-4xl mx-auto">
        <div class="text-center space-y-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#3587CE] text-xs font-black uppercase">
            <HelpCircle class="w-3.5 h-3.5" /> PERTANYAAN UMUM (FAQ)
          </span>
          <h2 class="text-2xl sm:text-3xl font-black text-[#0F3261]">
            Masih Punya Pertanyaan?
          </h2>
        </div>

        <div class="space-y-3">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="rounded-2xl border border-slate-200 overflow-hidden transition"
          >
            <button
              @click="toggleFaq(idx); playButtonPop()"
              class="w-full p-5 text-left font-extrabold text-sm sm:text-base text-[#0F3261] flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-blue-50/50 transition cursor-pointer"
            >
              <span>{{ faq.q }}</span>
              <ChevronDown :class="['w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200', openFaqIndex === idx ? 'rotate-180 text-[#3DA5FF]' : '']" />
            </button>
            <div v-if="openFaqIndex === idx" class="p-5 pt-1 bg-white text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ==================== CHECKOUT SIMULATION MODAL ==================== -->
    <Transition name="dropdown">
      <div v-if="showCheckoutModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-orange-200 relative animate-bubble-pop">
          <!-- Close Button -->
          <button
            @click="showCheckoutModal = false"
            class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>

          <!-- Modal Content -->
          <div class="text-center space-y-3">
            <div class="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF7315] to-[#e86105] text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30 text-2xl">
              🎁
            </div>
            <span class="inline-block px-3 py-1 rounded-full bg-orange-100 text-[#FF7315] text-xs font-black uppercase">
              AKTIVASI INKLUVIA PREMIUM
            </span>
            <h3 class="text-xl font-black text-[#0F3261]">
              {{ selectedPlan?.name }}
            </h3>
            <div class="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-center space-y-1">
              <p class="text-2xl font-black text-[#FF7315]">{{ selectedPlan?.price }} <span class="text-xs font-bold text-slate-500">{{ selectedPlan?.period }}</span></p>
              <p v-if="selectedPlan?.savings" class="text-xs font-extrabold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md inline-block">
                {{ selectedPlan?.savings }}
              </p>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <button
              @click="handleProceedCheckout"
              class="btn-tactile-orange w-full py-3.5 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Daftar Akun & Aktifkan Premium ➔</span>
            </button>
            <button
              @click="showCheckoutModal = false"
              class="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
