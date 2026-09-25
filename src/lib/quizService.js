// Service untuk Pengelolaan Asesmen, Rekor Skor Tertinggi, dan Leaderboard per Materi
import { supabase, isSupabaseConfigured } from './supabaseClient'

const HIGH_SCORE_STORAGE_KEY = 'inkluvia_quiz_high_scores_v1'
const LEADERBOARD_PREFIX = 'inkluvia_leaderboard_'

/**
 * Format durasi detik menjadi string MM:SS
 */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0))
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Ambil semua rekor skor user dari localStorage
 */
export function getAllUserHighScores(userKey = 'guest') {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    return data[userKey] || {}
  } catch (err) {
    console.error('Gagal membaca high scores:', err)
    return {}
  }
}

/**
 * Ambil rekor skor tertinggi user untuk materi tertentu
 */
export function getUserMateriHighScore(userKey = 'guest', materiId) {
  if (!materiId) return null
  const userScores = getAllUserHighScores(userKey)
  return userScores[materiId] || null
}

/**
 * Simpan hasil kuis dengan sistem REKOR SKOR TERTINGGI (High Score)
 * Hanya memperbarui jika skor baru lebih tinggi, atau skor sama dengan waktu lebih cepat.
 * Tidak melakukan stack atau akumulasi.
 */
export function saveQuizAttempt(userKey = 'guest', materiId, attemptData) {
  if (!materiId) return { isNewHighScore: false, record: null }

  const {
    score = 0,
    totalPoints = 100,
    timeSeconds = 0,
    correctCount = 0,
    totalQuestions = 0
  } = attemptData

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
  const existingRecord = getUserMateriHighScore(userKey, materiId)

  let isNewHighScore = false
  let isFasterSameScore = false

  if (!existingRecord) {
    isNewHighScore = true
  } else if (score > existingRecord.score) {
    isNewHighScore = true
  } else if (score === existingRecord.score && timeSeconds < (existingRecord.timeSeconds || 999999)) {
    isFasterSameScore = true
  }

  // Jika mencapai rekor baru (skor lebih tinggi atau sama tapi lebih cepat)
  if (isNewHighScore || isFasterSameScore) {
    try {
      const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY)
      const data = raw ? JSON.parse(raw) : {}
      if (!data[userKey]) data[userKey] = {}

      data[userKey][materiId] = {
        score,
        totalPoints,
        percentage,
        timeSeconds,
        correctCount,
        totalQuestions,
        achievedAt: new Date().toISOString()
      }

      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(data))
      return {
        isNewHighScore: true,
        previousRecord: existingRecord,
        currentRecord: data[userKey][materiId]
      }
    } catch (err) {
      console.error('Gagal menyimpan rekor skor:', err)
    }
  }

  return {
    isNewHighScore: false,
    previousRecord: existingRecord,
    currentRecord: existingRecord
  }
}

/**
 * Ambil Leaderboard dari Supabase Cloud Database (sinkronisasi antar-device)
 * Mengambil data leaderboard yang tersimpan di kolom assessment.leaderboard tabel materi
 */
export async function fetchMateriLeaderboardFromSupabase(materiId) {
  if (!materiId) return []
  const key = `${LEADERBOARD_PREFIX}${materiId}`

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('materi')
        .select('assessment')
        .eq('id', materiId)
        .single()

      if (!error && data?.assessment?.leaderboard) {
        const cloudList = Array.isArray(data.assessment.leaderboard) ? data.assessment.leaderboard : []
        const cleanList = cloudList.filter(
          item => !item.id?.startsWith('seed-') && !item.userId?.startsWith('seed-')
        )
        const sorted = sortLeaderboard(cleanList)
        localStorage.setItem(key, JSON.stringify(sorted))
        return sorted
      }
    } catch (err) {
      console.warn('[QuizService] Gagal fetch leaderboard dari Supabase, menggunakan cache lokal:', err)
    }
  }

  return getMateriLeaderboard(materiId)
}

/**
 * Sinkronisasi data leaderboard ke Supabase Cloud
 */
