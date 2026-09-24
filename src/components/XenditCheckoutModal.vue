<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  X,
  Check,
  CheckCircle2,
  Copy,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  QrCode,
  Building2,
  Smartphone,
  CreditCard,
  Lock,
  ExternalLink,
  RefreshCw
} from '@lucide/vue'
import { createSandboxInvoice, simulateSandboxPayment, checkInvoiceStatus } from '../lib/xenditService'
import { currentUser } from '../lib/authService'
import { playButtonPop, playMascotChime } from '../lib/soundEffects'

const props = defineProps({
  show: { type: Boolean, default: false },
  plan: {
    type: Object,
    default: () => ({
      id: 'premium-monthly',
      name: 'Inkluvia Premium',
      amount: 47000,
      formattedPrice: 'Rp47.000',
      interval: 'bulan'
    })
  }
})

const emit = defineEmits(['close', 'success'])

const activeTab = ref('qris') // 'qris' | 'va' | 'ewallet'
const selectedBank = ref('BCA')
const ewalletPhone = ref('081234567890')
const ewalletChannel = ref('ovo')
const isProcessing = ref(false)
const isLoadingInvoice = ref(false)
const isCheckingStatus = ref(false)
const statusFeedback = ref('')
const isSuccess = ref(false)
const copied = ref(false)
const countdownSeconds = ref(900) // 15 menit
let timer = null
let pollingTimer = null

// Invoice state
const invoice = ref(null)

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value--
    } else {
      stopTimer()
    }
  }, 1000)
}

function stopStatusPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// Auto-polling status ke API Xendit setiap 3.5 detik
function startStatusPolling() {
  stopStatusPolling()
  pollingTimer = setInterval(async () => {
    if (isSuccess.value || !invoice.value?.id) return
    try {
      const res = await checkInvoiceStatus(invoice.value.id, invoice.value)
      if (res?.isPaid) {
        isSuccess.value = true
        stopTimer()
        stopStatusPolling()
        emit('success', res)
      }
    } catch (e) {
      // silent polling error
    }
  }, 3500)
}

const initInvoice = async () => {
  isSuccess.value = false
  isProcessing.value = false
  isLoadingInvoice.value = true
  statusFeedback.value = ''
  countdownSeconds.value = 900
  copied.value = false
  activeTab.value = 'qris'

  try {
    invoice.value = await createSandboxInvoice({
      planId: props.plan?.id || 'premium',
      planName: props.plan?.name || 'Inkluvia Premium',
      amount: props.plan?.amount || 47000,
      interval: props.plan?.interval || 'bulan',
      customerName: currentUser.value?.name || 'Pelajar Inkluvia',
      customerEmail: currentUser.value?.email || 'user@inkluvia.id'
    })
  } catch (err) {
    console.error('Failed to init Xendit invoice:', err)
  } finally {
    isLoadingInvoice.value = false
  }

  startStatusPolling()
}

watch(() => props.show, (val) => {
  if (val) {
    initInvoice()
    startTimer()
  } else {
    stopTimer()
    stopStatusPolling()
  }
}, { immediate: true })

onUnmounted(() => {
  stopTimer()
  stopStatusPolling()
})

