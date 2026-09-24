import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'inkluvia_materi_list_v3'

export const RELIABLE_MODE_VIDEOS = {
  standard: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
  slow: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4',
  high_contrast: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
  focus: 'https://www.w3schools.com/html/mov_bbb.mp4'
}

/**
 * Sanitize video URL — HANYA replace URL Google commondatastorage yang sudah 403.
 * URL Cloudinary, URL custom, dan string kosong ('') dibiarkan apa adanya.
 */
export function sanitizeVideoUrl(url, mode = 'standard') {
  if (typeof url === 'string' && (url.includes('commondatastorage.googleapis.com') || url.includes('gtv-videos-bucket'))) {
    return RELIABLE_MODE_VIDEOS[mode] || RELIABLE_MODE_VIDEOS.standard
  }
  // Jika URL valid (Cloudinary, custom, dsb) atau kosong — kembalikan apa adanya
  return url || ''
}

/**
 * Sanitize seluruh content video di satu item materi.
 * Hanya mengganti URL Google commondatastorage yang 403, tidak menimpa URL lain.
 */
export function sanitizeMateriItem(item) {
  if (!item) return item
  const clean = { ...item }
  const modes = [
    { key: 'standardContent', mode: 'standard' },
    { key: 'slowContent', mode: 'slow' },
    { key: 'highContrastContent', mode: 'high_contrast' },
    { key: 'focusContent', mode: 'focus' }
  ]
  for (const { key, mode } of modes) {
    if (clean[key] && clean[key].videoUrl) {
      clean[key] = {
        ...clean[key],
        videoUrl: sanitizeVideoUrl(clean[key].videoUrl, mode)
      }
    }
  }
  return clean
}

