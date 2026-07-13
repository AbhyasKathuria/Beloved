import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'watch-flowers',
      configureServer(server) {
        const flowersPath = path.resolve(__dirname, 'Flowers').replace(/\\/g, '/')
        server.watcher.add(flowersPath)
        
        let timer: NodeJS.Timeout | null = null
        const regenerate = (filePath: string) => {
          if (!filePath) return
          const normalizedPath = filePath.replace(/\\/g, '/')
          
          // Only trigger if changes happen inside the root "Flowers" directory
          if (!normalizedPath.startsWith(flowersPath)) return

          // Debounce the call if multiple files are copied at once
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => {
            console.log('[watcher] Flowers folder changed. Syncing assets...')
            exec('node scripts/generate-flower-list.js', (err, stdout) => {
              if (err) {
                console.error('[watcher] Sync failed:', err)
                return
              }
              if (stdout) console.log(stdout.trim())
            })
          }, 100)
        }

        // Listen for new, deleted, or changed files/directories
        server.watcher.on('add', (p) => regenerate(p))
        server.watcher.on('change', (p) => regenerate(p))
        server.watcher.on('unlink', (p) => regenerate(p))
        server.watcher.on('addDir', (p) => regenerate(p))
        server.watcher.on('unlinkDir', (p) => regenerate(p))
      }
    }
  ],
})
