
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);
let xml = zip.file("word/document.xml").asText();

console.log("Context around offset 1498 (and search for ente}}):");
const idx = xml.indexOf('ente}}');
if (idx !== -1) {
    console.log(xml.substring(idx - 20, idx + 20));
} else {
    console.log("'ente}}' not found as literal string.");
}

// Search for any unbalanced tags
const badMatches = xml.match(/\{+[^{}]+\}{3,}/g) || xml.match(/\{{3,}[^{}]+\}+/g);
if (badMatches) {
    console.log("MALFORMED TAGS FOUND:");
    badMatches.forEach(m => console.log(`  ${m}`));
} else {
    console.log("No malformed tags found by regex.");
}