const initialMateri = [
  {
    id: 'materi-1',
    title: 'Petualangan Si Es Batu',
    jenjang: 'SD',
    mataPelajaran: 'IPAS',
    level: 'IPAS • Kelas IV • Fase B',
    badge: 'Gratis',
    image: '/es_batu_card.jpg',
    description: 'Yuk ikuti perjalanan Es Batu dan temukan bagaimana benda dapat berubah wujud!',
    types: ['Video', 'Interaktif', 'Worksheet'],
    duration: '± 4 menit',
    activityType: 'Video + Aktivitas',
    learningOptions: '4 Mode Belajar (Standar, Slow, High Contrast, Focus)',
    learningPoints: [
      { id: 'lp-1', title: 'Mencair' },
      { id: 'lp-2', title: 'Menguap' },
      { id: 'lp-3', title: 'Mengembun' }
    ],
    standardContent: {
      title: 'Petualangan Si Es Batu (Standar)',
      text: 'Yuk ikuti perjalanan Es Batu dan temukan bagaimana benda dapat berubah wujud dari padat, cair, hingga gas!',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4'
    },
    slowContent: {
      title: 'Petualangan Si Es Batu (Slow)',
      text: 'Es batu dipanaskan secara perlahan... berubah menjadi air cair, lalu menguap menjadi gas di udara.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4'
    },
    highContrastContent: {
      title: 'PERUBAHAN WUJUD BENDA',
      text: 'ES BATU (PADAT) -> AIR (CAIR) -> UAP (GAS). PROSES MENCAIR, MENGUAP, DAN MENGEMBUN.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4'
    },
    focusContent: {
      title: 'Es Batu = Perubahan Wujud',
      text: 'Es batu (Padat) → Air (Cair) → Uap (Gas). Kamu hebat sudah belajar hari ini!',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    assessment: {
      title: 'Asesmen Pemahaman Materi Es Batu',
      questions: [
        {
          id: 'q-1',
          questionText: 'Apa yang terjadi pada es batu padat ketika dipanaskan?',
          options: [
            'Mencair menjadi air cair',
            'Membeku menjadi es batu keras',
            'Menjadi batu besar',
            'Tidak terjadi perubahan'
          ],
          correctOptionIndex: 0
        },
        {
          id: 'q-2',
          questionText: 'Proses perubahan wujud air cair menjadi uap gas disebut...',
          options: [
            'Mencair',
            'Menguap',
            'Mengembun',
            'Membeku'
          ],
          correctOptionIndex: 1
        },
        {
          id: 'q-3',
          questionText: 'Ketika uap air mengenai udara dingin, uap berubah menjadi titik air. Proses ini disebut...',
          options: [
            'Mengembun',
            'Menguap',
            'Mencair',
            'Menyublim'
          ],
          correctOptionIndex: 0
        }
      ]
    }
  },
  {
    id: 'materi-2',
    title: 'Berhitung Bersama Sahabat Hutan',
    jenjang: 'SD',
    mataPelajaran: 'Matematika',
    level: 'Matematika • Kelas I • Fase A',
    badge: 'Pro',
    image: '/Banner_Materi.jpg',
    description: 'Memahami konsep penjumlahan dasar melalui animasi buah-buahan dan benda sekitar.',
    types: ['Visual Interaktif', 'Sentuhan Ringan'],
    duration: '± 5 menit',
    activityType: 'Video + Aktivitas',
    learningOptions: '4 Mode Belajar (Standar, Slow, High Contrast, Focus)',
    learningPoints: [
      { id: 'lp-2-1', title: 'Mengenal Angka 1-10' },
      { id: 'lp-2-2', title: 'Penjumlahan Bergambar' }
    ],
    standardContent: {
      title: 'Berhitung Bersama Sahabat Hutan (Standar)',
      text: 'Ayo berhitung bersama kelinci dan tupai ceria di hutan ajaib!',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4'
    },
    slowContent: {
      title: 'Berhitung Bersama Sahabat Hutan (Slow)',
      text: 'Satu apel... ditambah satu apel... menjadi dua apel.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4'
    },
    highContrastContent: {
      title: 'PENJUMLAHAN DASAR',
      text: '1 + 1 = 2. AYO BERHITUNG BERSAMA.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4'
    },
    focusContent: {
      title: 'Konsep Angka',
      text: '1 + 1 = 2. Fokus pada jumlah buah.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    assessment: {
      title: 'Kuis Berhitung Ceria',
      questions: [
        {
          id: 'q-2-1',
          questionText: 'Berapa hasil dari 2 apel ditambah 1 apel?',
          options: ['2 apel', '3 apel', '4 apel', '5 apel'],
          correctOptionIndex: 1
        }
      ]
    }
  },
  {
    id: 'materi-3',
    title: 'Mengenal Tata Surya & Planet Ajaib',
    jenjang: 'SMP',
    mataPelajaran: 'IPA',
    level: 'IPA • Kelas VII • Fase D',
    badge: 'Gratis',
    image: '/Banner_Materi.jpg',
    description: 'Menjelajahi keajaiban matahari, bumi, dan planet-planet di galaksi bimasakti.',
    types: ['Video 3D', 'Eksplorasi Luar Angkasa'],
    duration: '± 6 menit',
    activityType: 'Video + Kuis Interaktif',
    learningOptions: '4 Mode Belajar (Standar, Slow, High Contrast, Focus)',
    learningPoints: [
      { id: 'lp-3-1', title: 'Matahari sebagai Pusat Tata Surya' },
      { id: 'lp-3-2', title: 'Planet Dalam & Luar' }
    ],
    standardContent: {
      title: 'Mengenal Tata Surya & Planet Ajaib (Standar)',
      text: 'Selamat datang di antariksa! Mari kita terbang mengelilingi 8 planet yang mengorbit matahari.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4'
    },
    slowContent: {
      title: 'Mengenal Tata Surya & Planet Ajaib (Slow)',
      text: 'Matahari adalah bintang di pusat tata surya kita... Planet berputar mengelilinginya.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4'
    },
    highContrastContent: {
      title: 'SISTEM TATA SURYA',
      text: 'MATAHARI -> MERKURIUS -> VENUS -> BUMI -> MARS -> JUPITER -> SATURNUS -> URANUS -> NEPTUNUS.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4'
    },
    focusContent: {
      title: 'Tata Surya Inti',
      text: 'Matahari adalah pusat. Planet-planet mengitari matahari secara teratur.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    assessment: {
      title: 'Kuis Cepat Tata Surya',
      questions: [
        {
          id: 'q-3-1',
          questionText: 'Planet terdekat dari matahari adalah...',
          options: ['Merkurius', 'Venus', 'Bumi', 'Mars'],
          correctOptionIndex: 0
        }
      ]
    }
  },
  {
    id: 'materi-4',
    title: 'Dunia Mikroskopis: Sel & Kehidupan',
    jenjang: 'SMA',
    mataPelajaran: 'Biologi',
    level: 'Biologi • Kelas X • Fase E',
    badge: 'Pro',
    image: '/Banner_Materi.jpg',
    description: 'Membedah unit terkecil kehidupan: struktur membran, nukleus, dan mitokondria.',
    types: ['Mikroskop Virtual', 'Visual 3D'],
    duration: '± 7 menit',
    activityType: 'Simulasi Sel Virtual',
    learningOptions: '4 Mode Belajar (Standar, Slow, High Contrast, Focus)',
    learningPoints: [
      { id: 'lp-4-1', title: 'Struktur Membran & Sitoplasma' },
      { id: 'lp-4-2', title: 'Perbedaan Sel Hewan & Tumbuhan' }
    ],
    standardContent: {
      title: 'Dunia Mikroskopis: Sel & Kehidupan (Standar)',
      text: 'Semua makhluk hidup tersusun dari unit dasar bernama sel. Mari kita selami bagian dalamnya!',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4'
    },
    slowContent: {
      title: 'Dunia Mikroskopis: Sel & Kehidupan (Slow)',
      text: 'Sel adalah unit terkecil makhluk hidup... memiliki membran luar dan inti sel.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4'
    },
    highContrastContent: {
      title: 'STRUKTUR SEL DASAR',
      text: 'MEMBRAN SEL -> SITOPLASMA -> INTI SEL (NUKLEUS) -> MITOKONDRIA.',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4'
    },
    focusContent: {
      title: 'Konsep Sel',
      text: 'Sel adalah penyusun makhluk hidup. Mengatur energi dan kehidupan.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    assessment: {
      title: 'Asesmen Struktur Sel',
      questions: [
        {
          id: 'q-4-1',
          questionText: 'Organel sel yang berfungsi sebagai pusat penghasil energi sel adalah...',
          options: ['Mitokondria', 'Ribosom', 'Retikulum Endoplasma', 'Vakuola'],
          correctOptionIndex: 0
        }
      ]
    }
  }
]

// Reactive state
export const materiList = ref([])
export const selectedMateri = ref(null)
export const selectedMode = ref('standard') // 'standard' | 'focus'
export const isLoadingMateri = ref(false)

// Init — load dari Supabase dulu, fallback ke localStorage
initMateri()

/**
 * Inisialisasi materi:
 * 1. Supabase = source of truth (jika terkonfigurasi)
 * 2. Kalau Supabase kosong → seed initialMateri ke Supabase
 * 3. localStorage hanya sebagai cache offline
 */
async function initMateri() {
  isLoadingMateri.value = true
  try {
    if (isSupabaseConfigured) {
      await loadFromSupabase()
    } else {
      console.warn('[Inkluvia] Supabase belum dikonfigurasi — menggunakan localStorage saja.')
      loadFromLocalStorage()
    }
  } catch (e) {
    console.error('initMateri failed, falling back to localStorage:', e)
    loadFromLocalStorage()
  } finally {
    isLoadingMateri.value = false
  }
}

/**
 * Load dari Supabase. Jika tabel kosong, otomatis seed data awal.
 */
async function loadFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('materi')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      // Data ada di Supabase — gunakan sebagai sumber utama
      materiList.value = data.map(row => sanitizeMateriItem(parseSupabaseRow(row)))
      selectedMateri.value = materiList.value[0] || null
      saveToLocalStorage() // Cache ke localStorage
      console.log(`[Inkluvia] ✅ Loaded ${data.length} materi dari Supabase`)
      return
    }

    // Supabase kosong — seed initialMateri ke Supabase
    console.log('[Inkluvia] Supabase kosong, seeding data awal...')
    await seedInitialMateriToSupabase()
    return
  } catch (err) {
    console.warn('Supabase load failed, using localStorage:', err.message)
  }
  // Fallback ke localStorage kalau Supabase benar-benar gagal
  loadFromLocalStorage()
}

