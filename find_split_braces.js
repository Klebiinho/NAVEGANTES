
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

// Search for tag ending followed by more closing braces in close proximity, across XML nodes
const matches = xml.match(/ente\}\}.{1,200}\}/g);
if (matches) {
    console.log("MALFORMED SPLIT TAGS FOUND:");
    matches.forEach(m => console.log(`  ${m}`));
}
