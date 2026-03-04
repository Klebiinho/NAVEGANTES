
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);

const files = Object.keys(zip.files);
console.log("Dumping ALL tags from ALL files in zip...");

files.forEach(filename => {
    if (filename.endsWith('.xml')) {
        const xml = zip.file(filename).asText();
        const tags = xml.match(/\{+[^{}]+\}+/g);
        if (tags && tags.length > 0) {
            console.log(`--- ${filename} ---`);
            tags.forEach(tag => console.log(`  ${tag}`));
        }
    }
});
