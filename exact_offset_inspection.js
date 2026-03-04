
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

console.log("SURROUNDING 20 chars of 1498:");
console.log(`[${xml.substring(1490, 1510)}]`);
console.log("Hex dump of those chars:");
for (let i = 1490; i < 1510; i++) {
    console.log(`${i}: ${xml[i]} (${xml.charCodeAt(i).toString(16)})`);
}
