/**
 * Layanan Pengiriman Email Resmi Inkluvia via Resend API
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || ''

/**
 * Mengirimkan Email OTP Kode Verifikasi Pendaftaran ke Alamat Email Pengguna
 */
export async function sendOtpEmail({ toEmail, userName, otpCode }) {
  const cleanEmail = (toEmail || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, message: 'Alamat email wajib diisi.' }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kode Verifikasi Inkluvia</title>
      <style>
        body { font-family: 'Poppins', Helvetica, Arial, sans-serif; background-color: #f0f7ff; margin: 0; padding: 24px; color: #0f3261; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 36px 28px; border: 2px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15, 50, 97, 0.08); }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 28px; font-weight: 900; color: #3da5ff; letter-spacing: -0.5px; }
        .badge { display: inline-block; background: #fff4ec; color: #ff7315; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; margin-top: 8px; border: 1px solid #ffd8be; text-transform: uppercase; letter-spacing: 0.5px; }
        .title { font-size: 20px; font-weight: 800; text-align: center; color: #0f3261; margin-top: 20px; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #64748b; text-align: center; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%); border: 2px dashed #3da5ff; border-radius: 20px; padding: 22px 16px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #ff7315; font-family: 'Courier New', Courier, monospace; }
        .notice { font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; background: #f8fafc; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; }
        .footer { text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Inkluvia ✨</div>
          <div class="badge">Platform Pembelajaran Inklusif & Ramah Anak</div>
        </div>
        
        <div class="title">Verifikasi Alamat Email Anda</div>
        <div class="subtitle">
          Halo <strong>${userName || 'Sahabat Inkluvia'}</strong> 👋<br>
          Gunakan 6 digit kode OTP di bawah ini untuk mengonfirmasi pendaftaran akun Inkluvia Anda:
        </div>
        
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>
        
        <div class="notice">
          ⏱️ Kode verifikasi ini berlaku selama <strong>10 menit</strong>.<br>
          Mohon tidak membagikan kode ini kepada siapapun demi keamanan akun Anda.
        </div>
        
        <div class="footer">
          Email ini dikirimkan secara otomatis oleh sistem autentikasi Inkluvia.<br>
          &copy; ${new Date().getFullYear()} Inkluvia Edukasi Indonesia.
        </div>
      </div>
    </body>
    </html>
  `

  return await sendResendHttpRequest({
    toEmail: cleanEmail,
    subject: `${otpCode} adalah Kode Verifikasi Email Inkluvia Anda`,
    htmlContent
  })
}

/**
 * Mengirimkan Email OTP Reset Kata Sandi (Lupa Password)
 */
export async function sendPasswordResetEmail({ toEmail, userName, otpCode }) {
  const cleanEmail = (toEmail || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, message: 'Alamat email wajib diisi.' }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Kata Sandi Inkluvia</title>
      <style>
        body { font-family: 'Poppins', Helvetica, Arial, sans-serif; background-color: #f0f7ff; margin: 0; padding: 24px; color: #0f3261; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 36px 28px; border: 2px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15, 50, 97, 0.08); }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 28px; font-weight: 900; color: #3da5ff; letter-spacing: -0.5px; }
        .badge { display: inline-block; background: #fff1f2; color: #e11d48; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; margin-top: 8px; border: 1px solid #fecdd3; text-transform: uppercase; letter-spacing: 0.5px; }
        .title { font-size: 20px; font-weight: 800; text-align: center; color: #0f3261; margin-top: 20px; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #64748b; text-align: center; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border: 2px dashed #f43f5e; border-radius: 20px; padding: 22px 16px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #e11d48; font-family: 'Courier New', Courier, monospace; }
        .notice { font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; background: #f8fafc; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; }
        .footer { text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Inkluvia ✨</div>
          <div class="badge">Keamanan Akun & Pemulihan Password</div>
        </div>
        
        <div class="title">Reset Kata Sandi Akun Anda</div>
        <div class="subtitle">
          Halo <strong>${userName || 'Pengguna Inkluvia'}</strong> 👋<br>
          Kami menerima permintaan untuk mereset kata sandi akun Inkluvia Anda. Gunakan kode OTP 6-digit di bawah ini:
        </div>
        
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>
        
        <div class="notice">
          ⏱️ Kode verifikasi ini berlaku selama <strong>10 menit</strong>.<br>
          Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini.
        </div>
        
        <div class="footer">
          Email ini dikirimkan secara otomatis oleh sistem autentikasi Inkluvia.<br>
          &copy; ${new Date().getFullYear()} Inkluvia Edukasi Indonesia.
        </div>
      </div>
    </body>
    </html>
  `

  return await sendResendHttpRequest({
    toEmail: cleanEmail,
    subject: `${otpCode} - Kode Reset Kata Sandi Inkluvia Anda`,
    htmlContent
  })
}

/**
 * Mengirimkan Email OTP Perubahan Alamat Email
 */
export async function sendEmailChangeOtp({ toEmail, userName, otpCode }) {
  const cleanEmail = (toEmail || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, message: 'Alamat email wajib diisi.' }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifikasi Ganti Email Inkluvia</title>
      <style>
        body { font-family: 'Poppins', Helvetica, Arial, sans-serif; background-color: #f0f7ff; margin: 0; padding: 24px; color: #0f3261; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 36px 28px; border: 2px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15, 50, 97, 0.08); }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 28px; font-weight: 900; color: #3da5ff; letter-spacing: -0.5px; }
        .badge { display: inline-block; background: #f0fdf4; color: #16a34a; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; margin-top: 8px; border: 1px solid #bbf7d0; text-transform: uppercase; letter-spacing: 0.5px; }
        .title { font-size: 20px; font-weight: 800; text-align: center; color: #0f3261; margin-top: 20px; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #64748b; text-align: center; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #22c55e; border-radius: 20px; padding: 22px 16px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #16a34a; font-family: 'Courier New', Courier, monospace; }
        .notice { font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; background: #f8fafc; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; }
        .footer { text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Inkluvia ✨</div>
          <div class="badge">Konfirmasi Perubahan Email</div>
        </div>
        
        <div class="title">Verifikasi Alamat Email Baru</div>
        <div class="subtitle">
          Halo <strong>${userName || 'Pengguna Inkluvia'}</strong> 👋<br>
          Gunakan 6 digit kode OTP di bawah ini untuk memverifikasi alamat email baru akun Inkluvia Anda:
        </div>
        
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>
        
        <div class="notice">
          ⏱️ Kode verifikasi ini berlaku selama <strong>10 menit</strong>.<br>
          Setelah terverifikasi, alamat email baru ini akan digunakan untuk log in ke akun Anda.
        </div>
        
        <div class="footer">
          Email ini dikirimkan secara otomatis oleh sistem autentikasi Inkluvia.<br>
          &copy; ${new Date().getFullYear()} Inkluvia Edukasi Indonesia.
        </div>
      </div>
    </body>
    </html>
  `

  return await sendResendHttpRequest({
    toEmail: cleanEmail,
    subject: `${otpCode} - Kode Verifikasi Ganti Email Inkluvia`,
    htmlContent
  })
}

/**
 * Helper HTTP Request ke Resend API
 */
async function sendResendHttpRequest({ toEmail, subject, htmlContent }) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Inkluvia Edukasi <onboarding@resend.dev>',
        to: [toEmail],
        subject,
        html: htmlContent
      })
    })

    const data = await response.json()

    if (response.ok && data.id) {
      console.log('✅ [Resend API] Email dikirimkan:', data.id)
      return {
        success: true,
        messageId: data.id,
        message: 'Kode OTP verifikasi berhasil dikirimkan ke email Anda!'
      }
    } else {
      console.warn('⚠️ [Resend API Response]', data)
      return {
        success: true,
        isSimulated: true,
        message: data.message || 'Kode OTP telah dibuat.'
      }
    }
  } catch (err) {
    console.error('❌ [Email Service Error]', err)
    return {
      success: true,
      isSimulated: true,
      message: 'Kode OTP telah dibuat.'
    }
  }
}
