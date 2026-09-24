/**
 * Layanan Konfigurasi Paket & Harga Inkluvia
 * Memungkinkan Admin mengelola harga langganan bulanan/tahunan, persentase diskon, dan fitur paket.
 * Perubahan tersimpan secara persisten dan langsung disinkronkan ke tab Harga serta invoice Xendit.
 */

import { ref, computed } from 'vue'

const PRICING_STORAGE_KEY = 'inkluvia_pricing_config_v1'

export const DEFAULT_PRICING_CONFIG = {
  currency: 'IDR',
  freeTier: {
    name: 'Free',
    subtitle: 'PEMULA',
    price: 0,
    formattedPrice: 'Rp0',
    interval: 'selamanya',
    features: [
      'Akses 1 materi modul dasar',
      'Standard Mode (Ceria & Suara)',
      'Fitur dasar pembelajaran'
    ]
  },
  premiumTier: {
    name: 'Inkluvia Premium',
    subtitle: 'INKLUVIA PREMIUM',
    popularBadge: 'Paling Populer',
    monthlyPrice: 59000,
    yearlyPrice: 564000, // Rp47.000 / bulan (Hemat 20%)
    discountPercent: 20,
    discountBadge: 'HEMAT 20% 🏷️',
    activePromoName: 'Diskon Belajar Cerdas',
    features: [
      'Semua materi (20+ Modul Lengkap)',
      'Standard + Focus Mode (Bebas Distraksi)',
      'Worksheet Aktivitas Siap Cetak',
      'Aktivitas & Kuis Tambahan',
      'Evaluasi & Laporan Pembelajaran',
      'Panduan Pendidik & Orang Tua',
      'Materi Baru Setiap Bulan'
    ]
  }
}

function loadPricingConfig() {
  try {
    const raw = localStorage.getItem(PRICING_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_PRICING_CONFIG,
        ...parsed,
        freeTier: { ...DEFAULT_PRICING_CONFIG.freeTier, ...(parsed.freeTier || {}) },
        premiumTier: { ...DEFAULT_PRICING_CONFIG.premiumTier, ...(parsed.premiumTier || {}) }
      }
    }
  } catch (e) {
    console.error('Failed to parse pricing config:', e)
  }
  return JSON.parse(JSON.stringify(DEFAULT_PRICING_CONFIG))
}

export const pricingConfig = ref(loadPricingConfig())

/**
 * Format mata uang Rupiah
 */
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(amount) || 0)
}

/**
 * Simpan konfigurasi harga baru
 */
export function savePricingConfig(newConfig) {
  try {
    const validated = {
      ...pricingConfig.value,
      ...newConfig,
      premiumTier: {
        ...pricingConfig.value.premiumTier,
        ...(newConfig.premiumTier || {}),
        monthlyPrice: Math.max(1000, Number(newConfig.premiumTier?.monthlyPrice) || 59000),
        yearlyPrice: Math.max(1000, Number(newConfig.premiumTier?.yearlyPrice) || 564000),
        discountPercent: Math.max(0, Math.min(100, Number(newConfig.premiumTier?.discountPercent) || 0))
      }
    }
    pricingConfig.value = validated
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(validated))
    return { success: true, config: validated }
  } catch (e) {
    console.error('Failed to save pricing config:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Kembalikan ke pengaturan harga awal (default)
 */
export function resetPricingConfig() {
  try {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_PRICING_CONFIG))
    pricingConfig.value = fresh
    localStorage.removeItem(PRICING_STORAGE_KEY)
    return { success: true, config: fresh }
  } catch (e) {
    console.error('Failed to reset pricing config:', e)
    return { success: false, error: e.message }
  }
}