/**
 * Parse row Supabase ke format yang dipakai di frontend
 */
function parseSupabaseRow(row) {
  return {
    ...row,
    types: typeof row.types === 'string' ? JSON.parse(row.types) : (row.types || []),
    steps: typeof row.steps === 'string' ? JSON.parse(row.steps) : (row.steps || []),
    learningPoints: typeof row.learning_points === 'string' ? JSON.parse(row.learning_points) : (row.learningPoints || row.learning_points || []),
    standardConfig: typeof row.standard_config === 'string' ? JSON.parse(row.standard_config) : (row.standardConfig || row.standard_config || {}),
    focusConfig: typeof row.focus_config === 'string' ? JSON.parse(row.focus_config) : (row.focusConfig || row.focus_config || {}),
    standardContent: typeof row.standard_content === 'string' ? JSON.parse(row.standard_content) : (row.standardContent || row.standard_content || {}),
    slowContent: typeof row.slow_content === 'string' ? JSON.parse(row.slow_content) : (row.slowContent || row.slow_content || {}),
    highContrastContent: typeof row.high_contrast_content === 'string' ? JSON.parse(row.high_contrast_content) : (row.highContrastContent || row.high_contrast_content || {}),
    focusContent: typeof row.focus_content === 'string' ? JSON.parse(row.focus_content) : (row.focusContent || row.focus_content || {}),
    assessment: typeof row.assessment === 'string' ? JSON.parse(row.assessment) : (row.assessment || null)
  }
}

