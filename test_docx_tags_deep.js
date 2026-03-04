
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
console.log("Checking all XML files in zip...");

files.forEach(filename => {
    if (filename.endsWith('.xml')) {
        const xml = zip.file(filename).asText();
        const doubleOpen = xml.match(/\{{3,}/g);
        const doubleClose = xml.match(/\}{3,}/g);
        const unbalanced = xml.match(/\{{2}[^{}]*\}{3,}/g) || xml.match(/\{{3,}[^{}]*\}{2}/g);

        if (doubleOpen || doubleClose || unbalanced) {
            console.log(`Potential issue in ${filename}:`);
            if (doubleOpen) console.log(`  Too many open braces: ${doubleOpen.length}`);
            if (doubleClose) console.log(`  Too many close braces: ${doubleClose.length}`);
            if (unbalanced) console.log(`  Unbalanced braces found.`);

            const matches = xml.match(/\{+[^{}]+\}+/g);
            if (matches) {
                console.log(`  Tags in this file: ${JSON.stringify(matches)}`);
            }
        }
    }
});
