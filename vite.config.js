import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

function xenditApiPlugin() {
  return {
    name: 'xendit-api-plugin',
    configureServer(server) {
      // Load environment variables including non-VITE_ keys
      const env = loadEnv('development', process.cwd(), '')
      const secretKey = env.XENDIT_SECRET_KEY || 'xnd_development_5r4GghQvUKEOABwuFg5osSlABKUI3VMFIaBvEaRySuu2tCpLI9KRUU4cJfgyFEz'
      const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64')

      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost')

        if (urlObj.pathname === '/api/xendit/create-invoice' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}')
              const externalId = 'inkluvia-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
              
              const payload = {
                external_id: externalId,
                amount: Number(data.amount) || 47000,
                description: data.planName ? `Langganan ${data.planName} Inkluvia` : 'Langganan Inkluvia Premium PRO',
                invoice_duration: 86400,
                currency: 'IDR',
                payer_email: data.customerEmail || 'user@inkluvia.id',
                customer: {
                  given_names: data.customerName || 'Siswa Inkluvia',
                  email: data.customerEmail || 'user@inkluvia.id'
                },
                success_redirect_url: 'http://localhost:5173/?payment=success',
                failure_redirect_url: 'http://localhost:5173/?payment=failed'
              }

              const response = await fetch('https://api.xendit.co/v2/invoices', {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
              })

              const result = await response.json()
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = response.ok ? 200 : response.status
              res.end(JSON.stringify(result))
            } catch (err) {
              console.error('[Xendit API Error]:', err)
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        if (urlObj.pathname === '/api/xendit/invoice-status' && req.method === 'GET') {
          const invoiceId = urlObj.searchParams.get('id')
          if (!invoiceId) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing invoice id parameter' }))
            return
          }

          try {
            const response = await fetch(`https://api.xendit.co/v2/invoices/${encodeURIComponent(invoiceId)}`, {
              method: 'GET',
              headers: {
                'Authorization': authHeader
              }
            })

            const result = await response.json()
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = response.ok ? 200 : response.status
            res.end(JSON.stringify(result))
          } catch (err) {
            console.error('[Xendit Status Error]:', err)
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    xenditApiPlugin()
  ],
})

