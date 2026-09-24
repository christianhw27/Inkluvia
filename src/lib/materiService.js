import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'inkluvia_materi_list_v3'

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
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    slowContent: {
      title: 'Petualangan Si Es Batu (Slow)',
      text: 'Es batu dipanaskan secara perlahan... berubah menjadi air cair, lalu menguap menjadi gas di udara.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    },
    highContrastContent: {
      title: 'PERUBAHAN WUJUD BENDA',
      text: 'ES BATU (PADAT) -> AIR (CAIR) -> UAP (GAS). PROSES MENCAIR, MENGUAP, DAN MENGEMBUN.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    },
    focusContent: {
      title: 'Es Batu = Perubahan Wujud',
      text: 'Es batu (Padat) → Air (Cair) → Uap (Gas). Kamu hebat sudah belajar hari ini!',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
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
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    slowContent: {
      title: 'Berhitung Bersama Sahabat Hutan (Slow)',
      text: 'Satu apel... ditambah satu apel... menjadi dua apel.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    },
    highContrastContent: {
      title: 'PENJUMLAHAN DASAR',
      text: '1 + 1 = 2. AYO BERHITUNG BERSAMA.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    },
    focusContent: {
      title: 'Konsep Angka',
      text: '1 + 1 = 2. Fokus pada jumlah buah.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
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
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    slowContent: {
      title: 'Mengenal Tata Surya & Planet Ajaib (Slow)',
      text: 'Matahari adalah bintang di pusat tata surya kita... Planet berputar mengelilinginya.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    },
    highContrastContent: {
      title: 'SISTEM TATA SURYA',
      text: 'MATAHARI -> MERKURIUS -> VENUS -> BUMI -> MARS -> JUPITER -> SATURNUS -> URANUS -> NEPTUNUS.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    },
    focusContent: {
      title: 'Tata Surya Inti',
      text: 'Matahari adalah pusat. Planet-planet mengitari matahari secara teratur.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
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
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    slowContent: {
      title: 'Dunia Mikroskopis: Sel & Kehidupan (Slow)',
      text: 'Sel adalah unit terkecil makhluk hidup... memiliki membran luar dan inti sel.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    },
    highContrastContent: {
      title: 'STRUKTUR SEL DASAR',
      text: 'MEMBRAN SEL -> SITOPLASMA -> INTI SEL (NUKLEUS) -> MITOKONDRIA.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    },
    focusContent: {
      title: 'Konsep Sel',
      text: 'Sel adalah penyusun makhluk hidup. Mengatur energi dan kehidupan.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
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

async function initMateri() {
  isLoadingMateri.value = true
  try {
    if (isSupabaseConfigured) {
      await loadFromSupabase()
    } else {
      loadFromLocalStorage()
    }
  } catch (e) {
    console.error('initMateri failed, falling back to localStorage:', e)
    loadFromLocalStorage()
  } finally {
    isLoadingMateri.value = false
  }
}

async function loadFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('materi')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      // Supabase menyimpan JSON fields, perlu parse jika berbentuk string
      materiList.value = data.map(row => ({
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
      }))
      selectedMateri.value = materiList.value[0] || null
      saveToLocalStorage()
      return
    }
  } catch (err) {
    console.warn('Supabase load failed, using localStorage:', err.message)
  }
  // Jika Supabase kosong atau error, pakai localStorage
  loadFromLocalStorage()
}

function loadFromLocalStorage() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) {
        materiList.value = parsed
        selectedMateri.value = materiList.value[0]
        return
      }
    }
  } catch (e) {
    console.error('Failed to load cached materi:', e)
  }
  materiList.value = [...initialMateri]
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

  materiList.value.unshift(itemWithId)
  saveToLocalStorage()

  if (isSupabaseConfigured) {
    try {
      const supabaseRow = {
        id: itemWithId.id,
        title: itemWithId.title,
        jenjang: itemWithId.jenjang,
        mata_pelajaran: itemWithId.mataPelajaran,
        level: itemWithId.level,
        badge: itemWithId.badge,
        image: itemWithId.image,
        description: itemWithId.description,
        duration: itemWithId.duration,
        activity_type: itemWithId.activityType,
        learning_options: itemWithId.learningOptions,
        types: itemWithId.types,
        steps: itemWithId.steps,
        standard_config: itemWithId.standardConfig,
        focus_config: itemWithId.focusConfig,
        learning_points: itemWithId.learningPoints,
        standard_content: itemWithId.standardContent,
        slow_content: itemWithId.slowContent,
        high_contrast_content: itemWithId.highContrastContent,
        focus_content: itemWithId.focusContent,
        assessment: itemWithId.assessment,
        created_at: itemWithId.created_at
      }
      const { error } = await supabase.from('materi').insert([supabaseRow])
      if (error) console.warn('Supabase insert warning:', error.message)
    } catch (err) {
      console.warn('Supabase sync skipped:', err)
    }
  }

  return itemWithId
}

/**
 * Update Materi
 */
export async function updateMateri(id, updatedFields) {
  const index = materiList.value.findIndex((m) => m.id === id)
  if (index === -1) return

  materiList.value[index] = { ...materiList.value[index], ...updatedFields }
  if (selectedMateri.value?.id === id) {
    selectedMateri.value = materiList.value[index]
  }
  saveToLocalStorage()

  if (isSupabaseConfigured) {
    try {
      const supabaseFields = {
        title: updatedFields.title,
        jenjang: updatedFields.jenjang,
        mata_pelajaran: updatedFields.mataPelajaran,
        level: updatedFields.level,
        badge: updatedFields.badge,
        image: updatedFields.image,
        description: updatedFields.description,
        duration: updatedFields.duration,
        types: updatedFields.types,
        steps: updatedFields.steps,
        standard_config: updatedFields.standardConfig,
        focus_config: updatedFields.focusConfig,
        learning_points: updatedFields.learningPoints,
        standard_content: updatedFields.standardContent,
        slow_content: updatedFields.slowContent,
        high_contrast_content: updatedFields.highContrastContent,
        focus_content: updatedFields.focusContent,
        assessment: updatedFields.assessment
      }
      // Hapus field undefined
      Object.keys(supabaseFields).forEach(
        k => supabaseFields[k] === undefined && delete supabaseFields[k]
      )
      const { error } = await supabase.from('materi').update(supabaseFields).eq('id', id)
      if (error) console.warn('Supabase update warning:', error.message)
    } catch (err) {
      console.warn('Supabase update skipped:', err)
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
    } catch (err) {
      console.warn('Supabase delete skipped:', err)
    }
  }
}

/**
 * Reset ke data default
 */
export function resetMateri() {
  materiList.value = [...initialMateri]
  selectedMateri.value = materiList.value[0]
  saveToLocalStorage()
}
