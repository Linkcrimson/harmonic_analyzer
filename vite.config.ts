import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
    base: './',
    server: {
        open: true
    },
    plugins: [viteSingleFile()],
    build: {
        outDir: 'docs',
        rollupOptions: {
            input: './index.html'
        }
    }
});
