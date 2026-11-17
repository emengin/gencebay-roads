import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'production-security-policy',
      apply: 'build',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content:
                "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; font-src 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
            },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  ],
  build: { target: 'es2022', chunkSizeWarningLimit: 850 },
});
