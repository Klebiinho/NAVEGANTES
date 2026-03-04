
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();

console.log("Searching for 3+ closing braces after alphanumeric:");
const matches = xml.match(/[A-Za-z0-9_]\}{3,}/g);
if (matches) {
    console.log("MATCHES FOUND:");
    matches.forEach(m => console.log(`  ${m}`));
} else {
    console.log("None found by alphanumeric search.");
}

// Broad search for anything followed by 3 closing braces
const matches2 = xml.match(/.{1,10}\}{3,}/g);
if (matches2) {
    console.log("BROAD MATCHES FOUND:");
    matches2.forEach(m => console.log(`  ${m}`));
}
