
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);

let xml = zip.file("word/document.xml").asText();
// Try common fixes
xml = xml.replace(/\}{3,}/g, '}}').replace(/\{{3,}/g, '{{');
zip.file("word/document.xml", xml);

try {
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });
    console.log("Rendering SUCCESSFUL with XML fixes!");
} catch (error) {
    console.log("FAILED even with XML fixes!");
}
