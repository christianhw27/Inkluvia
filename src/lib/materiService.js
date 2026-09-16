import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'inkluvia_materi_list_v2'

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
    learningOptions: 'Standard & Focus Mode',
    learningPoints: [
      { id: 'lp-1', title: 'Mencair', iconType: 'droplet' },
      { id: 'lp-2', title: 'Menguap', iconType: 'wind' },
      { id: 'lp-3', title: 'Mengembun', iconType: 'cloud' }
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
        id: 'step-1',
        number: 1,
        title: 'Kenalan dengan Es Batu',
        status: 'completed',
        standardContent: {
          title: 'Kenalan dengan Es Batu',
          text: 'Es batu adalah air dalam wujud padat. Es terbentuk ketika suhu air turun di bawah 0°C.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        },
        focusContent: {
          title: 'Es Batu = Air Padat',
          text: 'Es adalah air yang beku dan padat karena suhunya sangat dingin.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        }
      },
      {
        id: 'step-2',
        number: 2,
        title: 'Es Batu Mencair',
        status: 'completed',
        standardContent: {
          title: 'Es Batu Mencair',
          text: 'Saat terkena panas sinar matahari, es batu menyerap kalor dan berubah menjadi air cair. Proses ini disebut mencair.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        },
        focusContent: {
          title: 'Mencair: Padat ke Cair',
          text: 'Kena panas → Es batu jadi air. Ini namanya mencair.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        }
      },
      {
        id: 'step-3',
        number: 3,
        title: 'Air Menguap',
        status: 'active',
        standardContent: {
          title: 'Air Menguap',
          text: 'Ketika dipanaskan, air berubah menjadi uap. Proses ini disebut menguap.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
        },
        focusContent: {
          title: 'Menguap: Air Jadi Uap Gas',
          text: 'Air dipanaskan → Berubah jadi uap air di udara. Ini disebut menguap.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
        }
      },
      {
        id: 'step-4',
        number: 4,
        title: 'Uap Mengembun',
        status: 'locked',
        standardContent: {
          title: 'Uap Mengembun',
          text: 'Saat uap air menyentuh permukaan yang dingin, uap berubah kembali menjadi butiran air. Proses ini disebut mengembun.',
          videoUrl: ''
        },
        focusContent: {
          title: 'Mengembun: Uap Balik Jadi Air',
          text: 'Uap kena dingin → Jadi titik-titik air kembali.',
          videoUrl: ''
        }
      },
      {
        id: 'step-5',
        number: 5,
        title: 'Yuk Ingat Lagi',
        status: 'locked',
        standardContent: {
          title: 'Kuis & Evaluasi Petualangan',
          text: 'Mari kita ingat kembali: Mencair, Menguap, dan Mengembun!',
          videoUrl: ''
        },
        focusContent: {
          title: 'Rangkuman Poin Penting',
          text: 'Es batu (Padat) → Air (Cair) → Uap (Gas). Kamu hebat sudah belajar hari ini!',
          videoUrl: ''
        }
      }
    ]
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
        focusConfig: typeof row.focus_config === 'string' ? JSON.parse(row.focus_config) : (row.focusConfig || row.focus_config || {})
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
        learning_points: updatedFields.learningPoints
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
