
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'public', 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();
fs.writeFileSync(path.join(__dirname, 'extracted_document.xml'), xml);
console.log("Extracted document.xml for review.");
