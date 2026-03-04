
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

// Scan for any single '{' or '}' that is not part of a double one
// We use a sliding window to search
for (let i = 0; i < xml.length; i++) {
    if (xml[i] === '}' && xml[i - 1] !== '}' && xml[i + 1] !== '}') {
        console.log(`Potential orphan '}' at offset ${i}:`);
        console.log(xml.substring(i - 20, i + 20));
    }
}
