
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

const matchIdx = xml.indexOf('nome_cliente');
if (matchIdx !== -1) {
    console.log("Context around 'nome_cliente' (raw XML):");
    console.log(xml.substring(matchIdx - 50, matchIdx + 100));
} else {
    console.log("'nome_cliente' NOT FOUND in raw XML!");
}
