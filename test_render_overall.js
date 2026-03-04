
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

const renderOne = (zip, filename) => {
    try {
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });
        doc.render({});
        console.log(`SUCCESS rendering whole zip (checking ${filename})`);
    } catch (error) {
        console.error(`ERROR in ${filename}:`);
        console.error(error.message);
        if (error.properties && error.properties.errors) {
            error.properties.errors.forEach(e => console.log(`  -- ${e.properties.explanation} in ${e.properties.file} at offset ${e.properties.offset}`));
        }
    }
};

renderOne(zip, "OVERALL");
