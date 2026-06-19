import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget =
    env.VITE_DEV_BACKEND_URL ?? env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
  const devPort = 5173
  const strictPort = true

  // #region agent log
  fetch('http://127.0.0.1:7710/ingest/8f9dd29b-f72f-45b0-934b-d4c329cf521d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74508'},body:JSON.stringify({sessionId:'d74508',location:'vite.config.ts:config',message:'vite dev server config resolved',data:{devPort,strictPort,host:'127.0.0.1',mode},timestamp:Date.now(),hypothesisId:'C',runId:'pre-fix'})}).catch(()=>{});
  // #endregion

  return {
    plugins: [
      react(),
      {
        name: 'debug-port-bind',
        configureServer(server) {
          server.httpServer?.on('error', (err: NodeJS.ErrnoException) => {
            // #region agent log
            fetch('http://127.0.0.1:7710/ingest/8f9dd29b-f72f-45b0-934b-d4c329cf521d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74508'},body:JSON.stringify({sessionId:'d74508',location:'vite.config.ts:httpServer:error',message:'dev server bind error',data:{code:err.code,message:err.message,port:devPort,strictPort},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
            // #endregion
          })
          server.httpServer?.once('listening', () => {
            const addr = server.httpServer?.address()
            // #region agent log
            fetch('http://127.0.0.1:7710/ingest/8f9dd29b-f72f-45b0-934b-d4c329cf521d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74508'},body:JSON.stringify({sessionId:'d74508',location:'vite.config.ts:httpServer:listening',message:'dev server listening',data:{address:addr},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
            // #endregion
          })
        },
      },
    ],
    server: {
      host: '127.0.0.1',
      port: devPort,
      strictPort,
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/health': { target: backendTarget, changeOrigin: true },
        '/internal': { target: backendTarget, changeOrigin: true },
        '/ws': { target: backendTarget.replace(/^http/, 'ws'), ws: true },
      },
    },
  }
})
