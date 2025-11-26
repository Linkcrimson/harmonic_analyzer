import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const htmlPath = join(__dirname, 'dist', 'index.html');
const jsPath = join(__dirname, 'dist', 'assets', 'index.js');

// Read files
let html = readFileSync(htmlPath, 'utf-8');
const js = readFileSync(jsPath, 'utf-8');

// Replace script tag with inline script
html = html.replace(
    /<script type="module" crossorigin src="[^"]+"><\/script>/,
    `<script type="module">${js}</script>`
);

// Write back
writeFileSync(htmlPath, html, 'utf-8');

console.log('✅ JavaScript inlined successfully into dist/index.html');
