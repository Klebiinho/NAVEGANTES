
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'public', 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);

Object.keys(zip.files).forEach(filename => {
    if (filename.endsWith('.xml')) {
        let xml = zip.file(filename).asText();
        const oldXml = xml;
        // Fix the specific known corruption
        xml = xml.replace(/\{\{cidade_cliente\}\}\}\}/g, '{{cidade_cliente}}');
        // Fix any other potential 3+ or spaced braces
        xml = xml.replace(/\{{2,}/g, '{{').replace(/\}{2,}/g, '}}');
        xml = xml.replace(/\}\s+\}/g, '}}').replace(/\{\s+\{/g, '{{');

        if (xml !== oldXml) {
            console.log(`FIXED tags in ${filename}`);
            zip.file(filename, xml);
        }
    }
});

const out = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(docxPath, out);
// Also fix it in assets
fs.writeFileSync(path.join(__dirname, 'public', 'assets', 'PROCURACAO.docx'), out);
console.log("Template files FIXED and OVERWRITTEN.");
