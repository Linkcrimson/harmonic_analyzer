import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, 'dist', 'index.html');
const jsPath = path.join(__dirname, 'dist', 'assets', 'index.js');

try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const js = fs.readFileSync(jsPath, 'utf8');

    const scriptTag = '<script type="module" crossorigin src="./assets/index.js"></script>';

    if (html.includes(scriptTag)) {
        const newScript = `<script>\n${js}\n</script>`;
        html = html.replace(scriptTag, newScript);
        fs.writeFileSync(htmlPath, html);
        console.log('Successfully inlined JS into index.html');
    } else {
        console.error('Could not find exact script tag to replace.');
        const regex = /<script type="module" crossorigin src="\.\/assets\/index\.js"><\/script>/;
        if (regex.test(html)) {
            const newScript = `<script>\n${js}\n</script>`;
            html = html.replace(regex, newScript);
            fs.writeFileSync(htmlPath, html);
            console.log('Successfully inlined JS into index.html using regex');
        } else {
            console.log('HTML content snippet:', html.substring(0, 1000));
        }
    }
} catch (e) {
    console.error('Error:', e);
}
