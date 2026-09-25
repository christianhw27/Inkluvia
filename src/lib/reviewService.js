import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from './supabaseClient.js'

const REVIEWS_STORAGE_KEY = 'inkluvia_user_site_reviews_v1'
const SUPABASE_SYSTEM_ROW_ID = 'site-feedback-reviews'

// Baseline ulasan nyata awal yang tampil di landing page
export const BASELINE_REVIEWS = [
  {
    id: 'base-1',
    userName: 'Bu Ratna',
    userRole: 'Guru Kelas Inklusi SD',
    userAvatar: '👩‍🏫',
    rating: 5,
    comment: 'Materi visual Inkluvia sangat membantu murid-murid saya yang butuh waktu adaptasi lebih lama. Mereka jadi lebih fokus karena ritme belajarnya tenang dan tidak menuntut.',
    isBaseline: true
  },
  {
    id: 'base-2',
    userName: 'Dimas P.',
    userRole: 'Orang Tua Murid Usia 6 Tahun',
    userAvatar: '👨‍👦',
    rating: 5,
    comment: 'Anak saya sering frustrasi saat belajar membaca di buku biasa. Lewat narasi suara dan karakter es batu di Inkluvia, dia justru berinisiatif belajar sendiri tiap sore.',
    isBaseline: true
  },
  {
    id: 'base-3',
    userName: 'Nadia S., M.Psi.',
    userRole: 'Praktisi Perkembangan Anak',
    userAvatar: '👩‍⚕️',
    rating: 5,
    comment: 'Pilihan warna kontras yang lembut serta navigasi minim distraksi membuat platform ini aman direkomendasikan untuk anak-anak dengan spektrum perhatian terbatas.',
    isBaseline: true
  }
]

// State reaktif daftar ulasan pengguna
export const userReviewsList = ref(loadCachedUserReviews())

/**
 * Membaca ulasan dari cache lokal
 */
function loadCachedUserReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('Gagal membaca cache ulasan:', err)
  }
  return []
}

/**
 * Menyimpan ulasan ke cache lokal
 */
function saveCachedUserReviews(reviews) {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  } catch (err) {
    console.warn('Gagal menyimpan cache ulasan:', err)
  }
}

/**
 * Mengambil gabungan seluruh ulasan untuk ditampilkan di Landing Page:
 * Ulasan pengguna nyata diletakkan di depan (paling baru), disusul oleh ulasan baseline pendukung.
 */
export function getAllDisplayReviews() {
  const custom = userReviewsList.value || []
  return [...custom, ...BASELINE_REVIEWS]
}

/**
 * Mengambil ulasan spesifik milik seorang user (jika pernah memberikan ulasan)
 */
export function getUserReview(userId) {
  if (!userId) return null
  return userReviewsList.value.find(
    item => item.userId === userId || (item.userEmail && item.userEmail === userId)
  ) || null
}

/**
 * Menarik ulasan terbaru dari Supabase Cloud Database
 */
export async function fetchSiteReviewsFromSupabase() {
  if (!isSupabaseConfigured) return getAllDisplayReviews()

  try {
    const { data, error } = await supabase
      .from('materi')
      .select('assessment')
      .eq('id', SUPABASE_SYSTEM_ROW_ID)
      .single()

    if (!error && data?.assessment?.reviews && Array.isArray(data.assessment.reviews)) {
      userReviewsList.value = data.assessment.reviews
      saveCachedUserReviews(data.assessment.reviews)
      console.log(`[ReviewService] ✅ Sinkronisasi ${data.assessment.reviews.length} ulasan dari Supabase Cloud`)
      return getAllDisplayReviews()
    }
  } catch (err) {
    console.warn('[ReviewService] Gagal fetch ulasan dari Supabase:', err)
  }

  return getAllDisplayReviews()
}

/**
 * Menyimpan atau memperbarui ulasan user:
 * - 1 User = 1 Ulasan (dapat diedit kapan saja)
 * - Tersimpan secara permanen di Supabase Cloud Database + Cache Lokal
 */
export async function saveUserReview(reviewInput) {
  const {
    userId,
    userEmail,
    userName = 'Pengguna Inkluvia',
    userAvatar = '👧',
    userRole = 'Orang Tua / Siswa',
    rating = 5,
    comment = ''
  } = reviewInput

  if (!userId) {
    return { success: false, error: 'User ID tidak ditemukan. Silakan login terlebih dahulu.' }
  }

  if (!comment.trim()) {
    return { success: false, error: 'Silakan isi ulasan Anda terlebih dahulu.' }
  }

  const existingIndex = userReviewsList.value.findIndex(
    item => item.userId === userId || (item.userEmail && item.userEmail === userEmail)
  )

  const reviewRecord = {
    id: existingIndex >= 0 ? userReviewsList.value[existingIndex].id : `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    userEmail: userEmail || '',
    userName: userName.trim() || 'Pengguna Inkluvia',
    userAvatar: userAvatar || '👧',
    userRole: userRole.trim() || 'Orang Tua / Siswa',
    rating: Math.max(1, Math.min(5, Math.round(Number(rating) || 5))),
    comment: comment.trim(),
    updatedAt: new Date().toISOString()
  }

  const updatedList = [...userReviewsList.value]
  if (existingIndex >= 0) {
    updatedList[existingIndex] = reviewRecord
  } else {
    updatedList.unshift(reviewRecord) // Taruh ulasan baru di paling atas
  }

  // 1. Simpan ke State dan Cache Lokal
  userReviewsList.value = updatedList
  saveCachedUserReviews(updatedList)

  // 2. Sinkronisasi ke Supabase Cloud Database
  if (isSupabaseConfigured) {
    try {
      const { error: upsertErr } = await supabase
        .from('materi')
        .upsert({
          id: SUPABASE_SYSTEM_ROW_ID,
          title: 'Ulasan & Testimoni Pengguna Inkluvia',
          jenjang: 'SYSTEM',
          mata_pelajaran: 'SYSTEM',
          level: 'SYSTEM',
          badge: 'SYSTEM',
          description: 'System container for dynamic user reviews on landing page',
          assessment: { reviews: updatedList }
        })

      if (upsertErr) {
        console.warn('[ReviewService] Gagal upsert ke Supabase:', upsertErr.message)
      } else {
        console.log('[ReviewService] ✅ Ulasan pengguna berhasil disimpan di Supabase Cloud Database!')
      }
    } catch (err) {
      console.warn('[ReviewService] Error sync ulasan ke Supabase:', err)
    }
  }

  return { success: true, review: reviewRecord }
}

/**
 * Menghapus ulasan milik pengguna
 */
export async function deleteUserReview(userId) {
  if (!userId) return { success: false }

  const filtered = userReviewsList.value.filter(
    item => item.userId !== userId && item.userEmail !== userId
  )

  userReviewsList.value = filtered
  saveCachedUserReviews(filtered)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('materi')
        .upsert({
          id: SUPABASE_SYSTEM_ROW_ID,
          title: 'Ulasan & Testimoni Pengguna Inkluvia',
          jenjang: 'SYSTEM',
          mata_pelajaran: 'SYSTEM',
          level: 'SYSTEM',
          badge: 'SYSTEM',
          description: 'System container for dynamic user reviews on landing page',
          assessment: { reviews: filtered }
        })
      console.log('[ReviewService] ✅ Ulasan pengguna berhasil dihapus dari Supabase')
    } catch (err) {
      console.warn('[ReviewService] Error menghapus ulasan di Supabase:', err)
    }
  }

  return { success: true }
}
