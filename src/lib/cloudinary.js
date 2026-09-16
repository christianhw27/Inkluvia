import { Cloudinary } from '@cloudinary/url-gen'

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

/**
 * Memeriksa apakah kredensial Cloudinary sudah diisi di .env.local
 */
export const isCloudinaryConfigured = Boolean(
  cloudName &&
  uploadPreset &&
  cloudName !== 'your-cloud-name' &&
  uploadPreset !== 'your-upload-preset'
)

/**
 * Instance SDK Cloudinary untuk transformasi dan optimasi URL video/gambar
 */
export const cld = new Cloudinary({
  cloud: {
    cloudName: cloudName || 'demo',
  },
  url: {
    secure: true,
  },
})

/**
 * Fungsi untuk mengunggah video langsung ke Cloudinary (Client-side Direct Upload)
 * menggunakan Unsigned Upload Preset.
 *
 * @param {File} file - File video dari input file/drag-drop
 * @param {Function} onProgress - Callback progress (persentase 0 - 100)
 * @returns {Promise<Object>} Hasil upload dari Cloudinary (secure_url, public_id, duration, dsb.)
 */
export function uploadVideo(file, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      return reject(
        new Error('Cloudinary belum dikonfigurasi. Harap isi VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET di .env.local')
      )
    }

    if (!file) {
      return reject(new Error('Pilih file video terlebih dahulu'))
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    // Event listener untuk progress upload
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (e) {
            reject(new Error('Gagal memproses respons dari Cloudinary'))
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText)
            reject(new Error(errRes.error?.message || `Upload gagal dengan status ${xhr.status}`))
          } catch {
            reject(new Error(`Upload gagal dengan status ${xhr.status}`))
          }
        }
      }
    }

    xhr.onerror = () => {
      reject(new Error('Terjadi kesalahan jaringan saat mengunggah video ke Cloudinary.'))
    }

    xhr.open('POST', url, true)
    xhr.send(formData)
  })
}

/**
 * Menghasilkan URL video Cloudinary yang sudah teroptimasi
 * @param {string} publicId - Public ID video di Cloudinary
 * @returns {string} URL video teroptimasi
 */
export function getOptimizedVideoUrl(publicId) {
  if (!cloudName || !publicId) return ''
  return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,f_auto/${publicId}.mp4`
}
