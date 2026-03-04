
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

Object.keys(zip.files).forEach((filename) => {
    if (filename.endsWith(".xml")) {
        let xmlContent = zip.file(filename).asText();
        // Aggressive fix
        xmlContent = xmlContent.replace(/\{{2,}/g, "{{").replace(/\}{2,}/g, "}}");
        xmlContent = xmlContent.replace(/\}\s+\}/g, "}}").replace(/\{\s+\{/g, "{{");
        zip.file(filename, xmlContent);
    }
});

try {
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });
    console.log("SUCCESS: Document parsed correctly with AGGRESSIVE sanitization!");
} catch (error) {
    console.log("FAILURE: Even aggressive sanitization failed!");
    console.error(error.message);
}
