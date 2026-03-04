
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

// Find all matches for tags
const tags = xml.match(/\{+[^{}]+\}+/g);
console.log("Tags found in document.xml:");
console.log(JSON.stringify(tags, null, 2));

// Check for common malformation
const doubleOpen = xml.match(/\{\{\{\{/g);
const doubleClose = xml.match(/\}\}\}\}/g);
console.log("Double open tags found:", doubleOpen ? doubleOpen.length : 0);
console.log("Double close tags found:", doubleClose ? doubleClose.length : 0);