/**
 * Konversi item materi frontend ke format kolom Supabase
 */
function toSupabaseRow(item) {
  return {
    id: item.id,
    title: item.title,
    jenjang: item.jenjang,
    mata_pelajaran: item.mataPelajaran,
    level: item.level,
    badge: item.badge,
    image: item.image,
    description: item.description,
    duration: item.duration,
    activity_type: item.activityType,
    learning_options: item.learningOptions,
    types: item.types,
    steps: item.steps,
    standard_config: item.standardConfig,
    focus_config: item.focusConfig,
    learning_points: item.learningPoints,
    standard_content: item.standardContent,
    slow_content: item.slowContent,
    high_contrast_content: item.highContrastContent,
    focus_content: item.focusContent,
    assessment: item.assessment,
    created_at: item.created_at || new Date().toISOString()
  }
}

/**
 * Seed initialMateri ke Supabase (dipanggil sekali saat tabel kosong)
 */
async function seedInitialMateriToSupabase() {
  try {
    const rows = initialMateri.map(item => toSupabaseRow(sanitizeMateriItem(item)))
    const { error } = await supabase.from('materi').insert(rows)
    if (error) {
      console.warn('Seed to Supabase failed:', error.message)
      loadFromLocalStorage()
      return
    }
    // Reload dari Supabase setelah seed berhasil
    const { data } = await supabase.from('materi').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) {
      materiList.value = data.map(row => sanitizeMateriItem(parseSupabaseRow(row)))
      selectedMateri.value = materiList.value[0] || null
      saveToLocalStorage()
      console.log(`[Inkluvia] ✅ Seeded ${data.length} materi ke Supabase`)
    }
  } catch (err) {
    console.warn('Seed Supabase error:', err)
    loadFromLocalStorage()
  }
}

