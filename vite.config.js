import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
export default defineConfig({
    plugins: [react()],
    base: repo ? "/".concat(repo, "/") : '/',
});