export async function syncLeaderboardToSupabase(materiId, leaderboardList) {
  if (!isSupabaseConfigured || !materiId) return
  try {
    const { data: item, error: getErr } = await supabase
      .from('materi')
      .select('assessment')
      .eq('id', materiId)
      .single()

    if (getErr || !item) {
      console.warn('[QuizService] Gagal membaca materi di Supabase:', getErr?.message)
      return
    }

    const currentAssessment = item.assessment || {}
    currentAssessment.leaderboard = leaderboardList

    const { error: updateErr } = await supabase
      .from('materi')
      .update({ assessment: currentAssessment })
      .eq('id', materiId)

    if (updateErr) {
      console.warn('[QuizService] Gagal update leaderboard di Supabase:', updateErr.message)
    } else {
      console.log(`[QuizService] ✅ Leaderboard materi ${materiId} tersinkronisasi ke Supabase Cloud (${leaderboardList.length} peserta)`)
    }
  } catch (err) {
    console.warn('[QuizService] Error sync leaderboard ke Supabase:', err)
  }
}

/**
 * Ambil Leaderboard untuk materi tertentu (Cache Lokal instan)
 * Murni dinamis: jika belum ada yang mengerjakan, kembalikan array kosong []
 * Urutan:
 * 1. Skor Tertinggi (descending)
 * 2. Waktu Tercepat (ascending)
 */
export function getMateriLeaderboard(materiId) {
  if (!materiId) return []
  const key = `${LEADERBOARD_PREFIX}${materiId}`
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const list = JSON.parse(raw)
      const realList = (Array.isArray(list) ? list : []).filter(
        item => !item.id?.startsWith('seed-') && !item.userId?.startsWith('seed-')
      )
      if (realList.length !== list.length) {
        localStorage.setItem(key, JSON.stringify(realList))
      }
      return sortLeaderboard(realList)
    }
    return []
  } catch (err) {
    console.error('Gagal membaca leaderboard materi:', err)
    return []
  }
}

/**
 * Sortir data leaderboard: skor tertinggi lalu waktu tercepat
 */
function sortLeaderboard(list) {
  return [...list].sort((a, b) => {
    // 1. Skor tertinggi
    if (b.score !== a.score) {
      return b.score - a.score
    }
    // 2. Waktu tercepat (detik paling sedikit)
    if (a.timeSeconds !== b.timeSeconds) {
      return a.timeSeconds - b.timeSeconds
    }
    // 3. Waktu submit lebih awal
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  })
}

/**
 * Masukkan atau perbarui skor user di Leaderboard materi
 * Menggunakan prinsip High Score: hanya memperbarui jika skor user lebih baik atau waktu lebih cepat.
 * Menyimpan ke Cache Lokal DAN Sinkronisasi ke Supabase Cloud Database.
 */
export function submitToMateriLeaderboard(materiId, entry) {
  if (!materiId || !entry) return { rank: 0, leaderboard: [] }
  const key = `${LEADERBOARD_PREFIX}${materiId}`
  try {
    const currentList = getMateriLeaderboard(materiId)
    const userIdentifier = entry.userId || entry.userName

    // Cari apakah user ini sudah ada di leaderboard materi ini
    const existingIndex = currentList.findIndex(
      item => (item.userId && item.userId === entry.userId) || item.userName === entry.userName
    )

    if (existingIndex >= 0) {
      const old = currentList[existingIndex]
      const isBetterScore = entry.score > old.score
      const isFasterSameScore = entry.score === old.score && entry.timeSeconds < old.timeSeconds

      if (isBetterScore || isFasterSameScore) {
        currentList[existingIndex] = {
          ...old,
          ...entry,
          submittedAt: new Date().toISOString()
        }
      }
    } else {
      // Masukkan entri baru
      currentList.push({
        id: `lb-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        ...entry,
        submittedAt: new Date().toISOString()
      })
    }

    const sorted = sortLeaderboard(currentList)
    localStorage.setItem(key, JSON.stringify(sorted))

    // Asynchronous Cloud Sync ke Supabase (tidak memblokir UI)
    syncLeaderboardToSupabase(materiId, sorted).catch(() => {})

    // Temukan ranking user saat ini
    const rank = sorted.findIndex(
      item => (item.userId && item.userId === entry.userId) || item.userName === entry.userName
    ) + 1

    return {
      rank,
      leaderboard: sorted
    }
  } catch (err) {
    console.error('Gagal memperbarui leaderboard:', err)
    return { rank: 0, leaderboard: [] }
  }
}