function loadFromLocalStorage() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) {
        materiList.value = parsed.map(sanitizeMateriItem)
        selectedMateri.value = materiList.value[0]
        return
      }
    }
  } catch (e) {
    console.error('Failed to load cached materi:', e)
  }
  materiList.value = initialMateri.map(sanitizeMateriItem)
  selectedMateri.value = materiList.value[0]
  saveToLocalStorage()
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materiList.value))
  } catch (e) {
    console.error('Failed to save materi to localStorage:', e)
  }
}

/**
 * Tambah Materi Baru
 */
export async function addMateri(newItem) {
  const itemWithId = {
    id: `materi-${Date.now()}`,
    badge: 'Gratis',
    types: ['Video', 'Interaktif'],
    image: '/es_batu_card.jpg',
    duration: '± 5 menit',
    activityType: 'Video + Aktivitas',
    learningOptions: 'Standard & Focus Mode',
    learningPoints: [
      { id: 'lp-1', title: 'Konsep Dasar', iconType: 'droplet' },
      { id: 'lp-2', title: 'Aktivitas Mandiri', iconType: 'wind' }
    ],
    standardConfig: {
      title: 'Standard Mode',
      subtitle: 'Visual, animasi, dan narasi lengkap',
      features: [
        'Visual, animasi, dan narasi',
        'untuk pengalaman belajar yang lebih lengkap.'
      ]
    },
    focusConfig: {
      title: 'Focus Mode',
      subtitle: 'Tampilan lebih tenang dengan kontras jelas',
      features: [
        'Tampilan lebih sederhana',
        'Gerakan lebih lambat',
        'Distraksi lebih sedikit',
        'Kontras lebih jelas'
      ]
    },
    steps: [
      {
        id: `step-${Date.now()}-1`,
        number: 1,
        title: 'Pengenalan Materi',
        status: 'active',
        standardContent: {
          title: 'Pengenalan Materi',
          text: newItem.description || 'Mari mulai petualangan belajar kita!',
          videoUrl: ''
        },
        slowContent: {
          title: 'Pengenalan Materi (Slow)',
          text: newItem.description || 'Mari belajar secara bertahap dan santai.',
          videoUrl: ''
        },
        highContrastContent: {
          title: 'PENGENALAN MATERI',
          text: (newItem.description || 'MARI MULAI BELAJAR').toUpperCase(),
          videoUrl: ''
        },
        focusContent: {
          title: 'Poin Kunci Pengenalan',
          text: newItem.description || 'Mari mulai belajar dengan fokus dan tenang.',
          videoUrl: ''
        }
      }
    ],
    created_at: new Date().toISOString(),
    ...newItem
  }
  const cleanItem = sanitizeMateriItem(itemWithId)

  materiList.value.unshift(cleanItem)
  saveToLocalStorage()

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('materi').upsert([toSupabaseRow(cleanItem)], { onConflict: 'id' })
      if (error) console.warn('Supabase upsert warning:', error.message)
      else console.log(`[Inkluvia] ✅ Materi "${cleanItem.title}" berhasil disimpan ke Supabase`)
    } catch (err) {
      console.warn('Supabase sync skipped:', err)
    }
  }

  return cleanItem
}

/**
 * Update Materi — update reactive state + localStorage + Supabase
 */
export async function updateMateri(id, updatedFields) {
  const index = materiList.value.findIndex((m) => m.id === id)
  if (index === -1) return

  const updated = sanitizeMateriItem({ ...materiList.value[index], ...updatedFields })
  materiList.value[index] = updated
  if (selectedMateri.value?.id === id) {
    selectedMateri.value = updated
  }
  saveToLocalStorage()

  if (isSupabaseConfigured) {
    try {
      const row = toSupabaseRow(updated)
      delete row.created_at // jangan timpa created_at
      // Hapus field undefined
      Object.keys(row).forEach(k => row[k] === undefined && delete row[k])
      // Gunakan upsert agar tetap masuk walaupun row belum ada di Supabase
      const { error } = await supabase.from('materi').upsert(row, { onConflict: 'id' })
      if (error) console.warn('Supabase upsert warning:', error.message)
      else console.log(`[Inkluvia] ✅ Materi "${updated.title}" berhasil disimpan ke Supabase`)
    } catch (err) {
      console.warn('Supabase upsert skipped:', err)
    }
  }
}