const formattedCountdown = computed(() => {
  const m = Math.floor(countdownSeconds.value / 60)
  const s = countdownSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const currentVa = computed(() => {
  if (!invoice.value) return null
  return invoice.value.paymentMethods?.virtualAccounts?.find(v => v.bank === selectedBank.value) || invoice.value.paymentMethods?.virtualAccounts?.[0]
})

const copyToClipboard = (text) => {
  playButtonPop()
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text)
  }
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// Cek status manual dengan tombol
const handleCheckStatusManual = async () => {
  playButtonPop()
  if (!invoice.value?.id) return
  isCheckingStatus.value = true
  statusFeedback.value = 'Mengecek ke server Xendit...'

  try {
    const res = await checkInvoiceStatus(invoice.value.id, invoice.value)
    if (res?.isPaid) {
      statusFeedback.value = '✅ Pembayaran terkonfirmasi lunas!'
      isSuccess.value = true
      stopTimer()
      stopStatusPolling()
      emit('success', res)
    } else {
      statusFeedback.value = `Status saat ini: ${res?.status || 'PENDING'} (Belum terbayar)`
      setTimeout(() => {
        if (!isSuccess.value) statusFeedback.value = ''
      }, 4000)
    }
  } catch (err) {
    statusFeedback.value = 'Gagal memeriksa status. Coba lagi.'
  } finally {
    isCheckingStatus.value = false
  }
}

// Buka link resmi Xendit
const openXenditOfficialCheckout = () => {
  playButtonPop()
  if (invoice.value?.invoiceUrl) {
    window.open(invoice.value.invoiceUrl, '_blank')
  }
}

// Handler Simulasi Pembayaran Instan
const handleSimulatePayment = async (channel) => {
  playButtonPop()
  isProcessing.value = true

  try {
    const res = await simulateSandboxPayment(invoice.value, channel)
    if (res.success) {
      isSuccess.value = true
      stopTimer()
      stopStatusPolling()
      emit('success', res)
    }
  } catch (err) {
    console.error('Simulate payment error:', err)
  } finally {
    isProcessing.value = false
  }
}

const handleClose = () => {
  playButtonPop()
  stopStatusPolling()
  emit('close')
}
</script>

<template>
  <Transition name="dropdown">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
    >
      <div
        class="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-6 animate-bubble-pop flex flex-col max-h-[92vh]"
      >
        <!-- ==================== XENDIT SANDBOX HEADER ==================== -->
        <div class="bg-gradient-to-r from-[#0F3261] via-[#154687] to-[#0F3261] text-white p-5 sm:p-6 relative shrink-0">
          <!-- Top Sandbox Badge Row -->
          <div class="flex items-center justify-between gap-3 mb-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-sm">
              <span class="w-2 h-2 rounded-full bg-amber-900 animate-ping"></span>
              <span>Xendit Sandbox (Uji Coba)</span>
            </div>

            <!-- Close Button -->
            <button
              @click="handleClose"
              class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Merchant & Amount Info -->
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div class="flex items-center gap-1.5 text-xs text-blue-200 font-semibold">
                <ShieldCheck class="w-4 h-4 text-emerald-400" />
                <span>Inkluvia Edukasi Indonesia</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-white mt-1">
                {{ invoice?.planName || 'Inkluvia Premium' }}
              </h2>
              <p class="text-xs text-slate-300 font-mono mt-0.5">
                Invoice: {{ invoice?.id }}
              </p>
            </div>

            <!-- Total Price Tag -->
            <div class="text-left sm:text-right bg-white/10 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl">
              <span class="text-[11px] text-blue-200 block font-semibold">Total Pembayaran:</span>
              <span class="text-2xl sm:text-3xl font-black text-[#FFDC58] tracking-tight">
                {{ invoice?.formattedAmount }}
              </span>
            </div>
          </div>
        </div>

        <!-- ==================== MODAL BODY ==================== -->
        <div class="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left">
          
          <!-- STATE 0: LOADING INVOICE DARI XENDIT -->
          <div v-if="isLoadingInvoice" class="py-14 text-center space-y-3">
            <div class="w-12 h-12 border-4 border-[#3587CE] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-sm font-black text-[#0F3261]">Menghubungkan ke Gateway Xendit Sandbox...</p>
            <p class="text-xs text-slate-500">Menerbitkan tagihan resmi dengan Secret Key Anda</p>
          </div>

          <!-- STATE 1: PEMBAYARAN SUKSES CELEBRATION -->
          <div v-else-if="isSuccess" class="text-center py-6 sm:py-8 space-y-6">
            <div class="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-50 text-4xl animate-bounce-subtle">
              🎉
            </div>

            <div class="space-y-2 max-w-md mx-auto">
              <span class="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block uppercase">
                PEMBAYARAN TERVERIFIKASI XENDIT
              </span>
              <h3 class="text-2xl sm:text-3xl font-black text-[#0F3261]">
                Selamat Datang di Member PRO!
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Pembayaran Xendit Sandbox berhasil diselesaikan. Akun Anda kini memiliki lencana <strong class="text-amber-600 font-bold">👑 PRO</strong> dan akses penuh ke seluruh materi & mode belajar adaptif.
              </p>
            </div>

            <!-- Receipt Box -->
            <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200 max-w-sm mx-auto text-xs space-y-2">
              <div class="flex justify-between text-slate-500">
                <span>No. Invoice Xendit:</span>
                <span class="font-mono font-bold text-slate-800">{{ invoice?.id }}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Metode Pembayaran:</span>
                <span class="font-bold text-slate-800">{{ invoice?.paymentChannel || 'Xendit Sandbox Gateway' }}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Total:</span>
                <span class="font-bold text-emerald-600 text-sm">{{ invoice?.formattedAmount }}</span>
              </div>
              <div class="flex justify-between text-slate-500 border-t border-slate-200 pt-2">
                <span>Status Akun:</span>
                <span class="font-black text-amber-600 flex items-center gap-1">
                  <span>👑</span>
                  <span>MEMBER PRO AKTIF</span>
                </span>
              </div>
            </div>

            <div class="pt-2">
              <button
                @click="handleClose"
                class="btn-tactile-orange px-8 py-3.5 rounded-full font-black text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition"
              >
                <span>Mulai Belajar Materi PRO Sekarang</span>
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- STATE 2: METODE PEMBAYARAN SANDBOX -->
          <div v-else class="space-y-5">
            
            <!-- Real Xendit Checkout Official Banner -->
            <div
              v-if="invoice?.invoiceUrl"
              class="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
            >
              <div class="space-y-1 text-center sm:text-left">
                <div class="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-[#0F3261]">
                  <Sparkles class="w-4 h-4 text-amber-500" />
                  <span>Invoice Resmi Xendit Berhasil Dibuat</span>
                </div>
                <p class="text-[11px] text-slate-600 leading-tight">
                  Anda bisa membayar langsung di tab ini atau buka halaman resmi Xendit Staging.
                </p>
              </div>

              <button
                @click="openXenditOfficialCheckout"
                class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0F3261] hover:bg-[#154687] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 transition shrink-0"
              >
                <span>Buka Checkout Xendit</span>
                <ExternalLink class="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>

            <!-- Countdown & Realtime Status Bar -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <!-- Countdown -->
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                <div class="flex items-center gap-1.5 text-amber-900 font-bold">
                  <Clock class="w-3.5 h-3.5 text-amber-600 animate-spin" style="animation-duration: 4s;" />
                  <span>Batas Waktu:</span>
                </div>
                <div class="font-mono font-black text-amber-800 text-xs bg-white px-2 py-0.5 rounded border border-amber-200">
                  {{ formattedCountdown }}
                </div>
              </div>

              <!-- Realtime Check Status Button -->
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div class="flex items-center gap-1.5 text-slate-600 truncate max-w-[170px]">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span class="text-[11px] font-medium truncate">{{ statusFeedback || 'Status: PENDING' }}</span>
                </div>
                <button
                  @click="handleCheckStatusManual"
                  :disabled="isCheckingStatus"
                  class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0 disabled:opacity-50"
                >
                  <RefreshCw class="w-3 h-3 text-slate-500" :class="{ 'animate-spin': isCheckingStatus }" />
                  <span>{{ isCheckingStatus ? 'Cek...' : 'Cek Status' }}</span>
                </button>
              </div>
            </div>

            <!-- Payment Channels Nav Tabs -->
            <div class="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                @click="activeTab = 'qris'; playButtonPop()"
                :class="[
                  'py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeTab === 'qris'
                    ? 'bg-white text-[#0F3261] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                <QrCode class="w-4 h-4 text-[#3587CE]" />
                <span>QRIS</span>
              </button>

              <button
                @click="activeTab = 'va'; playButtonPop()"
                :class="[
                  'py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeTab === 'va'
                    ? 'bg-white text-[#0F3261] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                <Building2 class="w-4 h-4 text-[#FF7315]" />
                <span>Virtual Account</span>
              </button>

              <button
                @click="activeTab = 'ewallet'; playButtonPop()"
                :class="[
                  'py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeTab === 'ewallet'
                    ? 'bg-white text-[#0F3261] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                <Smartphone class="w-4 h-4 text-[#54AA1B]" />
                <span>E-Wallet</span>
              </button>
            </div>

            <!-- TAB 1: QRIS -->
            <div v-if="activeTab === 'qris'" class="space-y-5 text-center">
              <div class="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-blue-200 max-w-[280px] mx-auto space-y-3">
                <div class="text-[11px] font-black text-slate-500 tracking-wider">
                  QRIS STANDAR INDONESIA
                </div>
                
                <!-- Authentic Interactive QR Code Graphic -->
                <div class="bg-white p-3 rounded-2xl shadow-md border border-slate-200 inline-block relative group">
                  <svg class="w-44 h-44 text-slate-900 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                    <!-- Standard QR Code Patterns -->
                    <rect x="5" y="5" width="25" height="25" rx="3" fill="#0F3261"/>
                    <rect x="9" y="9" width="17" height="17" rx="2" fill="#fff"/>
                    <rect x="13" y="13" width="9" height="9" rx="1" fill="#0F3261"/>
                    
                    <rect x="70" y="5" width="25" height="25" rx="3" fill="#0F3261"/>
                    <rect x="74" y="9" width="17" height="17" rx="2" fill="#fff"/>
                    <rect x="78" y="13" width="9" height="9" rx="1" fill="#0F3261"/>

                    <rect x="5" y="70" width="25" height="25" rx="3" fill="#0F3261"/>
                    <rect x="9" y="74" width="17" height="17" rx="2" fill="#fff"/>
                    <rect x="13" y="78" width="9" height="9" rx="1" fill="#0F3261"/>

                    <!-- Internal Mock QR Pixels -->
                    <rect x="36" y="8" width="6" height="6" fill="#FF7315"/>
                    <rect x="46" y="8" width="8" height="6" fill="#0F3261"/>
                    <rect x="58" y="8" width="6" height="6" fill="#0F3261"/>

                    <rect x="36" y="20" width="12" height="6" fill="#0F3261"/>
                    <rect x="52" y="20" width="10" height="6" fill="#FF7315"/>

                    <rect x="8" y="36" width="6" height="8" fill="#0F3261"/>
                    <rect x="20" y="36" width="8" height="8" fill="#0F3261"/>
                    <rect x="36" y="36" width="28" height="28" rx="4" fill="#EBF4FE"/>
                    
                    <!-- Center Logo / Mascot -->
                    <text x="50" y="55" font-size="14" text-anchor="middle">🧊</text>

                    <rect x="70" y="36" width="8" height="8" fill="#0F3261"/>
                    <rect x="84" y="36" width="8" height="8" fill="#FF7315"/>

                    <rect x="36" y="70" width="8" height="8" fill="#0F3261"/>
                    <rect x="48" y="70" width="12" height="6" fill="#0F3261"/>
                    <rect x="64" y="70" width="8" height="8" fill="#FF7315"/>
                    <rect x="76" y="70" width="16" height="6" fill="#0F3261"/>
                    <rect x="70" y="82" width="12" height="10" fill="#0F3261"/>
                    <rect x="42" y="84" width="18" height="8" fill="#0F3261"/>
                  </svg>
                  <div class="text-[10px] font-bold text-slate-400 mt-1">NMID: ID102026XENDIT01</div>
                </div>

                <div class="text-[11px] text-slate-500 font-medium">
                  Scan dengan GoPay, OVO, Dana, ShopeePay, atau BCA Mobile
                </div>
              </div>

              <!-- Action Button Sandbox Simulation -->
              <button
                @click="handleSimulatePayment('QRIS')"
                :disabled="isProcessing"
                class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50"
              >
                <Zap class="w-4 h-4 text-amber-300" />
                <span v-if="!isProcessing">⚡ Simulasikan Scan QRIS Sukses (Sandbox)</span>
                <span v-else class="flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Memproses ke Xendit Sandbox...
                </span>
              </button>
            </div>

            <!-- TAB 2: VIRTUAL ACCOUNT -->
            <div v-else-if="activeTab === 'va'" class="space-y-4">
              <!-- Select Bank -->
              <div class="space-y-1.5">
                <label class="text-xs font-black text-[#0F3261] uppercase tracking-wider">
                  Pilih Bank Virtual Account:
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="va in invoice?.paymentMethods.virtualAccounts"
                    :key="va.bank"
                    @click="selectedBank = va.bank; playButtonPop()"
                    :class="[
                      'p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer',
                      selectedBank === va.bank
                        ? 'bg-blue-50 border-[#3587CE] text-[#3587CE] shadow-xs ring-2 ring-[#3587CE]/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    ]"
                  >
                    <span>{{ va.icon }}</span>
                    <span>{{ va.bank }}</span>
                  </button>
                </div>
              </div>

              <!-- VA Detail Box -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-500">Nomor Virtual Account ({{ selectedBank }}):</span>
                  <span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Auto Verifikasi</span>
                </div>
                
                <div class="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                  <span class="text-lg font-mono font-black text-slate-800 tracking-wider">
                    {{ currentVa?.accountNumber }}
                  </span>
                  <button
                    @click="copyToClipboard(currentVa?.accountNumber)"
                    class="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#3587CE] text-xs font-black transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
                    <Copy v-else class="w-3.5 h-3.5" />
                    <span>{{ copied ? 'Tersalin!' : 'Salin' }}</span>
                  </button>
                </div>

                <div class="text-[11px] text-slate-500 space-y-1">
                  <p>• Masukkan kode perusahaan atau transfer ke nomor VA di atas via ATM / m-Banking.</p>
                  <p>• Transaksi akan otomatis diverifikasi oleh Xendit dalam hitungan detik.</p>
                </div>
              </div>

              <!-- Action Button Sandbox Simulation -->
              <button
                @click="handleSimulatePayment(`${selectedBank}_VA`)"
                :disabled="isProcessing"
                class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
              >
                <Zap class="w-4 h-4 text-amber-300" />
                <span v-if="!isProcessing">⚡ Simulasikan Bayar VA {{ selectedBank }} Sukses</span>
                <span v-else class="flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Memverifikasi Transfer VA...
                </span>
              </button>
            </div>

            <!-- TAB 3: E-WALLET -->
            <div v-else-if="activeTab === 'ewallet'" class="space-y-4">
              <div class="space-y-2">
                <label class="text-xs font-black text-[#0F3261] uppercase tracking-wider">
                  Pilih Saluran E-Wallet:
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="ew in invoice?.paymentMethods.ewallets"
                    :key="ew.id"
                    @click="ewalletChannel = ew.id; playButtonPop()"
                    :class="[
                      'p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer',
                      ewalletChannel === ew.id
                        ? 'bg-orange-50 border-[#FF7315] text-[#FF7315] shadow-xs ring-2 ring-[#FF7315]/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    ]"
                  >
                    <span>{{ ew.icon }}</span>
                    <span>{{ ew.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Phone Input -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500">
                  Nomor Handphone Terdaftar di {{ ewalletChannel.toUpperCase() }}:
                </label>
                <input
                  v-model="ewalletPhone"
                  type="text"
                  placeholder="081234567890"
                  class="w-full bg-slate-50 border border-slate-200 focus:border-[#FF7315] focus:bg-white text-sm px-4 py-3 rounded-xl font-mono focus:outline-none transition"
                />
              </div>

              <!-- Action Button Sandbox Simulation -->
              <button
                @click="handleSimulatePayment(`${ewalletChannel.toUpperCase()}`)"
                :disabled="isProcessing"
                class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF7315] to-[#E86105] hover:from-[#ff812d] hover:to-[#f06809] text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-orange-500/25 transition active:scale-95 disabled:opacity-50"
              >
                <Zap class="w-4 h-4 text-amber-200" />
                <span v-if="!isProcessing">⚡ Simulasikan Konfirmasi {{ ewalletChannel.toUpperCase() }} Sukses</span>
                <span v-else class="flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Memproses E-Wallet Sandbox...
                </span>
              </button>
            </div>

            <!-- Trust Footer Notice -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span class="flex items-center gap-1.5">
                <Lock class="w-3 h-3 text-slate-400" />
                <span>Enkripsi TLS 256-bit Xendit</span>
              </span>
              <span>PCI-DSS Level 1 Certified</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>
