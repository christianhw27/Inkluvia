/**
 * Xendit Payment Gateway Integration (Sandbox Mode)
 * Digunakan untuk menangani checkout, simulasi pembayaran sandbox (QRIS, Virtual Account, E-Wallet),
 * serta auto-upgrade pengguna ke tier Inkluvia Premium PRO.
 */

import { currentUser, upgradeCurrentUserToPro } from './authService'
import { playMascotChime } from './soundEffects'

// Storage key untuk riwayat transaksi Xendit lokal
const TRANSACTIONS_STORAGE_KEY = 'inkluvia_xendit_transactions_v1'

// Konfigurasi Xendit Sandbox
export const XENDIT_CONFIG = {
  mode: 'sandbox',
  merchantName: 'Inkluvia Edukasi Indonesia',
  publicKey: import.meta.env.VITE_XENDIT_PUBLIC_KEY || 'xnd_public_development_inkluvia_sandbox',
  currency: 'IDR',
  expiryMinutes: 15
}

/**
 * Buat Invoice Baru ke Xendit Sandbox
 * Memanggil backend proxy (/api/xendit/create-invoice) yang terhubung ke server resmi Xendit Sandbox
 */
export async function createSandboxInvoice({
  planId = 'premium-monthly',
  planName = 'Inkluvia Premium',
  amount = 47000,
  interval = 'bulan',
  customerName = '',
  customerEmail = ''
} = {}) {
  const user = currentUser.value
  const name = customerName || user?.name || 'Pelajar Inkluvia'
  const email = (customerEmail || user?.email || 'user@inkluvia.id').toLowerCase()

  // Data default / fallback
  let invoiceId = `INV-XND-${Date.now().toString().slice(-8)}`
  let invoiceUrl = null
  let xenditData = null

  try {
    const res = await fetch('/api/xendit/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        planName,
        amount,
        interval,
        customerName: name,
        customerEmail: email
      })
    })

    if (res.ok) {
      const data = await res.json()
      if (data && data.id) {
        invoiceId = data.id
        invoiceUrl = data.invoice_url
        xenditData = data
      }
    }
  } catch (err) {
    console.warn('[Xendit Service] Backend proxy not reachable, using local sandbox fallback:', err)
  }

  const createdAt = xenditData?.created || new Date().toISOString()
  const expiresAt = xenditData?.expiry_date || new Date(Date.now() + XENDIT_CONFIG.expiryMinutes * 60 * 1000).toISOString()

  // Generate authentic Sandbox Virtual Accounts
  const virtualAccounts = [
    { bank: 'BCA', bankName: 'Bank Central Asia', accountNumber: '8808' + Date.now().toString().slice(-8) + '12', icon: '🏦' },
    { bank: 'MANDIRI', bankName: 'Bank Mandiri', accountNumber: '8908' + Date.now().toString().slice(-8) + '34', icon: '🏛️' },
    { bank: 'BRI', bankName: 'Bank Rakyat Indonesia', accountNumber: '7808' + Date.now().toString().slice(-8) + '56', icon: '🏢' },
    { bank: 'BNI', bankName: 'Bank Negara Indonesia', accountNumber: '9808' + Date.now().toString().slice(-8) + '78', icon: '🏛️' }
  ]

  // QRIS payload string (standar QRIS)
  const qrisPayload = `00020101021226680016ID.CO.XENDIT.WWW01189360099900000000000215${invoiceId}520458125303360540${amount}5802ID5925INKLUVIA EDUKASI ID6007JAKARTA6304`

  const invoice = {
    id: invoiceId,
    invoiceUrl,
    isRealXendit: Boolean(invoiceUrl),
    status: xenditData?.status || 'PENDING', // PENDING | PAID | SETTLED | EXPIRED
    mode: 'SANDBOX',
    planId,
    planName,
    amount,
    currency: 'IDR',
    formattedAmount: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount),
    interval,
    customer: {
      name,
      email
    },
    paymentMethods: {
      qris: {
        supported: true,
        qrString: qrisPayload,
        merchantName: XENDIT_CONFIG.merchantName
      },
      virtualAccounts,
      ewallets: [
        { id: 'ovo', name: 'OVO', icon: '🟣' },
        { id: 'dana', name: 'DANA', icon: '🔵' },
        { id: 'shopeepay', name: 'ShopeePay', icon: '🟠' }
      ]
    },
    createdAt,
    expiresAt
  }

  saveTransaction(invoice)
  return invoice
}