/**
 * Hapus Materi
 */
export async function deleteMateri(id) {
  materiList.value = materiList.value.filter((item) => item.id !== id)
  if (selectedMateri.value?.id === id) {
    selectedMateri.value = materiList.value[0] || null
  }
  saveToLocalStorage()

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('materi').delete().eq('id', id)
      if (error) console.warn('Supabase delete warning:', error.message)
      else console.log(`[Inkluvia] ✅ Materi berhasil dihapus dari Supabase`)
    } catch (err) {
      console.warn('Supabase delete skipped:', err)
    }
  }
}

/**
 * Reset ke data default — juga reset di Supabase
 */
export async function resetMateri() {
  materiList.value = initialMateri.map(sanitizeMateriItem)
  selectedMateri.value = materiList.value[0]
  saveToLocalStorage()

  if (isSupabaseConfigured) {
    try {
      // Hapus semua data lama di Supabase
      await supabase.from('materi').delete().neq('id', '')
      // Seed ulang
      const rows = materiList.value.map(toSupabaseRow)
      const { error } = await supabase.from('materi').insert(rows)
      if (error) console.warn('Supabase reset warning:', error.message)
      else console.log('[Inkluvia] ✅ Data materi berhasil di-reset di Supabase')
    } catch (err) {
      console.warn('Supabase reset skipped:', err)
    }
  }
}

/**
 * Force-sync semua materi di memori (localStorage) ke Supabase via upsert.
 * Panggil ini dari Admin Dashboard setelah upload video agar data dipastikan masuk Supabase.
 * Jika ada kolom yang tidak ada di schema, otomatis retry dengan field minimal saja.
 */
export async function forceSyncToSupabase() {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase tidak dikonfigurasi' }
  try {
    const rows = materiList.value.map(toSupabaseRow)
    const { error } = await supabase.from('materi').upsert(rows, { onConflict: 'id' })
    if (error) {
      // Coba fallback dengan field minimal (tanpa kolom opsional yang mungkin belum ada)
      console.warn('Full sync failed, trying minimal fields:', error.message)
      const minimalRows = materiList.value.map(item => ({
        id: item.id,
        title: item.title,
        jenjang: item.jenjang,
        mata_pelajaran: item.mataPelajaran,
        level: item.level,
        badge: item.badge,
        image: item.image,
        description: item.description,
        duration: item.duration,
        standard_content: item.standardContent,
        slow_content: item.slowContent,
        high_contrast_content: item.highContrastContent,
        focus_content: item.focusContent,
        created_at: item.created_at || new Date().toISOString()
      }))
      const { error: err2 } = await supabase.from('materi').upsert(minimalRows, { onConflict: 'id' })
      if (err2) {
        return { success: false, error: `${err2.message}\n\n⚠️ Jalankan SQL berikut di Supabase SQL Editor dulu:\nALTER TABLE public.materi ADD COLUMN IF NOT EXISTS assessment JSONB, ADD COLUMN IF NOT EXISTS learning_points JSONB, ADD COLUMN IF NOT EXISTS types JSONB, ADD COLUMN IF NOT EXISTS standard_content JSONB, ADD COLUMN IF NOT EXISTS slow_content JSONB, ADD COLUMN IF NOT EXISTS high_contrast_content JSONB, ADD COLUMN IF NOT EXISTS focus_content JSONB;` }
      }
      console.log(`[Inkluvia] ✅ Minimal sync ${minimalRows.length} materi berhasil (beberapa kolom dilewati)`)
      return { success: true, count: minimalRows.length, partial: true }
    }
    console.log(`[Inkluvia] ✅ Force sync ${rows.length} materi ke Supabase berhasil`)
    return { success: true, count: rows.length }
  } catch (err) {
    console.warn('Force sync error:', err)
    return { success: false, error: err.message }
  }
}
