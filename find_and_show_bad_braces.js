
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);

Object.keys(zip.files).forEach(filename => {
    if (filename.endsWith('.xml')) {
        const xml = zip.file(filename).asText();
        // Look for any occurrence of 3 or more braces
        const openMatches = xml.match(/\{{3,}/g);
        const closeMatches = xml.match(/\}{3,}/g);
        if (openMatches || closeMatches) {
            console.log(`Found issues in ${filename}:`);
            if (openMatches) console.log(`  Open issues: ${openMatches.length} (${openMatches[0]})`);
            if (closeMatches) console.log(`  Close issues: ${closeMatches.length} (${closeMatches[0]})`);

            // Show snippet around first issue
            let firstIdx = xml.search(/\{{3,}/);
            if (firstIdx === -1) firstIdx = xml.search(/\}{3,}/);
            console.log(`  Snippet: ${xml.substring(firstIdx - 30, firstIdx + 50)}`);
        }
    }
});
