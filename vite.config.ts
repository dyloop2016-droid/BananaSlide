import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 4173,
        host: '0.0.0.0',
        proxy: {
          '/volcengine-api': {
            target: 'https://ark.cn-beijing.volces.com',
            changeOrigin: true,
            rewrite: (path: string) => {
              const newPath = path.replace(/^\/volcengine-api/, '/api/v3');
              console.log('[Vite Proxy] 转发:', path, '->', newPath);
              return newPath;
            },
            configure: (proxy, options) => {
              proxy.on('proxyRes', (proxyRes, req, res: any) => {
                console.log('[Vite Proxy] 响应状态:', proxyRes.statusCode, '->', req.url);
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              });
              proxy.on('error', (err, req, res: any) => {
                console.error('[Vite Proxy] 错误:', err.message);
                res.writeHead?.(500, { 'Access-Control-Allow-Origin': '*' });
                res.end?.(JSON.stringify({ error: err.message }));
              });
            }
          }
        }
      },
      preview: {
        port: 4173,
        host: '0.0.0.0',
        proxy: {
          '/volcengine-api': {
            target: 'https://ark.cn-beijing.volces.com',
            changeOrigin: true,
            rewrite: (path: string) => path.replace(/^\/volcengine-api/, '/api/v3'),
            configure: (proxy, options) => {
              proxy.on('proxyRes', (proxyRes, req, res: any) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              });
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.STABILITY_API_KEY': JSON.stringify(env.STABILITY_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