/**
 * Cek status invoice langsung ke API Xendit Sandbox
 * @param {string} invoiceId
 * @param {object} invoice
 */
export async function checkInvoiceStatus(invoiceId, invoice) {
  if (!invoiceId) return { isPaid: false }

  try {
    const res = await fetch(`/api/xendit/invoice-status?id=${encodeURIComponent(invoiceId)}`)
    if (res.ok) {
      const data = await res.json()
      const isPaid = data.status === 'PAID' || data.status === 'SETTLED'
      
      if (isPaid) {
        const updatedInvoice = {
          ...(invoice || {}),
          id: invoiceId,
          status: 'PAID',
          paidAt: data.paid_at || new Date().toISOString(),
          paymentChannel: data.payment_method || data.payment_channel || 'Xendit Gateway'
        }

        saveTransaction(updatedInvoice)

        // Upgrade profil user saat ini menjadi PRO
        await upgradeCurrentUserToPro({
          planName: invoice?.planName || 'Inkluvia Premium',
          invoiceId,
          paymentMethod: `Xendit Sandbox (${data.payment_method || 'Resmi'})`
        })

        playMascotChime()

        return {
          isPaid: true,
          status: 'PAID',
          invoice: updatedInvoice,
          message: 'Pembayaran terverifikasi lunas oleh Xendit!'
        }
      }

      return {
        isPaid: false,
        status: data.status || 'PENDING'
      }
    }
  } catch (err) {
    console.warn('[Xendit Service] Gagal mengecek status realtime:', err)
  }

  return { isPaid: false, status: 'PENDING' }
}

/**
 * Simulasikan Pembayaran Berhasil di Xendit Sandbox
 * @param {string} invoiceId
 * @param {string} channel 'QRIS' | 'BCA_VA' | 'MANDIRI_VA' | 'OVO' | dll
 */
export async function simulateSandboxPayment(invoice, channel = 'QRIS') {
  // Simulasi network delay autentik gateway Xendit (800ms)
  await new Promise(resolve => setTimeout(resolve, 800))

  const paidAt = new Date().toISOString()
  const updatedInvoice = {
    ...invoice,
    status: 'PAID',
    paymentChannel: channel,
    paidAt,
    xenditReference: `xnd_sim_${Date.now()}`
  }

  // Simpan update invoice ke storage
  saveTransaction(updatedInvoice)

  // Upgrade profil user saat ini menjadi PRO
  await upgradeCurrentUserToPro({
    planName: invoice.planName,
    invoiceId: invoice.id,
    paymentMethod: `Xendit Sandbox (${channel})`
  })

  // Play audio sound efek berhasil
  playMascotChime()

  return {
    success: true,
    invoice: updatedInvoice,
    message: 'Pembayaran Xendit Sandbox Berhasil! Akun Anda telah diupgrade ke PRO.'
  }
}

/**
 * Simpan transaksi ke localStorage
 */
function saveTransaction(invoice) {
  try {
    const list = getStoredTransactions()
    const index = list.findIndex(i => i.id === invoice.id)
    if (index >= 0) {
      list[index] = invoice
    } else {
      list.unshift(invoice)
    }
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save Xendit transaction:', e)
  }
}

/**
 * Ambil semua transaksi
 */
export function getStoredTransactions() {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load Xendit transactions:', e)
  }
  return []
}

/**
 * Cek apakah user tertentu pernah membayar PRO
 */
export function hasUserPurchasedPro(email) {
  if (!email) return false
  const cleanEmail = email.trim().toLowerCase()
  const list = getStoredTransactions()
  return list.some(item => item.customer?.email?.toLowerCase() === cleanEmail && item.status === 'PAID')
}
