
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
console.log("Searching for 3+ or unbalanced braces in all XML files...");

files.forEach(filename => {
    if (filename.endsWith('.xml')) {
        const xml = zip.file(filename).asText();
        // Check for 3 or more braces in a row
        const issueMatches = xml.match(/\{{3,}[^{}]*\}{2,}/g) ||
            xml.match(/\{{2,}[^{}]*\}{3,}/g) ||
            xml.match(/\{{3,}/g) ||
            xml.match(/\}{3,}/g);

        if (issueMatches) {
            console.log(`Potential issue in ${filename}:`);
            issueMatches.forEach(m => console.log(`  Match found: ${m}`));
        }
    }
});
