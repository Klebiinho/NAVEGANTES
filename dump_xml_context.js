
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);

Object.keys(zip.files).forEach(filename => {
    if (filename.endsWith('.xml')) {
        const xml = zip.file(filename).asText();
        const matches = xml.match(/.{1,30}\}{2,}.{1,30}/g);
        if (matches) {
            console.log(`--- ${filename} ---`);
            matches.forEach(m => console.log(`  MATCH: ${m}`));
        }
    }
});
